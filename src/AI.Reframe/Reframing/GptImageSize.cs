namespace AI.Reframe.Reframing;

/// <summary>
/// Snaps an ideal output size to one the OpenAI gpt-image-2 image-edit endpoint accepts. The model
/// takes (almost) any resolution, but only within hard constraints: both edges must be multiples of
/// 16, the longest edge ≤ 3840px, the long:short ratio ≤ 3:1, and the total pixel count must sit
/// between 655,360 and 8,294,400. A request that violates any of these is rejected by the API, so we
/// reconcile the geometry's ideal size to the nearest valid one before sending. The provider then
/// resizes the returned image back to the geometry's planned output, so the rest of the pipeline
/// (preview rectangle, Accept) is unaffected by the snap.
/// </summary>
/// <remarks>
/// Provider-specific on purpose: <see cref="ReframeGeometry"/> stays pure and Umbraco/provider-free,
/// while these quotas live next to the one provider that imposes them (see ADR-0003).
/// </remarks>
public static class GptImageSize
{
    public const int EdgeMultiple = 16;
    public const int MaxEdge = 3840;
    public const long MinPixels = 655_360;
    public const long MaxPixels = 8_294_400;
    public const double MaxAspect = 3.0;

    /// <summary>Returns the closest gpt-image-2-valid size to <paramref name="desired"/>.</summary>
    public static PixelSize Constrain(PixelSize desired)
    {
        double w = Math.Max(1, desired.Width);
        double h = Math.Max(1, desired.Height);

        // 1. Clamp the aspect ratio to 3:1 by trimming the long edge (rare for the built-in presets).
        var aspect = w / h;
        if (aspect > MaxAspect)
        {
            w = h * MaxAspect;
        }
        else if (1.0 / aspect > MaxAspect)
        {
            h = w * MaxAspect;
        }

        // 2. Cap the longest edge.
        var longest = Math.Max(w, h);
        if (longest > MaxEdge)
        {
            var scale = MaxEdge / longest;
            w *= scale;
            h *= scale;
        }

        // 3. Bring the pixel count inside the accepted band.
        var pixels = w * h;
        if (pixels < MinPixels)
        {
            var scale = Math.Sqrt(MinPixels / pixels);
            w *= scale;
            h *= scale;
        }
        else if (pixels > MaxPixels)
        {
            var scale = Math.Sqrt(MaxPixels / pixels);
            w *= scale;
            h *= scale;
        }

        // 4. Snap both edges up to a multiple of 16 and clamp into [16, MaxEdge].
        return new PixelSize(Snap((int)Math.Round(w)), Snap((int)Math.Round(h)));
    }

    private static int Snap(int value)
    {
        var ceiled = ((value + EdgeMultiple - 1) / EdgeMultiple) * EdgeMultiple;
        return Math.Clamp(ceiled, EdgeMultiple, MaxEdge);
    }
}
