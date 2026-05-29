using AI.Reframe.Reframing;
using SixLabors.ImageSharp.PixelFormats;
using Xunit;

namespace AI.Reframe.Tests;

public class OutpaintCanvasBuilderTests
{
    [Fact]
    public void Canvas_places_source_centred_with_transparent_margins_and_mask_marks_only_the_generated_region()
    {
        // 10x10 red source, outpaint to 2:1 -> 20x10 output, source centred at x=5..15.
        var source = TestImages.SolidPng(10, 10, new Rgba32(255, 0, 0, 255));
        var plan = ReframeGeometry.PlanOutpaint(new PixelSize(10, 10), new Ratio(2, 1));

        var result = OutpaintCanvasBuilder.Build(source, plan);

        using var canvas = TestImages.Load(result.Canvas);
        using var mask = TestImages.Load(result.Mask);

        Assert.Equal(20, canvas.Width);
        Assert.Equal(10, canvas.Height);
        Assert.Equal(20, mask.Width);
        Assert.Equal(10, mask.Height);

        var rect = plan.SourceRect;
        var cx = rect.X + rect.Width / 2; // inside source footprint
        var marginX = 2; // left margin, outside footprint

        // Canvas: opaque (red) inside the footprint, fully transparent in the margin.
        Assert.Equal(255, canvas[cx, 5].A);
        Assert.Equal(0, canvas[marginX, 5].A);

        // Mask (OpenAI convention): opaque where we KEEP, transparent where the model must GENERATE.
        Assert.Equal(255, mask[cx, 5].A);
        Assert.Equal(0, mask[marginX, 5].A);
    }
}
