import { css as W, property as h, state as u, customElement as j, LitElement as K, nothing as f, html as s } from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin as de } from "@umbraco-cms/backoffice/element-api";
import { UMB_ENTITY_WORKSPACE_CONTEXT as he } from "@umbraco-cms/backoffice/workspace";
import { UMB_NOTIFICATION_CONTEXT as ue } from "@umbraco-cms/backoffice/notification";
import { c as z } from "./client.gen-aGN3fyVl.js";
const E = "/umbraco/aireframe/api/v1", S = [{ scheme: "bearer", type: "http" }];
class fe {
  async capabilities(t) {
    return z.get({
      security: S,
      url: `${E}/capabilities`,
      query: { mediaKey: t }
    });
  }
  async crop(t, i, a) {
    return z.post({
      security: S,
      url: `${E}/crop`,
      body: { mediaKey: t, ratio: i, anchor: a }
    });
  }
  async outpaint(t, i, a, r) {
    return z.post({
      security: S,
      url: `${E}/outpaint`,
      body: { mediaKey: t, ratio: i, prompt: r },
      signal: a
    });
  }
  async accept(t, i) {
    return z.post({
      security: S,
      url: `${E}/accept`,
      body: { mediaKey: t, token: i }
    });
  }
}
const H = W`
  :host {
    /* The one reserved AI colour. Do not use magenta for anything that isn't the generated signal. */
    --rf-ai: #ec4899;
    --rf-ai-soft: color-mix(in srgb, var(--rf-ai) 18%, transparent);
  }

  .rf-checkerboard {
    background-color: var(--uui-color-surface-alt, #f4f4f4);
    background-image:
      linear-gradient(45deg, rgba(0, 0, 0, 0.06) 25%, transparent 25%),
      linear-gradient(-45deg, rgba(0, 0, 0, 0.06) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, rgba(0, 0, 0, 0.06) 75%),
      linear-gradient(-45deg, transparent 75%, rgba(0, 0, 0, 0.06) 75%);
    background-size: 20px 20px;
    background-position: 0 0, 0 10px, 10px -10px, -10px 0;
  }

  @keyframes rf-march {
    to {
      background-position: 16px 0, -16px 100%, 0 -16px, 100% 16px;
    }
  }

  @keyframes rf-shimmer {
    0% {
      background-position: -150% 0;
    }
    100% {
      background-position: 250% 0;
    }
  }

  @keyframes rf-pulse {
    0%,
    100% {
      opacity: 0.55;
    }
    50% {
      opacity: 1;
    }
  }

  @keyframes rf-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
function ge(e, t, i) {
  const [a, r] = i.split(":").map(Number);
  if (!a || !r || !e || !t) return;
  const c = a / r, l = e / t;
  let R;
  if (c >= l) {
    const C = r * l;
    R = { x: (a - C) / 2, y: 0, width: C, height: r };
  } else {
    const C = a / l;
    R = { x: 0, y: (r - C) / 2, width: a, height: C };
  }
  const pe = 1 - R.width * R.height / (a * r);
  return { outputWidth: a, outputHeight: r, sourceRect: R, generatedFraction: pe };
}
var me = Object.defineProperty, ve = Object.getOwnPropertyDescriptor, B = (e) => {
  throw TypeError(e);
}, _ = (e, t, i, a) => {
  for (var r = a > 1 ? void 0 : a ? ve(t, i) : t, c = e.length - 1, l; c >= 0; c--)
    (l = e[c]) && (r = (a ? l(t, i, r) : l(r)) || r);
  return a && r && me(t, i, r), r;
}, _e = (e, t, i) => t.has(e) || B("Cannot " + i), be = (e, t, i) => t.has(e) ? B("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), $ = (e, t, i) => (_e(e, t, "access private method"), i), y, G, T, U, q;
let g = class extends K {
  constructor() {
    super(...arguments), be(this, y), this.presets = [], this.sourceRatio = "", this.selectedMode = "outpaint", this.providerName = "", this.disabled = !1, this._customX = 16, this._customY = 9;
  }
  get _selectedOption() {
    return this.presets.find((e) => e.ratio === this.selectedRatio);
  }
  get _cropAllowed() {
    return this._selectedOption?.canCrop ?? !0;
  }
  render() {
    return s`
      <div class="rf-rail">
        <section>
          <header class="rf-section-head">
            <span>Aspect ratio</span>
            ${this.sourceRatio ? s`<span class="rf-meta">Current ${this.sourceRatio}</span>` : f}
          </header>
          <div class="rf-chips">
            ${this.presets.map((e) => $(this, y, q).call(this, e))}
          </div>
          <div class="rf-custom">
            <span class="rf-meta">Custom</span>
            <div class="rf-custom-row">
              <uui-input
                type="number"
                .value=${String(this._customX)}
                ?disabled=${this.disabled}
                @change=${(e) => this._customX = Number(e.target.value)}
              ></uui-input>
              <span>:</span>
              <uui-input
                type="number"
                .value=${String(this._customY)}
                ?disabled=${this.disabled}
                @change=${(e) => this._customY = Number(e.target.value)}
              ></uui-input>
              <uui-button
                look="secondary"
                compact
                label="Apply custom ratio"
                ?disabled=${this.disabled}
                @click=${$(this, y, U)}
                >Apply</uui-button
              >
            </div>
          </div>
        </section>

        <section>
          <header class="rf-section-head"><span>Mode</span></header>
          <div class="rf-modes">
            <button
              class="rf-mode ${this.selectedMode === "crop" ? "rf-mode--active" : ""}"
              ?disabled=${this.disabled || !this._cropAllowed}
              @click=${() => $(this, y, T).call(this, "crop")}
            >
              <uui-icon name="icon-crop"></uui-icon>
              <span class="rf-mode-title">Crop</span>
              <span class="rf-meta">Instant · free</span>
            </button>
            <button
              class="rf-mode ${this.selectedMode === "outpaint" ? "rf-mode--active" : ""}"
              ?disabled=${this.disabled}
              @click=${() => $(this, y, T).call(this, "outpaint")}
            >
              <uui-icon name="icon-wand"></uui-icon>
              <span class="rf-mode-title">Outpaint</span>
              <span class="rf-meta">AI · slower</span>
            </button>
          </div>
          ${!this._cropAllowed && this.selectedRatio ? s`<p class="rf-hint">This ratio can't be reached by cropping without losing most of the image — outpaint will extend it instead.</p>` : f}
          ${this.selectedMode === "outpaint" && this.providerName ? s`<p class="rf-hint">New pixels are generated by <strong>${this.providerName}</strong>.</p>` : f}
        </section>
      </div>
    `;
  }
};
y = /* @__PURE__ */ new WeakSet();
G = function(e) {
  this.dispatchEvent(new CustomEvent("ratio-change", { detail: e }));
};
T = function(e) {
  this.dispatchEvent(new CustomEvent("mode-change", { detail: e }));
};
U = function() {
  this._customX > 0 && this._customY > 0 && $(this, y, G).call(this, `${this._customX}:${this._customY}`);
};
q = function(e) {
  const [t, i] = e.ratio.split(":").map(Number), r = 30 / Math.max(t, i), c = e.ratio === this.selectedRatio;
  return s`
      <button
        class="rf-chip ${c ? "rf-chip--selected" : ""}"
        ?disabled=${this.disabled}
        @click=${() => $(this, y, G).call(this, e.ratio)}
        title=${e.canCrop ? `${e.ratio}` : `${e.ratio} — needs outpaint`}
      >
        <span class="rf-chip-rect" style=${`width:${t * r}px;height:${i * r}px`}></span>
        <span class="rf-chip-label">${e.ratio}</span>
        ${e.canCrop ? f : s`<span class="rf-chip-ai" title="Needs outpaint">AI</span>`}
      </button>
    `;
};
g.styles = [
  H,
  W`
      .rf-rail {
        display: flex;
        flex-direction: column;
        gap: var(--uui-size-layout-1, 24px);
        padding: var(--uui-size-space-5, 18px);
        width: 280px;
        box-sizing: border-box;
        border-right: 1px solid var(--uui-color-border, #e5e4df);
        overflow: auto;
      }

      .rf-section-head {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-weight: 700;
        margin-bottom: var(--uui-size-space-4, 12px);
      }

      .rf-meta {
        font-size: 11px;
        color: var(--uui-color-text-alt, #68686a);
        font-weight: 400;
      }

      .rf-chips {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }

      .rf-chip {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 64px;
        padding: 8px;
        background: var(--uui-color-surface, #fff);
        border: 1px solid var(--uui-color-border, #e5e4df);
        border-radius: var(--uui-border-radius, 3px);
        cursor: pointer;
        color: inherit;
      }

      .rf-chip:hover:not(:disabled) {
        border-color: var(--uui-color-border-emphasis, #a1a1a1);
      }

      .rf-chip--selected {
        border-color: var(--uui-color-selected, #3544b1);
        box-shadow: inset 0 0 0 1px var(--uui-color-selected, #3544b1);
      }

      .rf-chip:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .rf-chip-rect {
        background: var(--uui-color-text-alt, #68686a);
        border-radius: 1px;
      }

      .rf-chip-label {
        font-size: 11px;
        font-variant-numeric: tabular-nums;
      }

      .rf-chip-ai {
        position: absolute;
        top: 4px;
        right: 4px;
        font-size: 8px;
        font-weight: 700;
        letter-spacing: 0.04em;
        background: var(--rf-ai);
        color: #fff;
        padding: 1px 4px;
        border-radius: 999px;
      }

      .rf-custom {
        margin-top: var(--uui-size-space-4, 12px);
      }

      .rf-custom-row {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-top: 6px;
      }

      .rf-custom-row uui-input {
        width: 56px;
      }

      .rf-modes {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 6px;
      }

      .rf-mode {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 12px 8px;
        background: var(--uui-color-surface, #fff);
        border: 1px solid var(--uui-color-border, #e5e4df);
        border-radius: var(--uui-border-radius, 3px);
        cursor: pointer;
        color: inherit;
      }

      .rf-mode--active {
        border-color: var(--uui-color-selected, #3544b1);
        box-shadow: inset 0 0 0 1px var(--uui-color-selected, #3544b1);
      }

      .rf-mode:disabled {
        opacity: 0.5;
        cursor: default;
      }

      .rf-mode-title {
        font-weight: 700;
        font-size: 13px;
      }

      .rf-hint {
        margin: var(--uui-size-space-3, 9px) 0 0;
        font-size: 11px;
        color: var(--uui-color-text-alt, #68686a);
      }
    `
];
_([
  h({ attribute: !1 })
], g.prototype, "presets", 2);
_([
  h({ type: String })
], g.prototype, "sourceRatio", 2);
_([
  h({ type: String })
], g.prototype, "selectedRatio", 2);
_([
  h({ type: String })
], g.prototype, "selectedMode", 2);
_([
  h({ type: String })
], g.prototype, "providerName", 2);
_([
  h({ type: Boolean })
], g.prototype, "disabled", 2);
_([
  u()
], g.prototype, "_customX", 2);
_([
  u()
], g.prototype, "_customY", 2);
g = _([
  j("reframe-controls-rail")
], g);
var ye = Object.defineProperty, we = Object.getOwnPropertyDescriptor, L = (e) => {
  throw TypeError(e);
}, b = (e, t, i, a) => {
  for (var r = a > 1 ? void 0 : a ? we(t, i) : t, c = e.length - 1, l; c >= 0; c--)
    (l = e[c]) && (r = (a ? l(t, i, r) : l(r)) || r);
  return a && r && ye(t, i, r), r;
}, xe = (e, t, i) => t.has(e) || L("Cannot " + i), $e = (e, t, i) => t.has(e) ? L("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), N = (e, t, i) => (xe(e, t, "access private method"), i), M, V, J, Q;
let m = class extends K {
  constructor() {
    super(...arguments), $e(this, M), this.image = "", this.outputWidth = 1, this.outputHeight = 1, this.sourceRect = { x: 0, y: 0, width: 0, height: 0 }, this.generatedFraction = 0, this.indicator = "outline", this.projected = !1, this._sliderPos = 55;
  }
  get _hasGenerated() {
    return this.generatedFraction > 1e-4;
  }
  pct(e, t) {
    return t > 0 ? e / t * 100 : 0;
  }
  get _rectPct() {
    return {
      left: this.pct(this.sourceRect.x, this.outputWidth),
      top: this.pct(this.sourceRect.y, this.outputHeight),
      width: this.pct(this.sourceRect.width, this.outputWidth),
      height: this.pct(this.sourceRect.height, this.outputHeight)
    };
  }
  /** The four regions outside the kept rectangle — these are the generated pixels. */
  get _bands() {
    const e = this._rectPct, t = e.left + e.width, i = e.top + e.height;
    return [
      { left: 0, top: 0, width: 100, height: e.top },
      { left: 0, top: i, width: 100, height: 100 - i },
      { left: 0, top: e.top, width: e.left, height: e.height },
      { left: t, top: e.top, width: 100 - t, height: e.height }
    ].filter((a) => a.width > 0.01 && a.height > 0.01);
  }
  render() {
    return s`
      <div
        class="rf-stage rf-checkerboard"
        style=${`--rf-ar:${this.outputWidth / this.outputHeight}`}
      >
        ${this.indicator === "slider" && this._hasGenerated ? N(this, M, Q).call(this) : N(this, M, V).call(this)}
        ${N(this, M, J).call(this)}
      </div>
    `;
  }
};
M = /* @__PURE__ */ new WeakSet();
V = function() {
  if (this.projected) {
    const e = this._rectPct, t = `position:absolute;inset:auto;left:${e.left}%;top:${e.top}%;width:${e.width}%;height:${e.height}%;object-fit:fill`;
    return s`<img class="rf-img rf-img--projected" style=${t} src=${this.image} alt="Source preview" />`;
  }
  return s`<img class="rf-img" src=${this.image} alt="Reframed preview" />`;
};
J = function() {
  if (!this._hasGenerated || this.indicator === "off" || this.indicator === "slider")
    return f;
  const e = this._rectPct, t = `left:${e.left}%;top:${e.top}%;width:${e.width}%;height:${e.height}%`;
  return this.indicator === "outline" ? s`<div class="rf-ants" style=${t}></div>` : this.indicator === "tint" ? s`${this._bands.map(
    (i) => s`<div
            class="rf-tint"
            style=${`left:${i.left}%;top:${i.top}%;width:${i.width}%;height:${i.height}%`}
          ></div>`
  )}` : s`
      ${this._bands.map(
    (i) => s`<div
            class="rf-tint"
            style=${`left:${i.left}%;top:${i.top}%;width:${i.width}%;height:${i.height}%`}
          >
            <span class="rf-chip rf-chip--ai">AI</span>
          </div>`
  )}
      <div class="rf-orig-label" style=${t}>
        <span class="rf-chip rf-chip--orig">Original</span>
      </div>
    `;
};
Q = function() {
  const e = this._rectPct, t = `inset(${e.top}% ${100 - (e.left + e.width)}% ${100 - (e.top + e.height)}% ${e.left}%)`, i = `inset(0 ${100 - this._sliderPos}% 0 0)`;
  return s`
      <div class="rf-compare">
        <img class="rf-img" style=${`clip-path:${t}`} src=${this.image} alt="Original footprint" />
        <img class="rf-img rf-after" style=${`clip-path:${i}`} src=${this.image} alt="Reframed" />
        <input
          class="rf-handle"
          type="range"
          min="0"
          max="100"
          .value=${String(this._sliderPos)}
          @input=${(a) => this._sliderPos = Number(a.target.value)}
          aria-label="Compare original and reframed"
        />
        <div class="rf-handle-line" style=${`left:${this._sliderPos}%`}></div>
      </div>
    `;
};
m.styles = [
  H,
  W`
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
    `
];
b([
  h({ type: String })
], m.prototype, "image", 2);
b([
  h({ type: Number })
], m.prototype, "outputWidth", 2);
b([
  h({ type: Number })
], m.prototype, "outputHeight", 2);
b([
  h({ attribute: !1 })
], m.prototype, "sourceRect", 2);
b([
  h({ type: Number })
], m.prototype, "generatedFraction", 2);
b([
  h({ type: String })
], m.prototype, "indicator", 2);
b([
  h({ type: Boolean })
], m.prototype, "projected", 2);
b([
  u()
], m.prototype, "_sliderPos", 2);
m = b([
  j("reframe-preview")
], m);
var ke = Object.defineProperty, Re = Object.getOwnPropertyDescriptor, Z = (e) => {
  throw TypeError(e);
}, v = (e, t, i, a) => {
  for (var r = a > 1 ? void 0 : a ? Re(t, i) : t, c = e.length - 1, l; c >= 0; c--)
    (l = e[c]) && (r = (a ? l(t, i, r) : l(r)) || r);
  return a && r && ke(t, i, r), r;
}, X = (e, t, i) => t.has(e) || Z("Cannot " + i), p = (e, t, i) => (X(e, t, "read from private field"), i ? i.call(e) : t.get(e)), w = (e, t, i) => t.has(e) ? Z("Cannot add the same private member more than once") : t instanceof WeakSet ? t.add(e) : t.set(e, i), ee = (e, t, i, a) => (X(e, t, "write to private field"), t.set(e, i), i), n = (e, t, i) => (X(e, t, "access private method"), i), k, P, x, o, te, A, I, F, O, Y, ie, D, re, ae, se, oe, ne, ce, le;
let d = class extends de(K) {
  constructor() {
    super(), w(this, o), w(this, k, new fe()), w(this, P), w(this, x), this._state = "loading", this._selectedMode = "outpaint", this._anchor = "center", this._indicator = "outline", w(this, A, (e) => {
      this._selectedRatio = e.detail, this._preview = void 0, this._state = "awaiting", this._selectedMode === "crop" && n(this, o, F).call(this);
    }), w(this, I, (e) => {
      if (this._selectedMode = e.detail, this._preview = void 0, !this._selectedRatio) {
        this._state = "initial";
        return;
      }
      this._selectedMode === "crop" ? n(this, o, F).call(this) : this._state = "awaiting";
    }), w(this, Y, () => {
      p(this, x)?.abort(), this._state = "awaiting";
    }), this.consumeContext(ue, (e) => ee(this, P, e)), this.consumeContext(he, (e) => {
      this.observe(
        e?.unique,
        (t) => {
          t && t !== this._mediaKey && (this._mediaKey = t, n(this, o, te).call(this));
        },
        "_reframeUnique"
      );
    });
  }
  render() {
    return this._state === "loading" ? s`<div class="rf-center"><uui-loader></uui-loader></div>` : this._state === "error" && !this._caps ? s`<div class="rf-center">${this._error}</div>` : s`
      <umb-body-layout header-transparent>
        <div class="rf-layout">
          <reframe-controls-rail
            .presets=${this._caps?.presets ?? []}
            .sourceRatio=${this._caps?.source.ratio ?? ""}
            .selectedRatio=${this._selectedRatio}
            .selectedMode=${this._selectedMode}
            .providerName=${this._caps?.providerName ?? ""}
            ?disabled=${this._state === "generating"}
            @ratio-change=${p(this, A)}
            @mode-change=${p(this, I)}
          ></reframe-controls-rail>
          <div class="rf-main">${n(this, o, re).call(this)}</div>
        </div>
      </umb-body-layout>
    `;
  }
};
k = /* @__PURE__ */ new WeakMap();
P = /* @__PURE__ */ new WeakMap();
x = /* @__PURE__ */ new WeakMap();
o = /* @__PURE__ */ new WeakSet();
te = async function() {
  if (!this._mediaKey) return;
  this._state = "loading";
  const { data: e, error: t } = await p(this, k).capabilities(this._mediaKey);
  if (t || !e) {
    this._error = "This media item could not be read as an image.", this._state = "error";
    return;
  }
  this._caps = e, this._state = "initial";
};
A = /* @__PURE__ */ new WeakMap();
I = /* @__PURE__ */ new WeakMap();
F = async function() {
  if (!this._mediaKey || !this._selectedRatio) return;
  const { data: e, error: t } = await p(this, k).crop(this._mediaKey, this._selectedRatio, this._anchor);
  if (t || !e) {
    this._error = "Crop failed.", this._state = "error";
    return;
  }
  this._preview = e, this._state = "crop-preview";
};
O = async function() {
  if (!this._mediaKey || !this._selectedRatio) return;
  p(this, x)?.abort(), ee(this, x, new AbortController()), this._error = void 0, this._state = "generating";
  const { data: e, error: t } = await p(this, k).outpaint(
    this._mediaKey,
    this._selectedRatio,
    p(this, x).signal
  );
  if (p(this, x).signal.aborted) {
    this._state = "awaiting";
    return;
  }
  if (t || !e) {
    this._error = typeof t == "string" ? t : "Generation failed. No changes were made to your image.", this._state = "error";
    return;
  }
  this._preview = e, this._indicator = "outline", this._state = "preview-ready";
};
Y = /* @__PURE__ */ new WeakMap();
ie = async function() {
  if (!this._mediaKey || !this._preview) return;
  const { data: e, error: t } = await p(this, k).accept(this._mediaKey, this._preview.token);
  if (t || !e) {
    p(this, P)?.peek("danger", { data: { headline: "Couldn't save", message: "The reframed image could not be saved." } });
    return;
  }
  p(this, P)?.peek("positive", {
    data: { headline: "Saved", message: `Created new media item “${e.name}”.` }
  }), n(this, o, D).call(this);
};
D = function() {
  this._selectedRatio = void 0, this._preview = void 0, this._state = "initial";
};
re = function() {
  switch (this._state) {
    case "initial":
      return n(this, o, ae).call(this);
    case "awaiting":
      return n(this, o, se).call(this);
    case "generating":
      return n(this, o, oe).call(this);
    case "crop-preview":
    case "preview-ready":
      return n(this, o, ne).call(this);
    case "error":
      return n(this, o, le).call(this);
    default:
      return f;
  }
};
ae = function() {
  const e = this._caps?.source;
  return e ? s`
      <div class="rf-preview-wrap">
        <reframe-preview
          projected
          .image=${e.url}
          .outputWidth=${e.width}
          .outputHeight=${e.height}
          .sourceRect=${{ x: 0, y: 0, width: e.width, height: e.height }}
          .generatedFraction=${0}
          indicator="off"
        ></reframe-preview>
        <div class="rf-muted" style="text-align:center">Pick an aspect ratio to start.</div>
      </div>
    ` : s`<div class="rf-center rf-muted">Pick an aspect ratio to start.</div>`;
};
se = function() {
  const e = this._caps?.source, t = e && this._selectedRatio ? ge(e.width, e.height, this._selectedRatio) : void 0;
  return s`
      <div class="rf-preview-wrap">
        ${e && t ? s`<reframe-preview
              projected
              .image=${e.url}
              .outputWidth=${t.outputWidth}
              .outputHeight=${t.outputHeight}
              .sourceRect=${t.sourceRect}
              .generatedFraction=${t.generatedFraction}
              indicator="outline"
            ></reframe-preview>` : f}
        <div class="rf-toolbar">
          <span class="rf-meta">
            Ready to outpaint to <strong>${this._selectedRatio}</strong>${t ? s` · ${Math.round(t.generatedFraction * 100)}% will be generated` : f}
          </span>
          <uui-button look="primary" color="positive" label="Generate" @click=${n(this, o, O)}>Generate</uui-button>
        </div>
      </div>
    `;
};
oe = function() {
  return s`
      <div class="rf-center">
        <div class="rf-shimmerbar"></div>
        <p class="rf-muted">Generating with ${this._caps?.providerName ?? "the AI provider"}…</p>
        <uui-button look="secondary" label="Cancel generation" @click=${p(this, Y)}>Cancel generation</uui-button>
      </div>
    `;
};
ne = function() {
  const e = this._preview, t = this._state === "preview-ready";
  return s`
      <div class="rf-preview-wrap">
        <reframe-preview
          .image=${e.previewDataUrl}
          .outputWidth=${e.outputWidth}
          .outputHeight=${e.outputHeight}
          .sourceRect=${e.sourceRect}
          .generatedFraction=${e.generatedFraction}
          .indicator=${this._indicator}
        ></reframe-preview>

        <div class="rf-toolbar">
          ${t ? n(this, o, ce).call(this) : f}
          ${t && e.generatedFraction > 0 ? s`<span class="rf-meta">${Math.round(e.generatedFraction * 100)}% generated${e.elapsedMs ? ` · ${(e.elapsedMs / 1e3).toFixed(1)}s` : ""}${e.requestId ? ` · ${e.requestId}` : ""}</span>` : f}
        </div>

        <div class="rf-actions">
          <uui-button look="primary" color="positive" label="Save as new" @click=${n(this, o, ie)}>Save as new</uui-button>
          ${t ? s`<uui-button look="secondary" label="Regenerate" @click=${n(this, o, O)}>Regenerate</uui-button>` : f}
          <uui-button look="secondary" label="Cancel" @click=${() => n(this, o, D).call(this)}>Cancel</uui-button>
        </div>
      </div>
    `;
};
ce = function() {
  return s`
      <uui-button-group>
        ${[
    { value: "outline", label: "Outline" },
    { value: "tint", label: "Tint" },
    { value: "labels", label: "Labels" },
    { value: "slider", label: "Compare" },
    { value: "off", label: "Off" }
  ].map(
    (t) => s`<uui-button
            look=${this._indicator === t.value ? "primary" : "secondary"}
            compact
            label=${t.label}
            @click=${() => this._indicator = t.value}
            >${t.label}</uui-button
          >`
  )}
      </uui-button-group>
    `;
};
le = function() {
  return s`
      <div class="rf-center">
        <uui-icon name="icon-alert"></uui-icon>
        <p>${this._error ?? "Something went wrong."}</p>
        <p class="rf-muted">Your original image is unchanged.</p>
        <div class="rf-actions">
          <uui-button look="primary" label="Try again" @click=${n(this, o, O)}>Try again</uui-button>
          <uui-button look="secondary" label="Pick another ratio" @click=${() => this._state = "initial"}>Pick another ratio</uui-button>
        </div>
      </div>
    `;
};
d.styles = [
  H,
  W`
      :host {
        display: block;
        height: 100%;
      }

      .rf-layout {
        display: flex;
        height: 100%;
        min-height: 480px;
      }

      .rf-main {
        flex: 1;
        display: flex;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        padding: var(--uui-size-layout-1, 24px);
      }

      .rf-center {
        margin: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: var(--uui-size-space-4, 12px);
        text-align: center;
      }

      .rf-muted {
        color: var(--uui-color-text-alt, #68686a);
      }

      .rf-meta {
        font-size: 11px;
        color: var(--uui-color-text-alt, #68686a);
      }

      .rf-preview-wrap {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: var(--uui-size-space-4, 12px);
        min-width: 0;
        min-height: 0;
      }

      reframe-preview {
        flex: 1;
        min-height: 0;
      }

      .rf-toolbar {
        flex-shrink: 0;
      }

      .rf-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: var(--uui-size-space-4, 12px);
        flex-wrap: wrap;
      }

      .rf-actions {
        display: flex;
        gap: var(--uui-size-space-3, 9px);
        justify-content: flex-end;
      }

      .rf-shimmerbar {
        width: 220px;
        height: 8px;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--uui-color-surface-alt, #eee) 0%, var(--rf-ai) 50%, var(--uui-color-surface-alt, #eee) 100%);
        background-size: 200% 100%;
        animation: rf-shimmer 1.4s linear infinite;
      }
    `
];
v([
  u()
], d.prototype, "_state", 2);
v([
  u()
], d.prototype, "_mediaKey", 2);
v([
  u()
], d.prototype, "_caps", 2);
v([
  u()
], d.prototype, "_selectedRatio", 2);
v([
  u()
], d.prototype, "_selectedMode", 2);
v([
  u()
], d.prototype, "_anchor", 2);
v([
  u()
], d.prototype, "_preview", 2);
v([
  u()
], d.prototype, "_indicator", 2);
v([
  u()
], d.prototype, "_error", 2);
d = v([
  j("reframe-workspace-view")
], d);
const Se = d;
export {
  d as ReframeWorkspaceViewElement,
  Se as default
};
//# sourceMappingURL=reframe-workspace-view.element-Bf5vtLK_.js.map
