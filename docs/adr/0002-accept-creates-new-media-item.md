# Accept creates a new Media item, not an in-place replace

The Sanity design's Accept "saves and replaces the field's image" — safe there
because the asset reference belongs to one document. In Umbraco a Media item is
**shared**: every piece of content and media that references it would change,
and the original would be lost. So Accept instead creates a **new Media item**
beside the source (same parent folder, name suffixed with the target ratio,
e.g. `hero-photo-16x9`), leaving the source untouched.

This is a deliberate deviation from the design driven by Umbraco's shared-media
model. The editor repoints content at the new item themselves; we never mutate
the source.

## Consequences

- Non-destructive by default; no surprise edits to images used elsewhere.
- The action bar says "Save as new" rather than "Replace". A future option to
  replace-in-place could be added, but is intentionally not the default.
