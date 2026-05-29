using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;

namespace AI.Reframe.Tests;

internal static class TestImages
{
    /// <summary>A solid-colour PNG of the given size — a stand-in for a real source/result image.</summary>
    public static byte[] SolidPng(int width, int height, Rgba32 color)
    {
        using var image = new Image<Rgba32>(width, height, color);
        using var ms = new MemoryStream();
        image.Save(ms, new PngEncoder());
        return ms.ToArray();
    }

    public static Image<Rgba32> Load(byte[] bytes) => Image.Load<Rgba32>(bytes);
}
