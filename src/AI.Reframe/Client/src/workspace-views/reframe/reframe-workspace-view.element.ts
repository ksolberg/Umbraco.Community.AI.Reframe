import {
  LitElement,
  css,
  html,
  nothing,
  customElement,
  state,
} from "@umbraco-cms/backoffice/external/lit";
import { UmbElementMixin } from "@umbraco-cms/backoffice/element-api";
import { UMB_ENTITY_WORKSPACE_CONTEXT } from "@umbraco-cms/backoffice/workspace";
import { UMB_NOTIFICATION_CONTEXT } from "@umbraco-cms/backoffice/notification";
import {
  ReframeRepository,
  type CropAnchorName,
  type ReframeCapabilities,
  type ReframeModeName,
  type ReframePreview,
} from "./reframe.repository.js";
import { reframeShared } from "./reframe.styles.js";
import { projectOutpaint } from "./reframe.projection.js";
import type { IndicatorMode } from "./reframe-preview.element.js";
import "./reframe-controls-rail.element.js";
import "./reframe-preview.element.js";

// The Reframe flow, encoded as an explicit machine (mirrors the PRD state diagram).
type ReframeState = "loading" | "initial" | "awaiting" | "crop-preview" | "generating" | "preview-ready" | "error";

/**
 * Reframe workspace view for Image media. Owns the state machine and all API calls; the controls
 * rail and preview are presentational children driven by props/events. The source is never mutated —
 * Accept creates a new Media item (ADR-0002).
 */
@customElement("reframe-workspace-view")
export class ReframeWorkspaceViewElement extends UmbElementMixin(LitElement) {
  #repository = new ReframeRepository();
  #notification?: typeof UMB_NOTIFICATION_CONTEXT.TYPE;
  #abort?: AbortController;

  @state() private _state: ReframeState = "loading";
  @state() private _mediaKey?: string;
  @state() private _caps?: ReframeCapabilities;
  @state() private _selectedRatio?: string;
  @state() private _selectedMode: ReframeModeName = "outpaint";
  @state() private _anchor: CropAnchorName = "center";
  @state() private _preview?: ReframePreview;
  @state() private _indicator: IndicatorMode = "outline";
  @state() private _error?: string;

  constructor() {
    super();

    this.consumeContext(UMB_NOTIFICATION_CONTEXT, (ctx) => (this.#notification = ctx));

    this.consumeContext(UMB_ENTITY_WORKSPACE_CONTEXT, (workspace) => {
      this.observe(
        workspace?.unique,
        (unique) => {
          if (unique && unique !== this._mediaKey) {
            this._mediaKey = unique;
            this.#loadCapabilities();
          }
        },
        "_reframeUnique"
      );
    });
  }

  async #loadCapabilities() {
    if (!this._mediaKey) return;
    this._state = "loading";
    const { data, error } = await this.#repository.capabilities(this._mediaKey);
    if (error || !data) {
      this._error = "This media item could not be read as an image.";
      this._state = "error";
      return;
    }
    this._caps = data;
    this._state = "initial";
  }

  #onRatioChange = (e: CustomEvent) => {
    this._selectedRatio = e.detail as string;
    this._preview = undefined;
    // Picking a ratio moves us to 'awaiting'; if crop is the active mode, apply it immediately.
    this._state = "awaiting";
    if (this._selectedMode === "crop") {
      this.#applyCrop();
    }
  };

  #onModeChange = (e: CustomEvent) => {
    this._selectedMode = e.detail as ReframeModeName;
    this._preview = undefined;
    if (!this._selectedRatio) {
      this._state = "initial";
      return;
    }
    if (this._selectedMode === "crop") {
      this.#applyCrop();
    } else {
      this._state = "awaiting";
    }
  };

  async #applyCrop() {
    if (!this._mediaKey || !this._selectedRatio) return;
    const { data, error } = await this.#repository.crop(this._mediaKey, this._selectedRatio, this._anchor);
    if (error || !data) {
      this._error = "Crop failed.";
      this._state = "error";
      return;
    }
    this._preview = data;
    this._state = "crop-preview";
  }

  async #generate() {
    if (!this._mediaKey || !this._selectedRatio) return;
    this.#abort?.abort();
    this.#abort = new AbortController();
    this._error = undefined;
    this._state = "generating";

    const { data, error } = await this.#repository.outpaint(
      this._mediaKey,
      this._selectedRatio,
      this.#abort.signal
    );

    if (this.#abort.signal.aborted) {
      this._state = "awaiting";
      return;
    }
    if (error || !data) {
      this._error = typeof error === "string" ? error : "Generation failed. No changes were made to your image.";
      this._state = "error";
      return;
    }
    this._preview = data;
    this._indicator = "outline";
    this._state = "preview-ready";
  }

  #cancelGeneration = () => {
    this.#abort?.abort();
    this._state = "awaiting";
  };

  async #accept() {
    if (!this._mediaKey || !this._preview) return;
    const { data, error } = await this.#repository.accept(this._mediaKey, this._preview.token);
    if (error || !data) {
      this.#notification?.peek("danger", { data: { headline: "Couldn't save", message: "The reframed image could not be saved." } });
      return;
    }
    this.#notification?.peek("positive", {
      data: { headline: "Saved", message: `Created new media item “${data.name}”.` },
    });
    this.#reset();
  }

  #reset() {
    this._selectedRatio = undefined;
    this._preview = undefined;
    this._state = "initial";
  }

  render() {
    if (this._state === "loading") {
      return html`<div class="rf-center"><uui-loader></uui-loader></div>`;
    }
    if (this._state === "error" && !this._caps) {
      return html`<div class="rf-center">${this._error}</div>`;
    }

    return html`
      <umb-body-layout header-transparent>
        <div class="rf-layout">
          <reframe-controls-rail
            .presets=${this._caps?.presets ?? []}
            .sourceRatio=${this._caps?.source.ratio ?? ""}
            .selectedRatio=${this._selectedRatio}
            .selectedMode=${this._selectedMode}
            .providerName=${this._caps?.providerName ?? ""}
            ?disabled=${this._state === "generating"}
            @ratio-change=${this.#onRatioChange}
            @mode-change=${this.#onModeChange}
          ></reframe-controls-rail>
          <div class="rf-main">${this.#renderStage()}</div>
        </div>
      </umb-body-layout>
    `;
  }

  #renderStage() {
    switch (this._state) {
      case "initial":
        return this.#renderInitial();
      case "awaiting":
        return this.#renderAwaiting();
      case "generating":
        return this.#renderGenerating();
      case "crop-preview":
      case "preview-ready":
        return this.#renderPreview();
      case "error":
        return this.#renderError();
      default:
        return nothing;
    }
  }

  #renderInitial() {
    const source = this._caps?.source;
    if (!source) {
      return html`<div class="rf-center rf-muted">Pick an aspect ratio to start.</div>`;
    }
    return html`
      <div class="rf-preview-wrap">
        <reframe-preview
          projected
          .image=${source.url}
          .outputWidth=${source.width}
          .outputHeight=${source.height}
          .sourceRect=${{ x: 0, y: 0, width: source.width, height: source.height }}
          .generatedFraction=${0}
          indicator="off"
        ></reframe-preview>
        <div class="rf-muted" style="text-align:center">Pick an aspect ratio to start.</div>
      </div>
    `;
  }

  #renderAwaiting() {
    const source = this._caps?.source;
    const projection = source && this._selectedRatio
      ? projectOutpaint(source.width, source.height, this._selectedRatio)
      : undefined;

    return html`
      <div class="rf-preview-wrap">
        ${source && projection
          ? html`<reframe-preview
              projected
              .image=${source.url}
              .outputWidth=${projection.outputWidth}
              .outputHeight=${projection.outputHeight}
              .sourceRect=${projection.sourceRect}
              .generatedFraction=${projection.generatedFraction}
              indicator="outline"
            ></reframe-preview>`
          : nothing}
        <div class="rf-toolbar">
          <span class="rf-meta">
            Ready to outpaint to <strong>${this._selectedRatio}</strong>${projection
              ? html` · ${Math.round(projection.generatedFraction * 100)}% will be generated`
              : nothing}
          </span>
          <uui-button look="primary" color="positive" label="Generate" @click=${this.#generate}>Generate</uui-button>
        </div>
      </div>
    `;
  }

  #renderGenerating() {
    return html`
      <div class="rf-center">
        <div class="rf-shimmerbar"></div>
        <p class="rf-muted">Generating with ${this._caps?.providerName ?? "the AI provider"}…</p>
        <uui-button look="secondary" label="Cancel generation" @click=${this.#cancelGeneration}>Cancel generation</uui-button>
      </div>
    `;
  }

  #renderPreview() {
    const p = this._preview!;
    const isOutpaint = this._state === "preview-ready";
    return html`
      <div class="rf-preview-wrap">
        <reframe-preview
          .image=${p.previewDataUrl}
          .outputWidth=${p.outputWidth}
          .outputHeight=${p.outputHeight}
          .sourceRect=${p.sourceRect}
          .generatedFraction=${p.generatedFraction}
          .indicator=${this._indicator}
        ></reframe-preview>

        <div class="rf-toolbar">
          ${isOutpaint ? this.#renderIndicatorToggle() : nothing}
          ${isOutpaint && p.generatedFraction > 0
            ? html`<span class="rf-meta">${Math.round(p.generatedFraction * 100)}% generated${p.elapsedMs ? ` · ${(p.elapsedMs / 1000).toFixed(1)}s` : ""}${p.requestId ? ` · ${p.requestId}` : ""}</span>`
            : nothing}
        </div>

        <div class="rf-actions">
          <uui-button look="primary" color="positive" label="Save as new" @click=${this.#accept}>Save as new</uui-button>
          ${isOutpaint
            ? html`<uui-button look="secondary" label="Regenerate" @click=${this.#generate}>Regenerate</uui-button>`
            : nothing}
          <uui-button look="secondary" label="Cancel" @click=${() => this.#reset()}>Cancel</uui-button>
        </div>
      </div>
    `;
  }

  #renderIndicatorToggle() {
    const modes: { value: IndicatorMode; label: string }[] = [
      { value: "outline", label: "Outline" },
      { value: "tint", label: "Tint" },
      { value: "labels", label: "Labels" },
      { value: "slider", label: "Compare" },
      { value: "off", label: "Off" },
    ];
    return html`
      <uui-button-group>
        ${modes.map(
          (m) => html`<uui-button
            look=${this._indicator === m.value ? "primary" : "secondary"}
            compact
            label=${m.label}
            @click=${() => (this._indicator = m.value)}
            >${m.label}</uui-button
          >`
        )}
      </uui-button-group>
    `;
  }

  #renderError() {
    return html`
      <div class="rf-center">
        <uui-icon name="icon-alert"></uui-icon>
        <p>${this._error ?? "Something went wrong."}</p>
        <p class="rf-muted">Your original image is unchanged.</p>
        <div class="rf-actions">
          <uui-button look="primary" label="Try again" @click=${this.#generate}>Try again</uui-button>
          <uui-button look="secondary" label="Pick another ratio" @click=${() => (this._state = "initial")}>Pick another ratio</uui-button>
        </div>
      </div>
    `;
  }

  static styles = [
    reframeShared,
    css`
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
    `,
  ];
}

export default ReframeWorkspaceViewElement;

declare global {
  interface HTMLElementTagNameMap {
    "reframe-workspace-view": ReframeWorkspaceViewElement;
  }
}
