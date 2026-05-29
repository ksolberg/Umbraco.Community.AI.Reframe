using AI.Reframe.Reframing;
using Xunit;

namespace AI.Reframe.Tests;

public class ReframeMediaNamingTests
{
    [Fact]
    public void Derives_name_from_source_and_ratio()
    {
        Assert.Equal("hero-photo-16x9", ReframeMediaNaming.DeriveName("hero-photo", new Ratio(16, 9)));
    }

    [Fact]
    public void Strips_a_trailing_file_extension_from_the_source_name()
    {
        Assert.Equal("hero-photo-1x1", ReframeMediaNaming.DeriveName("hero-photo.jpg", new Ratio(1, 1)));
    }

    [Fact]
    public void Falls_back_to_image_for_a_blank_source_name()
    {
        Assert.Equal("image-4x5", ReframeMediaNaming.DeriveName("   ", new Ratio(4, 5)));
    }

    [Fact]
    public void Appends_a_numeric_suffix_on_collision()
    {
        var existing = new[] { "hero-16x9" };
        Assert.Equal("hero-16x9 (2)", ReframeMediaNaming.DeriveName("hero", new Ratio(16, 9), existing));
    }

    [Fact]
    public void Keeps_incrementing_past_multiple_collisions_case_insensitively()
    {
        var existing = new[] { "Hero-16x9", "hero-16x9 (2)" };
        Assert.Equal("hero-16x9 (3)", ReframeMediaNaming.DeriveName("hero", new Ratio(16, 9), existing));
    }
}
