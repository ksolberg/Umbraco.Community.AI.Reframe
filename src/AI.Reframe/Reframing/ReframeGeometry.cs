namespace AI.Reframe.Reframing;

/// <summary>
/// How a single preset/target ratio relates to a given source: whether crop is offered,
/// and how much content each mode costs. Used to drive the controls rail's chips and
/// mode toggle without the client re-deriving any geometry.
/// </summary>
/// <param name="Target">The candidate target ratio.</param>
/// <param name="CanCrop">Whether crop is offered for this ratio (see <see cref="ReframeGeometry.CanCrop"/>).</param>
/// <param name="ContentChangeFraction">
/// 0..1. For crop, the fraction of source pixels discarded; for outpaint, the fraction of the
/// result that is newly generated. The two are equal for a given source+target — it is the same
/// ratio mismatch read from opposite ends — so a single number serves both.
/// </param>
public readonly record struct RatioCapability(Ratio Target, bool CanCrop, double ContentChangeFraction);

/// <summary>
/// A fully resolved plan for one reframe operation: everything the cropper, the outpaint
/// provider, and the client's indicator overlay need, all derived in one place.
/// </summary>
/// <param name="Source">The source image size in pixels.</param>
/// <param name="Target">The requested target ratio.</param>
/// <param name="Mode">Crop or outpaint.</param>
/// <param name="Output">The reframed image's pixel size.</param>
/// <param name="SourceRect">
/// For crop: the sub-rectangle of the <em>source</em> that is kept (and becomes the output).
/// For outpaint: the rectangle <em>within the output</em> where the original pixels sit; everything
/// outside it is generated. This is the single rectangle the generated-region indicators draw around.
/// </param>
/// <param name="GeneratedFraction">0..1 fraction of the output that is AI-generated (0 for crop).</param>
public readonly record struct ReframePlan(
    PixelSize Source,
    Ratio Target,
    ReframeMode Mode,
    PixelSize Output,
    PixelRect SourceRect,
    double GeneratedFraction);

/// <summary>
/// The single source of truth for all reframe math: crop possibility, the crop rectangle,
/// outpaint canvas/mask placement, and indicator overlay geometry. Pure and Umbraco-free so it
/// can be unit-tested exhaustively.
/// </summary>
/// <remarks>
/// The design prototype gated crop with an admittedly "crude — for demo purposes" ratio heuristic.
/// Geometrically, crop can reach <em>any</em> ratio by trimming one axis, so there is no true
/// impossibility. We instead offer crop only while it stays cheap: the fraction of source content
/// it would discard must not exceed <see cref="DefaultMaxCropLossFraction"/>. Past that, extending
/// the canvas (outpaint) preserves more of the editor's image than throwing half of it away.
/// </remarks>
public static class ReframeGeometry
{
    /// <summary>Ratios within this relative tolerance are treated as equal (a no-op reframe).</summary>
    public const double RatioMatchTolerance = 0.005;

    /// <summary>Crop is offered only while it would discard at most this fraction of the source.</summary>
    public const double DefaultMaxCropLossFraction = 0.5;

    /// <summary>True when two aspect ratios are equal within <see cref="RatioMatchTolerance"/>.</summary>
    public static bool RatiosMatch(double a, double b) =>
        Math.Abs(a - b) <= RatioMatchTolerance * Math.Max(a, b);

    /// <summary>
    /// The fraction of content the ratio change costs: pixels a crop discards, or — read from the
    /// other end — the share of the outpainted result that is new. Symmetric, so 0 means the ratios
    /// already match and approaches 1 as they diverge.
    /// </summary>
    public static double ContentChangeFraction(PixelSize source, Ratio target)
    {
        var sr = source.AspectRatio;
        var tr = target.Value;
        return 1.0 - Math.Min(sr, tr) / Math.Max(sr, tr);
    }

    /// <summary>
    /// Whether crop is offered for this target: the ratios must actually differ (else there is
    /// nothing to do) and the crop must not discard more than <paramref name="maxLossFraction"/>
    /// of the source.
    /// </summary>
    public static bool CanCrop(PixelSize source, Ratio target, double maxLossFraction = DefaultMaxCropLossFraction)
    {
        if (RatiosMatch(source.AspectRatio, target.Value))
        {
            return false;
        }

        return ContentChangeFraction(source, target) <= maxLossFraction;
    }

    /// <summary>Describes how every supplied target ratio relates to the source, for the controls rail.</summary>
    public static IReadOnlyList<RatioCapability> Describe(
        PixelSize source,
        IEnumerable<Ratio> targets,
        double maxLossFraction = DefaultMaxCropLossFraction)
    {
        ArgumentNullException.ThrowIfNull(targets);
        return targets
            .Select(t => new RatioCapability(t, CanCrop(source, t, maxLossFraction), ContentChangeFraction(source, t)))
            .ToList();
    }

    /// <summary>
    /// The largest rectangle of the target ratio that fits inside the source, positioned along the
    /// trimmed axis by <paramref name="anchor"/>. When the target is wider than the source the height
    /// is trimmed (anchor chooses top/centre/bottom band); when taller, the width is trimmed (anchor
    /// maps to left/centre/right). When the ratios already match, the whole source is returned.
    /// </summary>
    public static PixelRect CropRect(PixelSize source, Ratio target, CropAnchor anchor = CropAnchor.Center)
    {
        var sr = source.AspectRatio;
        var tr = target.Value;

        if (tr > sr)
        {
            // Target is wider: keep full width, trim height.
            var height = (int)Math.Round(source.Width / tr);
            height = Math.Clamp(height, 1, source.Height);
            var y = AnchorOffset(anchor, source.Height, height);
            return new PixelRect(0, y, source.Width, height);
        }

        if (tr < sr)
        {
            // Target is taller: keep full height, trim width.
            var width = (int)Math.Round(source.Height * tr);
            width = Math.Clamp(width, 1, source.Width);
            var x = AnchorOffset(anchor, source.Width, width);
            return new PixelRect(x, 0, width, source.Height);
        }

        return new PixelRect(0, 0, source.Width, source.Height);
    }

    /// <summary>
    /// The output canvas for an outpaint: the source extended along its short axis to reach the
    /// target ratio, then scaled down uniformly if its longest edge would exceed
    /// <paramref name="maxEdge"/>. The source's longest edge otherwise sets the scale.
    /// </summary>
    public static PixelSize OutpaintOutputSize(PixelSize source, Ratio target, int? maxEdge = null)
    {
        var sr = source.AspectRatio;
        var tr = target.Value;

        int width, height;
        if (tr >= sr)
        {
            // Target wider (or equal): keep height, extend width.
            height = source.Height;
            width = (int)Math.Round(height * tr);
        }
        else
        {
            // Target taller: keep width, extend height.
            width = source.Width;
            height = (int)Math.Round(width / tr);
        }

        width = Math.Max(1, width);
        height = Math.Max(1, height);

        if (maxEdge is { } cap && cap > 0)
        {
            var longest = Math.Max(width, height);
            if (longest > cap)
            {
                var scale = (double)cap / longest;
                width = Math.Max(1, (int)Math.Round(width * scale));
                height = Math.Max(1, (int)Math.Round(height * scale));
            }
        }

        return new PixelSize(width, height);
    }

    /// <summary>
    /// Where the original pixels sit, centred, within an outpaint <paramref name="output"/> canvas.
    /// The source is scaled to fit the axis it shares with the output (it was the constraining axis),
    /// then centred on the other. Everything outside this rectangle is the generated region.
    /// </summary>
    public static PixelRect SourceRectWithin(PixelSize output, PixelSize source)
    {
        var scale = Math.Min((double)output.Width / source.Width, (double)output.Height / source.Height);
        var w = Math.Clamp((int)Math.Round(source.Width * scale), 1, output.Width);
        var h = Math.Clamp((int)Math.Round(source.Height * scale), 1, output.Height);
        var x = (output.Width - w) / 2;
        var y = (output.Height - h) / 2;
        return new PixelRect(x, y, w, h);
    }

    /// <summary>Resolves a complete plan for a crop. <paramref name="maxEdge"/> optionally caps the output's longest edge.</summary>
    public static ReframePlan PlanCrop(PixelSize source, Ratio target, CropAnchor anchor = CropAnchor.Center, int? maxEdge = null)
    {
        var crop = CropRect(source, target, anchor);
        var output = crop.Size;

        if (maxEdge is { } cap && cap > 0)
        {
            var longest = Math.Max(output.Width, output.Height);
            if (longest > cap)
            {
                var scale = (double)cap / longest;
                output = new PixelSize(
                    Math.Max(1, (int)Math.Round(output.Width * scale)),
                    Math.Max(1, (int)Math.Round(output.Height * scale)));
            }
        }

        return new ReframePlan(
            Source: source,
            Target: target,
            Mode: ReframeMode.Crop,
            Output: output,
            SourceRect: crop,
            GeneratedFraction: 0.0);
    }

    /// <summary>Resolves a complete plan for an outpaint, including where the original sits and how much is generated.</summary>
    public static ReframePlan PlanOutpaint(PixelSize source, Ratio target, int? maxEdge = null)
    {
        var output = OutpaintOutputSize(source, target, maxEdge);
        var sourceRect = SourceRectWithin(output, source);
        var generated = 1.0 - (double)(sourceRect.Size.Area) / output.Area;
        if (generated < 0)
        {
            generated = 0;
        }

        return new ReframePlan(
            Source: source,
            Target: target,
            Mode: ReframeMode.Outpaint,
            Output: output,
            SourceRect: sourceRect,
            GeneratedFraction: generated);
    }

    private static int AnchorOffset(CropAnchor anchor, int total, int kept) => anchor switch
    {
        CropAnchor.Top => 0,
        CropAnchor.Bottom => total - kept,
        _ => (total - kept) / 2,
    };
}
