namespace AI.Reframe.Reframing;

/// <summary>The curated set of target-ratio chips offered in the controls rail (the design's preset list).</summary>
public static class ReframePresets
{
    public static IReadOnlyList<Ratio> All { get; } =
    [
        new(16, 9),
        new(9, 16),
        new(1, 1),
        new(4, 3),
        new(3, 4),
        new(4, 5),
        new(21, 9),
    ];
}
