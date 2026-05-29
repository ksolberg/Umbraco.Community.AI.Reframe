import {
  LitElement,
  css,
  html,
  nothing,
  customElement,
  property,
  state,
} from "@umbraco-cms/backoffice/external/lit";
import { reframeShared } from "./reframe.styles.js";
import type { ReframeRect } from "./reframe.repository.js";

export type IndicatorMode = "outline" | "tint" | "labels" | "slider" | "off";

interface Band {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Presentational preview: renders the reframed image on a checkerboard backdrop with a switchable
 * generated-region indicator. All geometry is expressed as percentages of the output so the overlay
 * stays aligned at any display size. Magenta is reserved for the generated signal.
 */
@customElement("reframe-preview")
export class ReframePreviewElement extends LitElement {
  @property({ type: String }) image = "";
  @property({ type: Number }) outputWidth = 1;
  @property({ type: Number }) outputHeight = 1;
  @property({ attribute: false }) sourceRect: ReframeRect = { x: 0, y: 0, width: 0, height: 0 };
  @property({ type: Number }) generatedFraction = 0;
  @property({ type: String }) indicator: IndicatorMode = "outline";
  /** When true the image is the SOURCE placed at its rectangle (a pre-generation projection), not a full-bleed result. */
  @property({ type: Boolean }) projected = false;

  @state() private _sliderPos = 55;

  private get _hasGenerated() {
    return this.generatedFraction > 0.0001;
  }

  private pct(value: number, total: number) {
    return total > 0 ? (value / total) * 100 : 0;
  }

  private get _rectPct() {
    return {
      left: this.pct(this.sourceRect.x, this.outputWidth),
      top: this.pct(this.sourceRect.y, this.outputHeight),
      width: this.pct(this.sourceRect.width, this.outputWidth),
      height: this.pct(this.sourceRect.height, this.outputHeight),
    };
  }

  /** The four regions outside the kept rectangle — these are the generated pixels. */
  private get _bands(): Band[] {
    const r = this._rectPct;
    const right = r.left + r.width;
    const bottom = r.top + r.height;
    return [
      { left: 0, top: 0, width: 100, height: r.top },
      { left: 0, top: bottom, width: 100, height: 100 - bottom },
      { left: 0, top: r.top, width: r.left, height: r.height },
      { left: right, top: r.top, width: 100 - right, height: r.height },
    ].filter((b) => b.width > 0.01 && b.height > 0.01);
  }

  render() {
    return html`
      <div
        class="rf-stage rf-checkerboard"
        style=${`--rf-ar:${this.outputWidth / this.outputHeight}`}
      >
        ${this.indicator === "slider" && this._hasGenerated
          ? this.#renderSlider()
          : this.#renderImage()}
        ${this.#renderIndicator()}
      </div>
    `;
  }

  #renderImage() {
    if (this.projected) {
      const r = this._rectPct;
      const style = `position:absolute;inset:auto;left:${r.left}%;top:${r.top}%;width:${r.width}%;height:${r.height}%;object-fit:fill`;
      return html`<img class="rf-img rf-img--projected" style=${style} src=${this.image} alt="Source preview" />`;
    }
    return html`<img class="rf-img" src=${this.image} alt="Reframed preview" />`;
  }

  #renderIndicator() {
    if (!this._hasGenerated || this.indicator === "off" || this.indicator === "slider") {
      return nothing;
    }

    const r = this._rectPct;
    const rectStyle = `left:${r.left}%;top:${r.top}%;width:${r.width}%;height:${r.height}%`;

    if (this.indicator === "outline") {
      return html`<div class="rf-ants" style=${rectStyle}></div>`;
    }

    if (this.indicator === "tint") {
      return html`${this._bands.map(
        (b) =>
          html`<div
            class="rf-tint"
            style=${`left:${b.left}%;top:${b.top}%;width:${b.width}%;height:${b.height}%`}
          ></div>`
      )}`;
    }

    // labels
    return html`
      ${this._bands.map(
        (b) =>
          html`<div
            class="rf-tint"
            style=${`left:${b.left}%;top:${b.top}%;width:${b.width}%;height:${b.height}%`}
          >
            <span class="rf-chip rf-chip--ai">AI</span>
          </div>`
      )}
      <div class="rf-orig-label" style=${rectStyle}>
        <span class="rf-chip rf-chip--orig">Original</span>
      </div>
    `;
  }

  #renderSlider() {
    const r = this._rectPct;
    // Two flat layers, no nested clips: the "before" shows only the original footprint (rest = checkerboard);
    // the "after" (full result) sits on top but is clipped to the left of the handle, revealing "before" on the right.
    const beforeClip = `inset(${r.top}% ${100 - (r.left + r.width)}% ${100 - (r.top + r.height)}% ${r.left}%)`;
    const afterClip = `inset(0 ${100 - this._sliderPos}% 0 0)`;
    return html`
      <div class="rf-compare">
        <img class="rf-img" style=${`clip-path:${beforeClip}`} src=${this.image} alt="Original footprint" />
        <img class="rf-img rf-after" style=${`clip-path:${afterClip}`} src=${this.image} alt="Reframed" />
        <input
          class="rf-handle"
          type="range"
          min="0"
          max="100"
          .value=${String(this._sliderPos)}
          @input=${(e: Event) => (this._sliderPos = Number((e.target as HTMLInputElement).value))}
          aria-label="Compare original and reframed"
        />
        <div class="rf-handle-line" style=${`left:${this._sliderPos}%`}></div>
      </div>
    `;
  }

  static styles = [
    reframeShared,
    css`
      :host {
        display: flex;
        align-items: center;
        justify-content: center;
        /* Become the sizing container so the stage can fit itself to both axes (see width below). */
        container-type: size;
        width: 100%;
        height: 100%;
        min-height: 0;
        overflow: hidden;
      }

      .rf-stage {
        position: relative;
        /* Largest box of the output's aspect ratio that fits the container both ways. The stage's
           children are all absolutely positioned (zero intrinsic size), so its size must come from
           here, not from content. --rf-ar is the numeric W/H set inline per render. */
        aspect-ratio: var(--rf-ar);
        width: min(100%, calc(100cqh * var(--rf-ar)));
        height: auto;
        max-width: 100%;
        max-height: 100%;
        border-radius: var(--uui-border-radius, 3px);
        overflow: hidden;
        box-shadow: var(--uui-shadow-depth-1, 0 1px 3px rgba(0, 0, 0, 0.2));
      }

      .rf-img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      .rf-ants {
        position: absolute;
        background-image:
          repeating-linear-gradient(90deg, var(--rf-ai) 0 8px, transparent 8px 16px),
          repeating-linear-gradient(90deg, var(--rf-ai) 0 8px, transparent 8px 16px),
          repeating-linear-gradient(0deg, var(--rf-ai) 0 8px, transparent 8px 16px),
          repeating-linear-gradient(0deg, var(--rf-ai) 0 8px, transparent 8px 16px);
        background-size: 100% 2px, 100% 2px, 2px 100%, 2px 100%;
        background-position: 0 0, 0 100%, 0 0, 100% 0;
        background-repeat: no-repeat;
        animation: rf-march 0.5s linear infinite;
        pointer-events: none;
      }

      .rf-tint {
        position: absolute;
        background: var(--rf-ai-soft);
        outline: 1px solid var(--rf-ai);
        outline-offset: -1px;
        display: grid;
        place-items: center;
        pointer-events: none;
      }

      .rf-orig-label {
        position: absolute;
        display: grid;
        place-items: start;
        padding: 4px;
        pointer-events: none;
      }

      .rf-chip {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: 999px;
        line-height: 1;
      }

      .rf-chip--ai {
        background: var(--rf-ai);
        color: #fff;
      }

      .rf-chip--orig {
        background: var(--uui-color-surface, #fff);
        color: var(--uui-color-text, #1b1b1b);
        border: 1px solid var(--uui-color-border, #d8d7d9);
      }

      .rf-compare {
        position: absolute;
        inset: 0;
      }

      .rf-after {
        z-index: 1;
      }

      .rf-handle {
        position: absolute;
        inset: 0;
        width: 100%;
        margin: 0;
        opacity: 0;
        cursor: ew-resize;
        z-index: 3;
      }

      .rf-handle-line {
        position: absolute;
        top: 0;
        bottom: 0;
        width: 2px;
        background: var(--rf-ai);
        transform: translateX(-1px);
        z-index: 2;
        pointer-events: none;
      }
    `,
  ];
}

export default ReframePreviewElement;

declare global {
  interface HTMLElementTagNameMap {
    "reframe-preview": ReframePreviewElement;
  }
}
