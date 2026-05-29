using System.Diagnostics;
using System.Net.Http.Headers;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace AI.Reframe.Reframing;

/// <summary>
/// Self-contained outpaint provider calling OpenAI's gpt-image-2 image-edit endpoint. Takes no
/// dependency on Umbraco.AI; configured entirely from the <c>AIReframe</c> section (see ADR-0003).
/// </summary>
public sealed class OpenAiGptImageProvider : IReframeImageProvider
{
    /// <summary>Named <see cref="HttpClient"/> registered for this provider.</summary>
    public const string HttpClientName = "AIReframe.OpenAI";

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _http;
    private readonly OpenAiImageOptions _options;
    private readonly ILogger<OpenAiGptImageProvider> _logger;

    public OpenAiGptImageProvider(
        HttpClient http,
        IOptions<AIReframeOptions> options,
        ILogger<OpenAiGptImageProvider> logger)
    {
        _http = http;
        _options = options.Value.OpenAI;
        _logger = logger;
    }

    public string Name => $"OpenAI {_options.Model}";

    public async Task<OutpaintResult> OutpaintAsync(OutpaintRequest request, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(request);

        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            throw new ReframeProviderException(
                "No OpenAI API key configured. Set AIReframe:OpenAI:ApiKey via user-secrets or the AIReframe__OpenAI__ApiKey environment variable.");
        }

        var plan = request.Plan;

        // gpt-image-2 only accepts sizes that meet its constraints (multiple-of-16 edges, pixel
        // band, ≤3:1, ≤3840px). Snap the planned output to a valid size for the request, then resize
        // the result back to the planned output below so the rest of the pipeline is unaffected.
        var apiSize = GptImageSize.Constrain(plan.Output);
        var apiPlan = plan with
        {
            Output = apiSize,
            SourceRect = ReframeGeometry.SourceRectWithin(apiSize, plan.Source),
        };

        OutpaintCanvas canvas;
        try
        {
            canvas = OutpaintCanvasBuilder.Build(request.SourceImage, apiPlan);
        }
        catch (Exception ex) when (ex is not ReframeProviderException)
        {
            throw new ReframeProviderException("Failed to prepare the outpaint canvas from the source image.", ex);
        }

        var url = $"{_options.BaseUrl.TrimEnd('/')}/images/edits";
        using var content = BuildMultipart(canvas, request.Prompt ?? _options.DefaultPrompt, apiSize);
        using var message = new HttpRequestMessage(HttpMethod.Post, url)
        {
            Content = content,
        };
        message.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        _logger.LogInformation(
            "AI.Reframe: outpaint → {Model} {Width}x{Height} (planned {PlannedWidth}x{PlannedHeight}) via {Url}",
            _options.Model, apiSize.Width, apiSize.Height, plan.Output.Width, plan.Output.Height, url);

        var stopwatch = Stopwatch.StartNew();
        HttpResponseMessage response;
        try
        {
            response = await _http.SendAsync(message, HttpCompletionOption.ResponseContentRead, cancellationToken);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            _logger.LogInformation("AI.Reframe: outpaint cancelled by caller after {ElapsedMs}ms", stopwatch.ElapsedMilliseconds);
            throw;
        }
        catch (OperationCanceledException ex)
        {
            // Not the caller's token → the HttpClient timeout elapsed.
            _logger.LogWarning(ex, "AI.Reframe: outpaint timed out after {ElapsedMs}ms (provider timeout)", stopwatch.ElapsedMilliseconds);
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AI.Reframe: outpaint request could not be sent");
            throw new ReframeProviderException("The OpenAI image request could not be sent.", ex);
        }

        using (response)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            var requestId = ReadRequestId(response);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning(
                    "AI.Reframe: outpaint failed ({Status}) after {ElapsedMs}ms (request {RequestId}): {Error}",
                    (int)response.StatusCode, stopwatch.ElapsedMilliseconds, requestId, ExtractError(body));
                throw new ReframeProviderException(
                    $"OpenAI image edit failed ({(int)response.StatusCode}): {ExtractError(body)}");
            }

            var imageBytes = ParseFirstImage(body);
            stopwatch.Stop();

            _logger.LogInformation(
                "AI.Reframe: outpaint completed in {ElapsedMs}ms (request {RequestId})",
                stopwatch.ElapsedMilliseconds, string.IsNullOrEmpty(requestId) ? "n/a" : requestId);

            var normalized = NormalizeToOutput(imageBytes, plan.Output);
            return new OutpaintResult(
                Image: normalized,
                ContentType: "image/png",
                Size: plan.Output,
                SourceRect: plan.SourceRect,
                RequestId: requestId,
                Elapsed: stopwatch.Elapsed);
        }
    }

    private MultipartFormDataContent BuildMultipart(OutpaintCanvas canvas, string prompt, PixelSize output)
    {
        var form = new MultipartFormDataContent
        {
            { new StringContent(_options.Model), "model" },
            { new StringContent(prompt), "prompt" },
            { new StringContent("1"), "n" },
            { new StringContent($"{output.Width}x{output.Height}"), "size" },
        };

        form.Add(PngPart(canvas.Canvas), "image", "image.png");
        form.Add(PngPart(canvas.Mask), "mask", "mask.png");
        return form;
    }

    private static ByteArrayContent PngPart(byte[] bytes)
    {
        var part = new ByteArrayContent(bytes);
        part.Headers.ContentType = new MediaTypeHeaderValue("image/png");
        return part;
    }

    private static string ReadRequestId(HttpResponseMessage response)
    {
        foreach (var header in new[] { "x-request-id", "openai-request-id" })
        {
            if (response.Headers.TryGetValues(header, out var values))
            {
                var value = values.FirstOrDefault();
                if (!string.IsNullOrWhiteSpace(value))
                {
                    return value;
                }
            }
        }

        return string.Empty;
    }

    private static byte[] ParseFirstImage(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("data", out var data) &&
                data.ValueKind == JsonValueKind.Array &&
                data.GetArrayLength() > 0)
            {
                var first = data[0];
                if (first.TryGetProperty("b64_json", out var b64) && b64.ValueKind == JsonValueKind.String)
                {
                    return Convert.FromBase64String(b64.GetString()!);
                }
            }
        }
        catch (Exception ex) when (ex is JsonException or FormatException)
        {
            throw new ReframeProviderException("OpenAI returned a response that could not be parsed as an image.", ex);
        }

        throw new ReframeProviderException("OpenAI returned no image data.");
    }

    private static string ExtractError(string body)
    {
        try
        {
            using var doc = JsonDocument.Parse(body);
            if (doc.RootElement.TryGetProperty("error", out var error) &&
                error.TryGetProperty("message", out var message) &&
                message.ValueKind == JsonValueKind.String)
            {
                return message.GetString()!;
            }
        }
        catch (JsonException)
        {
            // fall through to the raw body
        }

        return string.IsNullOrWhiteSpace(body) ? "no error detail" : body;
    }

    /// <summary>Guarantees the result matches the plan's output size, so the plan's generated-region rectangle stays valid.</summary>
    private static byte[] NormalizeToOutput(byte[] imageBytes, PixelSize output)
    {
        using var image = Image.Load<Rgba32>(imageBytes);
        if (image.Width == output.Width && image.Height == output.Height)
        {
            return imageBytes;
        }

        image.Mutate(c => c.Resize(output.Width, output.Height));
        using var ms = new MemoryStream();
        image.Save(ms, new PngEncoder());
        return ms.ToArray();
    }
}
