import { client } from "../../api/client.gen.js";

// Thin typed wrapper over the AIReframe backoffice API. Hand-written against the
// ReframeController DTOs so the workspace view is functional without regenerating the
// OpenAPI client; `npm run generate-client` (against the running site) will additionally
// surface these as AIReframeService methods.

const BASE = "/umbraco/aireframe/api/v1";
const SECURITY = [{ scheme: "bearer", type: "http" }] as const;

export interface ReframeSourceInfo {
  mediaKey: string;
  width: number;
  height: number;
  ratio: string;
  url: string;
}

export interface ReframeRatioOption {
  ratio: string;
  canCrop: boolean;
  contentChangeFraction: number;
}

export interface ReframeCapabilities {
  source: ReframeSourceInfo;
  presets: ReframeRatioOption[];
  maxEdge: number;
  providerName: string;
}

export interface ReframeRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ReframeModeName = "crop" | "outpaint";

export interface ReframePreview {
  token: string;
  mode: ReframeModeName;
  outputWidth: number;
  outputHeight: number;
  sourceRect: ReframeRect;
  generatedFraction: number;
  previewDataUrl: string;
  requestId?: string | null;
  elapsedMs?: number | null;
}

export interface ReframeAccepted {
  mediaKey: string;
  name: string;
}

export type CropAnchorName = "center" | "top" | "bottom";

export class ReframeRepository {
  async capabilities(mediaKey: string) {
    return client.get<ReframeCapabilities>({
      security: SECURITY,
      url: `${BASE}/capabilities`,
      query: { mediaKey },
    });
  }

  async crop(mediaKey: string, ratio: string, anchor: CropAnchorName) {
    return client.post<ReframePreview>({
      security: SECURITY,
      url: `${BASE}/crop`,
      body: { mediaKey, ratio, anchor },
    });
  }

  async outpaint(mediaKey: string, ratio: string, signal?: AbortSignal, prompt?: string) {
    return client.post<ReframePreview>({
      security: SECURITY,
      url: `${BASE}/outpaint`,
      body: { mediaKey, ratio, prompt },
      signal,
    });
  }

  async accept(mediaKey: string, token: string) {
    return client.post<ReframeAccepted>({
      security: SECURITY,
      url: `${BASE}/accept`,
      body: { mediaKey, token },
    });
  }
}
