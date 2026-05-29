import type { ReframeRect } from "./reframe.repository.js";

export interface ProjectedFrame {
  outputWidth: number;
  outputHeight: number;
  sourceRect: ReframeRect;
  generatedFraction: number;
}

/**
 * Client-side preview geometry for the "before you generate" state: where the source sits within the
 * target frame and how much would be generated. Mirrors ReframeGeometry.PlanOutpaint on the server
 * (source centred, short axis extended); units are the target ratio's terms, which is all the preview
 * overlay needs since it works in percentages.
 */
export function projectOutpaint(sourceW: number, sourceH: number, ratio: string): ProjectedFrame | undefined {
  const [tw, th] = ratio.split(":").map(Number);
  if (!tw || !th || !sourceW || !sourceH) return undefined;

  const r = tw / th;
  const sr = sourceW / sourceH;

  let rect: ReframeRect;
  if (r >= sr) {
    // Target wider: source spans full height, centred horizontally.
    const w = th * sr;
    rect = { x: (tw - w) / 2, y: 0, width: w, height: th };
  } else {
    // Target taller: source spans full width, centred vertically.
    const h = tw / sr;
    rect = { x: 0, y: (th - h) / 2, width: tw, height: h };
  }

  const generatedFraction = 1 - (rect.width * rect.height) / (tw * th);
  return { outputWidth: tw, outputHeight: th, sourceRect: rect, generatedFraction };
}
