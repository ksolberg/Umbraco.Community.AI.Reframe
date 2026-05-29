using AI.Reframe.Reframing;
using Xunit;

namespace AI.Reframe.Tests;

public class ReframeGeometryTests
{
    [Theory]
    [InlineData("16:9", 16, 9)]
    [InlineData("1:1", 1, 1)]
    [InlineData("21:9", 21, 9)]
    public void Ratio_parses_valid_input(string text, int w, int h)
    {
        var ratio = Ratio.Parse(text);
        Assert.Equal(w, ratio.Width);
        Assert.Equal(h, ratio.Height);
    }

    [Theory]
    [InlineData("16")]
    [InlineData("16:0")]
    [InlineData("0:9")]
    [InlineData("a:b")]
    [InlineData("")]
    public void Ratio_rejects_invalid_input(string text)
    {
        Assert.False(Ratio.TryParse(text, out _));
    }

    [Fact]
    public void Matching_ratios_cannot_be_cropped()
    {
        // A 1000x1000 source is already 1:1 — there is nothing to crop.
        Assert.False(ReframeGeometry.CanCrop(new PixelSize(1000, 1000), new Ratio(1, 1)));
    }

    [Fact]
    public void Modest_ratio_change_allows_crop_but_extreme_does_not()
    {
        var square = new PixelSize(1000, 1000);
        // 1:1 -> 4:3 loses 25% — offered.
        Assert.True(ReframeGeometry.CanCrop(square, new Ratio(4, 3)));
        // 1:1 -> 21:9 loses ~57% — not offered (outpaint instead).
        Assert.False(ReframeGeometry.CanCrop(square, new Ratio(21, 9)));
    }

    [Fact]
    public void Content_change_fraction_is_symmetric_and_zero_when_matched()
    {
        var size = new PixelSize(1000, 1000);
        Assert.Equal(0, ReframeGeometry.ContentChangeFraction(size, new Ratio(1, 1)), 5);

        // 1:1 -> 2:1 and 1:1 -> 1:2 cost the same (same mismatch, opposite axis).
        var a = ReframeGeometry.ContentChangeFraction(size, new Ratio(2, 1));
        var b = ReframeGeometry.ContentChangeFraction(size, new Ratio(1, 2));
        Assert.Equal(a, b, 5);
        Assert.Equal(0.5, a, 5); // keeps half, discards half
    }

    [Fact]
    public void Crop_to_wider_ratio_trims_height_and_keeps_full_width()
    {
        // 1000x1000 -> 2:1 keeps width 1000, height 500.
        var rect = ReframeGeometry.CropRect(new PixelSize(1000, 1000), new Ratio(2, 1), CropAnchor.Center);
        Assert.Equal(0, rect.X);
        Assert.Equal(1000, rect.Width);
        Assert.Equal(500, rect.Height);
        Assert.Equal(250, rect.Y); // centred band
    }

    [Theory]
    [InlineData(CropAnchor.Top, 0)]
    [InlineData(CropAnchor.Center, 250)]
    [InlineData(CropAnchor.Bottom, 500)]
    public void Crop_anchor_positions_the_trimmed_band(CropAnchor anchor, int expectedY)
    {
        var rect = ReframeGeometry.CropRect(new PixelSize(1000, 1000), new Ratio(2, 1), anchor);
        Assert.Equal(expectedY, rect.Y);
        Assert.Equal(500, rect.Height);
    }

    [Fact]
    public void Crop_to_taller_ratio_trims_width_and_keeps_full_height()
    {
        // 1000x1000 -> 1:2 keeps height 1000, width 500, centred horizontally.
        var rect = ReframeGeometry.CropRect(new PixelSize(1000, 1000), new Ratio(1, 2), CropAnchor.Center);
        Assert.Equal(1000, rect.Height);
        Assert.Equal(500, rect.Width);
        Assert.Equal(250, rect.X);
        Assert.Equal(0, rect.Y);
    }

    [Fact]
    public void Outpaint_to_wider_ratio_extends_width_keeps_height()
    {
        // 1000x1000 -> 16:9 keeps height 1000, extends width to 1778.
        var size = ReframeGeometry.OutpaintOutputSize(new PixelSize(1000, 1000), new Ratio(16, 9));
        Assert.Equal(1000, size.Height);
        Assert.Equal(1778, size.Width); // round(1000 * 16/9)
    }

    [Fact]
    public void Outpaint_output_is_capped_to_max_edge_preserving_ratio()
    {
        var size = ReframeGeometry.OutpaintOutputSize(new PixelSize(4000, 4000), new Ratio(16, 9), maxEdge: 2048);
        Assert.Equal(2048, Math.Max(size.Width, size.Height));
        Assert.True(Math.Abs(size.AspectRatio - 16.0 / 9.0) < 0.01);
    }

    [Fact]
    public void Source_sits_centred_within_outpaint_output()
    {
        var output = new PixelSize(1778, 1000);
        var rect = ReframeGeometry.SourceRectWithin(output, new PixelSize(1000, 1000));
        Assert.Equal(1000, rect.Width);
        Assert.Equal(1000, rect.Height);
        Assert.Equal((1778 - 1000) / 2, rect.X);
        Assert.Equal(0, rect.Y);
    }

    [Fact]
    public void Plan_crop_reports_no_generated_region()
    {
        var plan = ReframeGeometry.PlanCrop(new PixelSize(1000, 1000), new Ratio(4, 3));
        Assert.Equal(ReframeMode.Crop, plan.Mode);
        Assert.Equal(0, plan.GeneratedFraction);
        Assert.Equal(plan.SourceRect.Size, plan.Output);
    }

    [Fact]
    public void Plan_outpaint_reports_generated_fraction_matching_the_ratio_mismatch()
    {
        var plan = ReframeGeometry.PlanOutpaint(new PixelSize(1000, 1000), new Ratio(2, 1));
        Assert.Equal(ReframeMode.Outpaint, plan.Mode);
        // Source occupies half the 2000x1000 canvas → ~50% generated.
        Assert.Equal(0.5, plan.GeneratedFraction, 2);
    }
}
