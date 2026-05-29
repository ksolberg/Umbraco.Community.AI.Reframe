namespace AI.Reframe.Reframing;

/// <summary>
/// Binds the <c>AIReframe</c> configuration section. The OpenAI API key is expected from a
/// secret store (user-secrets in development, <c>AIReframe__OpenAI__ApiKey</c> in deployment) and
/// must never be committed to appsettings.
/// </summary>
public sealed class AIReframeOptions
{
    public const string SectionName = "AIReframe";

    /// <summary>Which <see cref="IReframeImageProvider"/> backs outpaint. Only "OpenAI" ships today.</summary>
    public string Provider { get; set; } = "OpenAI";

    public OpenAiImageOptions OpenAI { get; set; } = new();

    public ReframeOutputOptions Output { get; set; } = new();
}

public sealed class OpenAiImageOptions
{
    /// <summary>Secret. Supplied via user-secrets / environment, never appsettings.</summary>
    public string? ApiKey { get; set; }

    public string Model { get; set; } = "gpt-image-2";

    public string BaseUrl { get; set; } = "https://api.openai.com/v1";

    /// <summary>The instruction sent with every outpaint; the seam between the source and the new pixels should be invisible.</summary>
    public string DefaultPrompt { get; set; } =
        "Extend this image naturally beyond its original edges, continuing the existing scene, " +
        "lighting, textures and perspective so the added regions are indistinguishable from the original. " +
        "Do not add new subjects, text or borders.";

    /// <summary>Per-request timeout for the provider call. gpt-image-2's reasoning ("thinking") pass can make
    /// a single edit run well over a minute, so this is generous; it caps how long Generate can appear to hang.</summary>
    public int TimeoutSeconds { get; set; } = 180;
}

public sealed class ReframeOutputOptions
{
    /// <summary>Output image format for reframed media. "webp" today.</summary>
    public string Format { get; set; } = "webp";

    /// <summary>Longest edge of any reframed output; larger results are scaled down to this.</summary>
    public int MaxEdge { get; set; } = 2048;
}
