# Reframe integrates as a Media workspace view

The source design is a Sanity Studio modal that opens over a document's image
field. Umbraco has no equivalent field — images live in the shared Media
library and are referenced by pickers. We integrate Reframe as a **workspace
view on the Image media type** (a "Reframe" tab in the Media section) rather
than as a property editor (Data Type) or a modal launched from a media picker.

This makes "the image" unambiguous (the current Media item's `umbracoFile`) and
treats reframing as a media-editing operation, which is where it belongs in
Umbraco's model. A property editor was rejected because it would have to wrap a
media picker and decide between mutating shared media or storing per-property
variants — added complexity for no gain over editing the media item directly.

## Consequences

- The design's `Modal` shell and faked Studio chrome are dropped; the workspace
  view is the container, and we keep the two-pane layout (controls rail +
  preview area) inline.
- Reframe only applies to Image media; the view is conditioned accordingly.
