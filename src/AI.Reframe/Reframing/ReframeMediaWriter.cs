using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.PropertyEditors;
using Umbraco.Cms.Core.Services;
using Umbraco.Cms.Core.Strings;
using Umbraco.Extensions;
using CoreConstants = Umbraco.Cms.Core.Constants;

namespace AI.Reframe.Reframing;

/// <summary>The new Media item an Accept produced.</summary>
public sealed record ReframeMediaResult(Guid Key, string Name);

/// <summary>
/// Creates the reframed image as a <em>new</em> Image media item beside its source (same parent
/// folder), named <c>{sourceName}-{w}x{h}</c>. The source is never mutated — Umbraco media is shared
/// (see ADR-0002). Naming/collision logic lives in <see cref="ReframeMediaNaming"/> so it can be
/// tested without Umbraco.
/// </summary>
public sealed class ReframeMediaWriter
{
    private readonly IMediaService _mediaService;
    private readonly MediaFileManager _mediaFileManager;
    private readonly MediaUrlGeneratorCollection _mediaUrlGenerators;
    private readonly IShortStringHelper _shortStringHelper;
    private readonly IContentTypeBaseServiceProvider _contentTypeBaseServiceProvider;

    public ReframeMediaWriter(
        IMediaService mediaService,
        MediaFileManager mediaFileManager,
        MediaUrlGeneratorCollection mediaUrlGenerators,
        IShortStringHelper shortStringHelper,
        IContentTypeBaseServiceProvider contentTypeBaseServiceProvider)
    {
        _mediaService = mediaService;
        _mediaFileManager = mediaFileManager;
        _mediaUrlGenerators = mediaUrlGenerators;
        _shortStringHelper = shortStringHelper;
        _contentTypeBaseServiceProvider = contentTypeBaseServiceProvider;
    }

    /// <summary>Creates the reframed Image item beside <paramref name="source"/>.</summary>
    public ReframeMediaResult Create(ReframeSource source, EncodedImage image, Ratio ratio, int userId = -1 /* Constants.Security.SuperUserId */)
    {
        var name = ReframeMediaNaming.DeriveName(source.Name, ratio, SiblingNames(source.ParentId));
        var media = _mediaService.CreateMedia(name, source.ParentId, CoreConstants.Conventions.MediaTypes.Image, userId);

        var fileName = $"{name}.{image.Extension}";
        using (var stream = new MemoryStream(image.Bytes))
        {
            media.SetValue(
                _mediaFileManager,
                _mediaUrlGenerators,
                _shortStringHelper,
                _contentTypeBaseServiceProvider,
                CoreConstants.Conventions.Media.File,
                fileName,
                stream);
        }

        _mediaService.Save(media, userId);
        return new ReframeMediaResult(media.Key, media.Name ?? name);
    }

    private IEnumerable<string> SiblingNames(int parentId)
    {
        var children = _mediaService.GetPagedChildren(
            parentId,
            pageIndex: 0,
            pageSize: 500,
            out _,
            filter: null,
            ordering: Ordering.By("name"));

        return children
            .Select(m => m.Name)
            .Where(n => !string.IsNullOrEmpty(n))
            .Select(n => n!)
            .ToList();
    }
}
