using Microsoft.Extensions.Caching.Memory;

namespace AI.Reframe.Reframing;

/// <summary>A reframed image awaiting the editor's Accept: the rendered bytes plus what produced them.</summary>
public sealed record ReframeCandidate(Guid SourceKey, Ratio Ratio, EncodedImage Image);

/// <summary>
/// Holds previewed crop/outpaint results between preview and Accept, keyed by an opaque token.
/// Lets Accept reuse the exact bytes the editor saw (outpaint is non-deterministic, so it can't be
/// re-derived) without round-tripping the image through the client.
/// </summary>
public sealed class ReframeCandidateCache
{
    private static readonly TimeSpan Ttl = TimeSpan.FromMinutes(15);

    private readonly IMemoryCache _cache;

    public ReframeCandidateCache(IMemoryCache cache) => _cache = cache;

    public string Store(ReframeCandidate candidate)
    {
        var token = Guid.NewGuid().ToString("N");
        _cache.Set(Key(token), candidate, new MemoryCacheEntryOptions { AbsoluteExpirationRelativeToNow = Ttl });
        return token;
    }

    public ReframeCandidate? Get(string token) =>
        _cache.TryGetValue(Key(token), out ReframeCandidate? candidate) ? candidate : null;

    public void Remove(string token) => _cache.Remove(Key(token));

    private static string Key(string token) => $"AI.Reframe.candidate:{token}";
}
