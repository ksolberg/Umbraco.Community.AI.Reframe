# AI.Reframe

[![Downloads](https://img.shields.io/nuget/dt/Umbraco.Community.AI.Reframe?color=cc9900)](https://www.nuget.org/packages/Umbraco.Community.AI.Reframe/)
[![NuGet](https://img.shields.io/nuget/vpre/Umbraco.Community.AI.Reframe?color=0273B3)](https://www.nuget.org/packages/Umbraco.Community.AI.Reframe)
[![GitHub license](https://img.shields.io/github/license/ksolberg/Umbraco.Community.AI.Reframe?color=8AB803)](../LICENSE)

Reframe image media to a new aspect ratio without leaving the Umbraco backoffice.

AI.Reframe adds a **Reframe** view to every Image media item. Pick a target ratio (16:9, 1:1, 9:16, … or your own), then take the image there in one of two ways:

- **Crop** — instant, free and geometric. Keeps a sub-region of the original.
- **Outpaint** — extends the canvas and lets **OpenAI gpt-image-2** generate the new edges, so every original pixel is preserved and the picture grows into the new shape.

Preview the result with a before/after compare and a generated-region indicator, then **Accept** to save it as a **new media item** next to the original. The source image is never modified.

## Screenshots

<img alt="The Reframe view: choose a target aspect ratio and Crop or Outpaint mode" src="https://raw.githubusercontent.com/ksolberg/Umbraco.Community.AI.Reframe/main/docs/screenshots/1.png">

<img alt="Outpainted preview with the generated region outlined" src="https://raw.githubusercontent.com/ksolberg/Umbraco.Community.AI.Reframe/main/docs/screenshots/2.png">

<img alt="Before/after compare slider" src="https://raw.githubusercontent.com/ksolberg/Umbraco.Community.AI.Reframe/main/docs/screenshots/3.png">

## Requirements

- Umbraco CMS **17+**
- .NET **10**
- An **OpenAI API key** — only needed for **Outpaint**. Crop works without any key or cost.

> ⚠️ Outpaint calls OpenAI's image API and **incurs OpenAI usage cost** on your own account. Crop is always free and runs entirely on your server.

## Installation

Add the package to an existing Umbraco website (v17+) from NuGet:

```bash
dotnet add package Umbraco.Community.AI.Reframe
```

The backoffice client registers itself automatically — no manifest wiring needed.

## Configuration

Provide your OpenAI API key (required for Outpaint only). **Never commit it to source control.**

Local development (user-secrets):

```bash
dotnet user-secrets set "AIReframe:OpenAI:ApiKey" "sk-..."
```

Production (environment variable):

```
AIReframe__OpenAI__ApiKey=sk-...
```

Optional settings (shown with defaults) in `appsettings.json`:

```json
{
  "AIReframe": {
    "OpenAI": {
      "Model": "gpt-image-2",
      "BaseUrl": "https://api.openai.com/v1",
      "TimeoutSeconds": 180
    },
    "Output": {
      "Format": "webp",
      "MaxEdge": 2048
    }
  }
}
```

## Usage

1. Open any **Image** media item in the backoffice.
2. Switch to the **Reframe** view.
3. Choose a target aspect ratio and a mode (**Crop** or **Outpaint**).
4. Preview the result, then click **Save as new** to create a new media item beside the original.

## Contributing

Contributions are welcome — please open an issue or pull request.

## License

[MIT](../LICENSE)
