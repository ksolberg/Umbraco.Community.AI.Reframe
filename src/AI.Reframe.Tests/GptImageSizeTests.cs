using AI.Reframe.Reframing;
using Xunit;

namespace AI.Reframe.Tests;

public class GptImageSizeTests
{
    [Theory]
    [InlineData(2048, 1152)] // 16:9 at the default cap
    [InlineData(2048, 878)]  // 21:9 — the natural height is not a multiple of 16
    [InlineData(1080, 1920)] // portrait 9:16
    [InlineData(1000, 1000)] // square
    [InlineData(640, 360)]   // small landscape (below the pixel floor)
    [InlineData(10, 10)]     // tiny
    public void Constrained_size_satisfies_every_gpt_image_2_rule(int w, int h)
    {
        var size = GptImageSize.Constrain(new PixelSize(w, h));

        // Both edges are multiples of 16.
        Assert.Equal(0, size.Width % GptImageSize.EdgeMultiple);
        Assert.Equal(0, size.Height % GptImageSize.EdgeMultiple);

        // Longest edge within the hard cap.
        Assert.True(Math.Max(size.Width, size.Height) <= GptImageSize.MaxEdge);

        // Pixel count within the accepted band.
        Assert.True(size.Area >= GptImageSize.MinPixels, $"{size.Area} < {GptImageSize.MinPixels}");
        Assert.True(size.Area <= GptImageSize.MaxPixels, $"{size.Area} > {GptImageSize.MaxPixels}");

        // Aspect ratio no steeper than 3:1.
        var longEdge = Math.Max(size.Width, size.Height);
        var shortEdge = Math.Min(size.Width, size.Height);
        Assert.True((double)longEdge / shortEdge <= GptImageSize.MaxAspect + 1e-9);
    }

    [Fact]
    public void Already_valid_size_is_returned_essentially_unchanged()
    {
        // 1536x1024 is a multiple of 16, within the band, ratio 1.5:1 — should pass straight through.
        var size = GptImageSize.Constrain(new PixelSize(1536, 1024));
        Assert.Equal(new PixelSize(1536, 1024), size);
    }

    [Fact]
    public void Rounds_a_non_multiple_of_16_edge_up_to_the_next_multiple()
    {
        // 21:9 at 2048 wide gives a height of ~878, which must snap to 880 (the next multiple of 16).
        var size = GptImageSize.Constrain(new PixelSize(2048, 878));
        Assert.Equal(2048, size.Width);
        Assert.Equal(880, size.Height);
    }
}
