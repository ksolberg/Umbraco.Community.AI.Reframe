using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.Formats.Webp;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace AI.Reframe.Reframing;

/// <summary>An encoded image ready to be written to media: bytes plus how to name and serve them.</summary>
public readonly record struct EncodedImage(byte[] Bytes, string ContentType, string Extension, PixelSize Size);

/// <summary>
/// Turns a reframe plan into output bytes: crops with ImageSharp (instant, free), and encodes both
/// crop and outpaint results to the configured output format (WebP by default).
/// </summary>
public static class ReframeImageProcessor
{
    /// <summary>Crops <paramref name="source"/> to the plan's source rectangle, scales to the plan's output size, and encodes.</summary>
    public static EncodedImage Crop(byte[] source, ReframePlan plan, ReframeOutputOptions output)
    {
        ArgumentNullException.ThrowIfNull(source);

        using var image = Image.Load<Rgba32>(source);
        var rect = plan.SourceRect;
        image.Mutate(c => c.Crop(new Rectangle(rect.X, rect.Y, rect.Width, rect.Height)));

        if (image.Width != plan.Output.Width || image.Height != plan.Output.Height)
        {
            image.Mutate(c => c.Resize(plan.Output.Width, plan.Output.Height));
        }

        return Encode(image, output.Format);
    }

    /// <summary>Re-encodes already-rendered bytes (e.g. an outpaint result) to the configured output format.</summary>
    public static EncodedImage Encode(byte[] imageBytes, ReframeOutputOptions output)
    {
        ArgumentNullException.ThrowIfNull(imageBytes);
        using var image = Image.Load<Rgba32>(imageBytes);
        return Encode(image, output.Format);
    }

    private static EncodedImage Encode(Image<Rgba32> image, string format)
    {
        using var ms = new MemoryStream();
        var (contentType, extension) = format?.Trim().ToLowerInvariant() switch
        {
            "png" => SavePng(image, ms),
            _ => SaveWebp(image, ms),
        };

        return new EncodedImage(ms.ToArray(), contentType, extension, new PixelSize(image.Width, image.Height));
    }

    private static (string ContentType, string Extension) SaveWebp(Image image, Stream stream)
    {
        image.Save(stream, new WebpEncoder { Quality = 82 });
        return ("image/webp", "webp");
    }

    private static (string ContentType, string Extension) SavePng(Image image, Stream stream)
    {
        image.Save(stream, new PngEncoder());
        return ("image/png", "png");
    }
}
