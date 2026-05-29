using System.Globalization;

namespace AI.Reframe.Reframing;

/// <summary>How a source image is taken to a new aspect ratio.</summary>
public enum ReframeMode
{
    /// <summary>Trim pixels off one axis (geometric, instant, free). Keeps a sub-region of the source.</summary>
    Crop,

    /// <summary>Extend the canvas and let the AI provider invent the new pixels. Keeps every source pixel.</summary>
    Outpaint,
}

/// <summary>Which part of the source a crop keeps along the trimmed axis.</summary>
public enum CropAnchor
{
    Center,
    Top,
    Bottom,
}

/// <summary>
/// An aspect ratio expressed as an integer pair, e.g. 16:9. The pair is kept as given
/// (not reduced) so it can round-trip through the API and name media items faithfully.
/// </summary>
public readonly record struct Ratio(int Width, int Height)
{
    public double Value => (double)Width / Height;

    /// <summary>Parses "w:h" (e.g. "16:9"). Throws on malformed input or a non-positive term.</summary>
    public static Ratio Parse(string text)
    {
        if (TryParse(text, out var ratio))
        {
            return ratio;
        }

        throw new FormatException($"'{text}' is not a valid aspect ratio. Expected 'w:h' with positive integers, e.g. '16:9'.");
    }

    public static bool TryParse(string? text, out Ratio ratio)
    {
        ratio = default;
        if (string.IsNullOrWhiteSpace(text))
        {
            return false;
        }

        var parts = text.Split(':');
        if (parts.Length != 2)
        {
            return false;
        }

        if (!int.TryParse(parts[0], NumberStyles.Integer, CultureInfo.InvariantCulture, out var w) ||
            !int.TryParse(parts[1], NumberStyles.Integer, CultureInfo.InvariantCulture, out var h) ||
            w <= 0 || h <= 0)
        {
            return false;
        }

        ratio = new Ratio(w, h);
        return true;
    }

    public override string ToString() => $"{Width}:{Height}";
}

/// <summary>A pixel size. Both dimensions are positive for any real image.</summary>
public readonly record struct PixelSize(int Width, int Height)
{
    public double AspectRatio => (double)Width / Height;

    public long Area => (long)Width * Height;
}

/// <summary>An axis-aligned pixel rectangle. Origin is top-left, the convention ImageSharp uses.</summary>
public readonly record struct PixelRect(int X, int Y, int Width, int Height)
{
    public PixelSize Size => new(Width, Height);
}
