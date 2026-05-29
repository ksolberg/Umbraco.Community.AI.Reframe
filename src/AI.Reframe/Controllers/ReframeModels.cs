namespace AI.Reframe.Controllers;

/// <summary>The source image's dimensions, current ratio, and public URL — for the rail header and the projected preview.</summary>
public sealed record ReframeSourceInfo(Guid MediaKey, int Width, int Height, string Ratio, string Url);

/// <summary>One target-ratio chip: whether crop is offered and how much content the change costs.</summary>
public sealed record ReframeRatioOption(string Ratio, bool CanCrop, double ContentChangeFraction);

/// <summary>Everything the controls rail needs on open: the source, the preset chips, output cap, and provider note.</summary>
public sealed record ReframeCapabilitiesResponse(
    ReframeSourceInfo Source,
    IReadOnlyList<ReframeRatioOption> Presets,
    int MaxEdge,
    string ProviderName);

/// <summary>Request to preview a crop.</summary>
public sealed record ReframeCropRequest(Guid MediaKey, string Ratio, string? Anchor);

/// <summary>Request to run an outpaint.</summary>
public sealed record ReframeOutpaintRequest(Guid MediaKey, string Ratio, string? Prompt);

/// <summary>A pixel rectangle in output space; the generated-region indicators draw around this.</summary>
public sealed record ReframeRect(int X, int Y, int Width, int Height);

/// <summary>A previewed reframe result, held server-side under <see cref="Token"/> until accepted.</summary>
public sealed record ReframePreviewResponse(
    string Token,
    string Mode,
    int OutputWidth,
    int OutputHeight,
    ReframeRect SourceRect,
    double GeneratedFraction,
    string PreviewDataUrl,
    string? RequestId,
    long? ElapsedMs);

/// <summary>Request to accept a previewed candidate and persist it as new media.</summary>
public sealed record ReframeAcceptRequest(Guid MediaKey, string Token);

/// <summary>The new Media item that Accept created.</summary>
public sealed record ReframeAcceptResponse(Guid MediaKey, string Name);
