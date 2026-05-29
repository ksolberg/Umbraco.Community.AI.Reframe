namespace AI.Reframe.Reframing;

/// <summary>An outpaint request: the source image bytes plus the resolved plan describing the target canvas.</summary>
/// <param name="SourceImage">The original image's encoded bytes (as stored in Umbraco media).</param>
/// <param name="SourceContentType">MIME type of <paramref name="SourceImage"/>, e.g. image/jpeg.</param>
/// <param name="Plan">
/// The outpaint plan from <see cref="ReframeGeometry.PlanOutpaint"/>: output size, and the rectangle
/// within the output where the original pixels sit. The provider must place the source there and
/// generate everything outside it.
/// </param>
/// <param name="Prompt">Optional override for the provider's default outpaint prompt.</param>
public sealed record OutpaintRequest(
    byte[] SourceImage,
    string SourceContentType,
    ReframePlan Plan,
    string? Prompt = null);

/// <summary>The outcome of an outpaint.</summary>
/// <param name="Image">The generated image's encoded bytes, exactly <paramref name="Size"/> pixels.</param>
/// <param name="ContentType">MIME type of <paramref name="Image"/>.</param>
/// <param name="Size">The result's pixel size (matches the plan's output).</param>
/// <param name="SourceRect">Where the original pixels sit within the result; everything outside is generated.</param>
/// <param name="RequestId">The provider's request id, surfaced to the editor for support/audit.</param>
/// <param name="Elapsed">Wall-clock time the provider call took.</param>
public sealed record OutpaintResult(
    byte[] Image,
    string ContentType,
    PixelSize Size,
    PixelRect SourceRect,
    string RequestId,
    TimeSpan Elapsed);

/// <summary>Raised when an outpaint provider fails (network, auth, content policy, bad response).</summary>
public sealed class ReframeProviderException : Exception
{
    public ReframeProviderException(string message, Exception? inner = null) : base(message, inner)
    {
    }
}

/// <summary>
/// The seam between AI.Reframe and whatever generates outpainted pixels. The shippable package binds
/// this to a self-contained OpenAI gpt-image-2 implementation; when Umbraco.AI ships an image
/// capability, an Umbraco.AI-backed provider can be registered here instead without touching callers
/// (see ADR-0003).
/// </summary>
public interface IReframeImageProvider
{
    /// <summary>A short identifier for the active provider, shown as a neutral provider note in the UI.</summary>
    string Name { get; }

    /// <summary>Extends <paramref name="request"/>'s source to its target canvas, generating the surrounding pixels.</summary>
    /// <exception cref="ReframeProviderException">The provider could not produce a result.</exception>
    Task<OutpaintResult> OutpaintAsync(OutpaintRequest request, CancellationToken cancellationToken = default);
}
