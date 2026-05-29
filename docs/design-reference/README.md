# Design reference (read-only)

The original design handoff for AI.Reframe, kept here so the pixel-level source
survives independent of any scratch directory. **Reference only — none of this
ships.** The real implementation is a Lit/UUI Umbraco workspace view; see the
PRD (GitHub Issue #1), `CONTEXT.md`, and `docs/adr/`.

This was a Claude Design (claude.ai/design) bundle for a **Sanity Studio**
plugin, retargeted to Umbraco. The Sanity-specific framing (image field,
modal-over-field, credits, studio chrome) has been deliberately retranslated —
see the ADRs for the load-bearing deviations.

## Contents

- `HANDOFF-README.md` — the original "coding agents read this first" note.
- `chat-transcript.md` — the user↔design-assistant conversation (where intent lives).
- `project/Reframe.html` — entry point; loads the JSX below via Babel standalone.
- `project/screens.jsx` — composed states (initial / awaiting / generating /
  preview-ready / crop / error) + the `fitPreview` geometry helper.
- `project/ui.jsx` — modal shell, controls rail, ratio chips, mode cards,
  buttons, pill groups, action bar, icons.
- `project/photo.jsx` — the CSS "photo" placeholder + the six generated-region
  indicators (`AIShape` clip-path technique) + crop overlay.
- `project/design-canvas.jsx` / `app.jsx` — the design-canvas/artboard wiring
  (not relevant to the Umbraco build).

## What to lift vs. drop

**Lift (signature visuals — kept per the styling decision):** magenta `#ec4899`
reserved for the AI signal; ratio-chips drawn as scaled rectangles; the
generated-region indicator overlays (we ship outline/tint/labels/compare-slider
+ off); the checkerboard preview backdrop; the `rf-march` / `rf-shimmer` /
`rf-pulse` / `rf-spin` keyframes; the `fitPreview` + `AIShape` geometry as the
basis for `ReframeGeometry`.

**Drop:** the `Modal` shell and `StudioChromeHint` (the workspace view is the
container); Geist fonts and warm off-white surfaces (use UUI + theme tokens);
the "credits" / fake "seed" metering copy; the design-canvas artboards.
