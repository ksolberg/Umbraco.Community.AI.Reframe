# AI.Reframe

**Reframe image media to a new aspect ratio without ever leaving the Umbraco backoffice.**

Need a 16:9 hero, a 1:1 thumbnail and a 9:16 story from one picture? AI.Reframe adds a **Reframe** view to every Image media item so editors can retarget an image in seconds — no external tools, no round-trips to a designer.

## Two ways to reframe

- **Crop** — instant, free and geometric. Keeps a sub-region of the original. Offered whenever it would discard a reasonable amount of content, and runs entirely on your own server.
- **Outpaint** — extends the canvas and lets **OpenAI gpt-image-2** generate the new edges, so every original pixel is preserved and the picture grows naturally into its new shape.

Preview the result with a before/after compare slider and a generated-region indicator, then **Accept** to save it as a **new media item** beside the original. The source image is never modified.

## Why editors like it

- Works directly on any Image in the Media section — zero configuration to start cropping.
- Honest, up-front estimate of how much of the image will change before you commit.
- Non-destructive: results are always saved as a new item, so the original stays intact.
- Free by default — Crop needs no API key and incurs no cost.

## Demo

https://github.com/user-attachments/assets/d0e0f7e0-c603-4491-b9a3-ace7316d173a

## Screenshots

<img alt="The Reframe view: choose a target aspect ratio and Crop or Outpaint mode" src="https://raw.githubusercontent.com/ksolberg/Umbraco.Community.AI.Reframe/main/docs/screenshots/1.png">

<img alt="Outpainted preview with the generated region outlined" src="https://raw.githubusercontent.com/ksolberg/Umbraco.Community.AI.Reframe/main/docs/screenshots/2.png">

<img alt="Before/after compare slider" src="https://raw.githubusercontent.com/ksolberg/Umbraco.Community.AI.Reframe/main/docs/screenshots/3.png">

## Requirements

- Umbraco CMS **17+**
- .NET **10**
- An **OpenAI API key** — only needed for **Outpaint**. Crop works without any key or cost.

> ⚠️ Outpaint calls OpenAI's image API and **incurs OpenAI usage cost** on your own account. Crop is always free.

## Get started

```bash
dotnet add package Umbraco.Community.AI.Reframe
```

The backoffice client registers itself automatically — no manifest wiring needed. To enable Outpaint, set your OpenAI API key:

```bash
dotnet user-secrets set "AIReframe:OpenAI:ApiKey" "sk-..."
```

Then open any Image media item, switch to the **Reframe** view, pick a target ratio and a mode, preview, and **Accept**.

Full configuration options and documentation are on the [project page](https://github.com/ksolberg/Umbraco.Community.AI.Reframe).

## License

MIT — see the [LICENSE](https://github.com/ksolberg/Umbraco.Community.AI.Reframe/blob/main/LICENSE).
