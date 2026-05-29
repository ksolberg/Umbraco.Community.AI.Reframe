using System.Net;
using System.Text;
using AI.Reframe.Reframing;
using Microsoft.Extensions.Options;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace AI.Reframe.Tests;

public class OpenAiGptImageProviderTests
{
    private sealed class StubHandler : HttpMessageHandler
    {
        private readonly Func<HttpResponseMessage> _responder;
        public HttpRequestMessage? Request { get; private set; }
        public string? Body { get; private set; }

        public StubHandler(Func<HttpResponseMessage> responder) => _responder = responder;

        protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            Request = request;
            Body = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
            return _responder();
        }
    }

    private static OutpaintRequest BuildRequest()
    {
        var source = TestImages.SolidPng(10, 10, new Rgba32(0, 128, 255, 255));
        var plan = ReframeGeometry.PlanOutpaint(new PixelSize(10, 10), new Ratio(2, 1)); // -> 20x10
        return new OutpaintRequest(source, "image/png", plan);
    }

    private static OpenAiGptImageProvider BuildProvider(StubHandler handler)
    {
        var options = Options.Create(new AIReframeOptions
        {
            OpenAI = { ApiKey = "sk-test", BaseUrl = "https://api.test/v1", Model = "gpt-image-2" },
        });
        return new OpenAiGptImageProvider(new HttpClient(handler), options);
    }

    [Fact]
    public async Task Sends_a_well_formed_image_edit_request_and_parses_the_result()
    {
        var resultPng = TestImages.SolidPng(20, 10, new Rgba32(10, 20, 30, 255));
        var responseJson = $"{{\"data\":[{{\"b64_json\":\"{Convert.ToBase64String(resultPng)}\"}}]}}";
        var handler = new StubHandler(() =>
        {
            var response = new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(responseJson, Encoding.UTF8, "application/json"),
            };
            response.Headers.TryAddWithoutValidation("x-request-id", "req_abc123");
            return response;
        });

        var provider = BuildProvider(handler);
        var result = await provider.OutpaintAsync(BuildRequest());

        // Request contract
        Assert.Equal(HttpMethod.Post, handler.Request!.Method);
        Assert.EndsWith("/images/edits", handler.Request.RequestUri!.AbsoluteUri);
        Assert.Equal("Bearer", handler.Request.Headers.Authorization!.Scheme);
        Assert.Contains("sk-test", handler.Request.Headers.Authorization.Parameter);
        Assert.Contains("name=model", handler.Body);
        Assert.Contains("gpt-image-2", handler.Body);
        Assert.Contains("name=size", handler.Body);
        Assert.Contains("20x10", handler.Body); // output dimensions
        Assert.Contains("name=image", handler.Body);
        Assert.Contains("name=mask", handler.Body);

        // Parsed result
        Assert.Equal(new PixelSize(20, 10), result.Size);
        Assert.Equal("req_abc123", result.RequestId);
        Assert.NotEmpty(result.Image);
        Assert.Equal(new PixelSize(10, 10), result.SourceRect.Size); // original footprint preserved
        Assert.True(result.Elapsed >= TimeSpan.Zero);
    }

    [Fact]
    public async Task Maps_an_api_error_to_a_provider_exception_with_the_message()
    {
        var handler = new StubHandler(() => new HttpResponseMessage(HttpStatusCode.BadRequest)
        {
            Content = new StringContent("{\"error\":{\"message\":\"content policy violation\"}}", Encoding.UTF8, "application/json"),
        });

        var provider = BuildProvider(handler);

        var ex = await Assert.ThrowsAsync<ReframeProviderException>(() => provider.OutpaintAsync(BuildRequest()));
        Assert.Contains("content policy violation", ex.Message);
    }

    [Fact]
    public async Task Fails_clearly_when_no_api_key_is_configured()
    {
        var handler = new StubHandler(() => new HttpResponseMessage(HttpStatusCode.OK));
        var provider = new OpenAiGptImageProvider(
            new HttpClient(handler),
            Options.Create(new AIReframeOptions { OpenAI = { ApiKey = null } }));

        var ex = await Assert.ThrowsAsync<ReframeProviderException>(() => provider.OutpaintAsync(BuildRequest()));
        Assert.Contains("API key", ex.Message);
        Assert.Null(handler.Request); // never hit the network
    }
}
