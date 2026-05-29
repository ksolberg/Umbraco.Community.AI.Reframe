using AI.Reframe.Reframing;
using Asp.Versioning;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Umbraco.Cms.Core.Security;

namespace AI.Reframe.Controllers;

/// <summary>
/// Thin backoffice API for the Reframe workspace view. All geometry lives in
/// <see cref="ReframeGeometry"/>; this controller only marshals media in/out and holds previewed
/// candidates until Accept.
/// </summary>
[ApiVersion("1.0")]
[ApiExplorerSettings(GroupName = "AI.Reframe")]
public class ReframeController : AIReframeApiControllerBase
{
    private readonly ReframeMediaReader _reader;
    private readonly ReframeMediaWriter _writer;
    private readonly IReframeImageProvider _imageProvider;
    private readonly ReframeCandidateCache _candidates;
    private readonly IBackOfficeSecurityAccessor _backOfficeSecurityAccessor;
    private readonly AIReframeOptions _options;

    public ReframeController(
        ReframeMediaReader reader,
        ReframeMediaWriter writer,
        IReframeImageProvider imageProvider,
        ReframeCandidateCache candidates,
        IBackOfficeSecurityAccessor backOfficeSecurityAccessor,
        IOptions<AIReframeOptions> options)
    {
        _reader = reader;
        _writer = writer;
        _imageProvider = imageProvider;
        _candidates = candidates;
        _backOfficeSecurityAccessor = backOfficeSecurityAccessor;
        _options = options.Value;
    }

    /// <summary>Source dimensions plus, for each preset ratio, whether crop is offered and what it costs.</summary>
    [HttpGet("capabilities")]
    [ProducesResponseType<ReframeCapabilitiesResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult Capabilities([FromQuery] Guid mediaKey)
    {
        var source = _reader.Read(mediaKey);
        if (source is null)
        {
            return NotFound();
        }

        var size = source.Size;
        var presets = ReframeGeometry
            .Describe(size, ReframePresets.All)
            .Select(c => new ReframeRatioOption(c.Target.ToString(), c.CanCrop, c.ContentChangeFraction))
            .ToList();

        var info = new ReframeSourceInfo(mediaKey, size.Width, size.Height, ReduceRatio(size), source.Url);
        return Ok(new ReframeCapabilitiesResponse(info, presets, _options.Output.MaxEdge, _imageProvider.Name));
    }

    /// <summary>Previews a geometric crop and caches the cropped bytes for Accept.</summary>
    [HttpPost("crop")]
    [ProducesResponseType<ReframePreviewResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public IActionResult Crop([FromBody] ReframeCropRequest request)
    {
        if (!Ratio.TryParse(request.Ratio, out var ratio))
        {
            return BadRequest($"'{request.Ratio}' is not a valid ratio.");
        }

        var source = _reader.Read(request.MediaKey);
        if (source is null)
        {
            return NotFound();
        }

        var anchor = Enum.TryParse<CropAnchor>(request.Anchor, ignoreCase: true, out var parsed) ? parsed : CropAnchor.Center;
        var plan = ReframeGeometry.PlanCrop(source.Size, ratio, anchor, _options.Output.MaxEdge);
        var encoded = ReframeImageProcessor.Crop(source.Bytes, plan, _options.Output);

        var token = _candidates.Store(new ReframeCandidate(source.Key, ratio, encoded));
        return Ok(BuildPreview(token, plan, encoded, requestId: null, elapsed: null));
    }

    /// <summary>Runs the outpaint provider, caches the result for Accept, and returns it for preview.</summary>
    [HttpPost("outpaint")]
    [ProducesResponseType<ReframePreviewResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status502BadGateway)]
    public async Task<IActionResult> Outpaint([FromBody] ReframeOutpaintRequest request, CancellationToken cancellationToken)
    {
        if (!Ratio.TryParse(request.Ratio, out var ratio))
        {
            return BadRequest($"'{request.Ratio}' is not a valid ratio.");
        }

        var source = _reader.Read(request.MediaKey);
        if (source is null)
        {
            return NotFound();
        }

        var plan = ReframeGeometry.PlanOutpaint(source.Size, ratio, _options.Output.MaxEdge);

        OutpaintResult result;
        try
        {
            result = await _imageProvider.OutpaintAsync(
                new OutpaintRequest(source.Bytes, source.ContentType, plan, request.Prompt),
                cancellationToken);
        }
        catch (ReframeProviderException ex)
        {
            return StatusCode(StatusCodes.Status502BadGateway, ex.Message);
        }

        var encoded = ReframeImageProcessor.Encode(result.Image, _options.Output);
        var token = _candidates.Store(new ReframeCandidate(source.Key, ratio, encoded));
        return Ok(BuildPreview(token, plan, encoded, result.RequestId, (long)result.Elapsed.TotalMilliseconds));
    }

    /// <summary>Persists a previewed candidate as a new Image media item beside the source.</summary>
    [HttpPost("accept")]
    [ProducesResponseType<ReframeAcceptResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status410Gone)]
    public IActionResult Accept([FromBody] ReframeAcceptRequest request)
    {
        var candidate = _candidates.Get(request.Token);
        if (candidate is null)
        {
            return StatusCode(StatusCodes.Status410Gone, "This preview has expired. Please regenerate.");
        }

        var source = _reader.Read(request.MediaKey);
        if (source is null)
        {
            return NotFound();
        }

        var userId = _backOfficeSecurityAccessor.BackOfficeSecurity?.CurrentUser?.Id ?? -1;
        var created = _writer.Create(source, candidate.Image, candidate.Ratio, userId);
        _candidates.Remove(request.Token);

        return Ok(new ReframeAcceptResponse(created.Key, created.Name));
    }

    private static ReframePreviewResponse BuildPreview(
        string token,
        ReframePlan plan,
        EncodedImage encoded,
        string? requestId,
        long? elapsed)
    {
        var rect = new ReframeRect(plan.SourceRect.X, plan.SourceRect.Y, plan.SourceRect.Width, plan.SourceRect.Height);
        var dataUrl = $"data:{encoded.ContentType};base64,{Convert.ToBase64String(encoded.Bytes)}";
        return new ReframePreviewResponse(
            Token: token,
            Mode: plan.Mode == ReframeMode.Crop ? "crop" : "outpaint",
            OutputWidth: plan.Output.Width,
            OutputHeight: plan.Output.Height,
            SourceRect: rect,
            GeneratedFraction: plan.GeneratedFraction,
            PreviewDataUrl: dataUrl,
            RequestId: string.IsNullOrEmpty(requestId) ? null : requestId,
            ElapsedMs: elapsed);
    }

    /// <summary>Reduces a pixel size to its lowest-terms ratio string (e.g. 1920x1080 -> "16:9").</summary>
    private static string ReduceRatio(PixelSize size)
    {
        var gcd = Gcd(size.Width, size.Height);
        return gcd == 0 ? $"{size.Width}:{size.Height}" : $"{size.Width / gcd}:{size.Height / gcd}";
    }

    private static int Gcd(int a, int b)
    {
        while (b != 0)
        {
            (a, b) = (b, a % b);
        }

        return Math.Abs(a);
    }
}
