namespace AI.Reframe.Reframing;

/// <summary>
/// Derives the name for the new Media item an Accept creates. Pure so it can be unit-tested without
/// Umbraco. The base form is <c>{sourceName}-{w}x{h}</c> (e.g. <c>hero-photo-16x9</c>); on a clash with
/// an existing sibling the name gets a <c> (n)</c> suffix, matching Umbraco's own duplicate convention.
/// </summary>
public static class ReframeMediaNaming
{
    public static string DeriveName(string sourceName, Ratio ratio, IEnumerable<string>? existingSiblingNames = null)
    {
        var baseName = $"{Sanitize(sourceName)}-{ratio.Width}x{ratio.Height}";

        var taken = existingSiblingNames is null
            ? new HashSet<string>(StringComparer.OrdinalIgnoreCase)
            : new HashSet<string>(existingSiblingNames, StringComparer.OrdinalIgnoreCase);

        if (!taken.Contains(baseName))
        {
            return baseName;
        }

        for (var n = 2; ; n++)
        {
            var candidate = $"{baseName} ({n})";
            if (!taken.Contains(candidate))
            {
                return candidate;
            }
        }
    }

    private static string Sanitize(string sourceName)
    {
        if (string.IsNullOrWhiteSpace(sourceName))
        {
            return "image";
        }

        // Drop a trailing file extension if the media name carries one, so we don't bake ".jpg" into the new name.
        var trimmed = sourceName.Trim();
        var dot = trimmed.LastIndexOf('.');
        if (dot > 0 && trimmed.Length - dot <= 5)
        {
            trimmed = trimmed[..dot];
        }

        return trimmed.Length == 0 ? "image" : trimmed;
    }
}
