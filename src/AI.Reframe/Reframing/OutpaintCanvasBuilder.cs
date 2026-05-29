using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;

namespace AI.Reframe.Reframing;

/// <summary>The two PNGs an image-edit outpaint needs: the canvas to extend and the mask marking what to generate.</summary>
/// <param name="Canvas">Output-sized RGBA PNG: the source composited at its rectangle, fully transparent elsewhere.</param>
/// <param name="Mask">Output-sized RGBA PNG: opaque over the source rectangle (keep), transparent elsewhere (generate).</param>
public readonly record struct OutpaintCanvas(byte[] Canvas, byte[] Mask);

/// <summary>
/// Builds the canvas + mask pair for an outpaint, independent of any provider or HTTP, so the
/// geometry-to-pixels mapping (source centred, margins transparent, mask aligned to the generated
/// region) can be unit-tested directly.
/// </summary>
/// <remarks>
/// Mask convention follows the OpenAI image-edit endpoint: fully transparent pixels mark where the
/// model should paint, opaque pixels are preserved. So the mask is opaque exactly over the source
/// footprint and transparent over the regions the plan flags as generated.
/// </remarks>
public static class OutpaintCanvasBuilder
{
    public static OutpaintCanvas Build(byte[] sourceImage, ReframePlan plan)
    {
        ArgumentNullException.ThrowIfNull(sourceImage);

        var output = plan.Output;
        var rect = plan.SourceRect;

        using var source = Image.Load<Rgba32>(sourceImage);
        if (source.Width != rect.Width || source.Height != rect.Height)
        {
            source.Mutate(c => c.Resize(rect.Width, rect.Height));
        }

        using var canvas = new Image<Rgba32>(output.Width, output.Height, Color.Transparent);
        canvas.Mutate(c => c.DrawImage(source, new Point(rect.X, rect.Y), 1f));

        using var mask = new Image<Rgba32>(output.Width, output.Height, Color.Transparent);
        using var keep = new Image<Rgba32>(rect.Width, rect.Height, Color.White);
        mask.Mutate(c => c.DrawImage(keep, new Point(rect.X, rect.Y), 1f));

        return new OutpaintCanvas(Encode(canvas), Encode(mask));
    }

    private static byte[] Encode(Image image)
    {
        using var ms = new MemoryStream();
        image.Save(ms, new PngEncoder());
        return ms.ToArray();
    }
}
