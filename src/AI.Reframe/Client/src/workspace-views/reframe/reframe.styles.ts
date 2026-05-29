import { css } from "@umbraco-cms/backoffice/external/lit";

// Signature visual language lifted from the design (see docs/design-reference): magenta is reserved
// exclusively for the AI-generated signal; the marching-ants / shimmer / pulse keyframes; the
// checkerboard preview backdrop. Chrome (surfaces, fonts, spacing) uses UUI theme tokens instead of
// the prototype's Geist + warm off-white, so it sits natively in the backoffice (ADR-0001).
export const reframeShared = css`
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
