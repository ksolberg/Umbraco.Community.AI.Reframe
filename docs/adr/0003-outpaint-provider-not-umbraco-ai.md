# Outpaint goes through our own provider seam, not Umbraco.AI

The TestSite already has Umbraco.AI (1.12) and Umbraco.AI.OpenAI installed, so
the obvious question is "why not outpaint through an Umbraco AI profile?".
Because Umbraco.AI's only capabilities today are **Chat** and **Embedding** —
image generation is on its roadmap but not shipped, and there is no image/edit
service to call. Its Connections store provider credentials, but those secrets
aren't reliably exposed to third-party consumers.

So AI.Reframe defines its own `IReframeImageProvider` seam with a self-contained
gpt-image-2 implementation, configured from an `AIReframe` appsettings section
(OpenAI key + model). The shippable package takes **no hard dependency** on
Umbraco.AI, so it works on any Umbraco 17 site.

## Consequences

- Outpaint credentials are configured separately from the host's Umbraco AI
  connections (two places to hold an OpenAI key if both are used).
- When Umbraco.AI ships an image capability, an `IReframeImageProvider` backed
  by an Umbraco AI profile can be added behind the same seam without touching
  callers — the reason the seam exists now.
