using System.Text.Json;
using SixLabors.ImageSharp;
using Umbraco.Cms.Core.IO;
using Umbraco.Cms.Core.Services;
using CoreConstants = Umbraco.Cms.Core.Constants;

namespace AI.Reframe.Reframing;

/// <summary>A source image read from Umbraco media: its bytes, pixel size, public URL, and where it lives in the tree.</summary>
public sealed record ReframeSource(
    Guid Key,
    string Name,
    int ParentId,
    byte[] Bytes,
    string ContentType,
    PixelSize Size,
    string Url);

/// <summary>Reads an Image media item's file and dimensions so it can be reframed.</summary>
public sealed class ReframeMediaReader
{
    private readonly IMediaService _mediaService;
    private readonly MediaFileManager _mediaFileManager;

    public ReframeMediaReader(IMediaService mediaService, MediaFileManager mediaFileManager)
    {
        _mediaService = mediaService;
        _mediaFileManager = mediaFileManager;
    }

    /// <summary>Returns the source for an Image media item, or null when the key is unknown or not an image.</summary>
    public ReframeSource? Read(Guid mediaKey)
    {
        var media = _mediaService.GetById(mediaKey);
        if (media is null ||
            !string.Equals(media.ContentType.Alias, CoreConstants.Conventions.MediaTypes.Image, StringComparison.OrdinalIgnoreCase))
        {
            return null;
        }

        var path = ExtractFilePath(media.GetValue(CoreConstants.Conventions.Media.File)?.ToString());
        if (string.IsNullOrWhiteSpace(path))
        {
            return null;
        }

        byte[] bytes;
        using (var stream = _mediaFileManager.FileSystem.OpenFile(path))
        using (var ms = new MemoryStream())
        {
            stream.CopyTo(ms);
            bytes = ms.ToArray();
        }

        var size = ResolveSize(media, bytes);
        var contentType = ContentTypeForExtension(Path.GetExtension(path));

        // The umbracoFile path is the publicly served media URL (relative), usable directly as an <img> src.
        return new ReframeSource(mediaKey, media.Name ?? "image", media.ParentId, bytes, contentType, size, path);
    }

    private static PixelSize ResolveSize(Umbraco.Cms.Core.Models.IMedia media, byte[] bytes)
    {
        var w = TryGetInt(media, CoreConstants.Conventions.Media.Width);
        var h = TryGetInt(media, CoreConstants.Conventions.Media.Height);
        if (w is > 0 && h is > 0)
        {
            return new PixelSize(w.Value, h.Value);
        }

        var info = Image.Identify(bytes);
        return new PixelSize(info.Width, info.Height);
    }

    private static int? TryGetInt(Umbraco.Cms.Core.Models.IMedia media, string alias) =>
        int.TryParse(media.GetValue(alias)?.ToString(), out var value) ? value : null;

    /// <summary>The umbracoFile value is either a bare path or the image-cropper JSON; pull the file path from either.</summary>
    private static string? ExtractFilePath(string? raw)
    {
        if (string.IsNullOrWhiteSpace(raw))
        {
            return null;
        }

        var trimmed = raw.TrimStart();
        if (!trimmed.StartsWith('{'))
        {
            return raw;
        }

        try
        {
            using var doc = JsonDocument.Parse(trimmed);
            if (doc.RootElement.TryGetProperty("src", out var src) && src.ValueKind == JsonValueKind.String)
            {
                return src.GetString();
            }
        }
        catch (JsonException)
        {
            // not cropper JSON after all
        }

        return raw;
    }

    private static string ContentTypeForExtension(string extension) => extension.TrimStart('.').ToLowerInvariant() switch
    {
        "png" => "image/png",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "tif" or "tiff" => "image/tiff",
        _ => "image/jpeg",
    };
}
