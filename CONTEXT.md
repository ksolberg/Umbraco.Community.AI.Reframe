# AI.Reframe

An Umbraco backoffice extension that lets editors change the aspect ratio of an
image, either by cropping or by AI outpainting (generating new pixels to extend
the frame). It surfaces as a Reframe view on an image in the Media section.

## Language

**Reframe**:
The act of producing a new version of an image at a different aspect ratio. The
umbrella operation the tool performs; realised as either a Crop or an Outpaint.

**Source image**:
The original image being reframed — the file on the current Media item.
_Avoid_: input, asset, field image.

**Target ratio**:
The aspect ratio the editor wants the result to have (e.g. 16:9), chosen from a
preset chip or a custom `x:y` value.

**Crop**:
A reframe that only removes pixels to reach the target ratio — geometric,
instant, no AI. Possible only when the target ratio fits inside the source.
_Avoid_: trim, cut.

**Outpaint**:
A reframe that uses an AI image model to generate new pixels extending the
source to reach the target ratio. Slow and metered, unlike Crop.
_Avoid_: extend, fill, expand, inpaint (inpaint fills holes; this extends edges).

**Generated region**:
The pixels an Outpaint invented, as opposed to the Source pixels carried over.
Making this visually obvious is the tool's single most important detail.
_Avoid_: AI area, fake region.

**Reframed image**:
The finished result of a Reframe (the cropped or outpainted image) that the
editor reviews before accepting.
_Avoid_: output, generated image (ambiguous with generated region).
