# Illustrated wrist tablet

- Asset: [`wrist-tablet-2d.png`](wrist-tablet-2d.png), 1536 × 1024 RGBA.
- Created with the built-in `image_gen` tool on 2026-10-22 for CodeQuest's 2D opening animation.
- Original generated artwork; no third-party character model or game footage.
- The PNG's alpha is preserved. The forearm, hand, sleeve, straps and bezel are one illustrated foreground; Canvas 2D animates its lift, settle and screen entry over the city.
- The display is intentionally blank in the artwork. The game draws the player's personal boot display inside the inset rectangle recorded in `src/game/tablet-frame.ts`.

## Exact generation prompt

```text
Use case: stylized-concept. Asset type: production 2D game animation sprite, one transparent PNG, landscape 1536x1024. Create an elegant HAND-DRAWN 2D illustrated first-person wrist computer for a modern coding adventure game. NOT a 3D render. Crisp ink contours, tasteful cel shading, subtle painted gradients, polished indie adventure game art. A single anatomically believable left forearm with a charcoal navy hoodie sleeve enters from the bottom-left edge and supports a slim landscape tablet strapped across the top of its wrist. The natural warm medium-tan hand extends just beyond the top-right of the device in a relaxed, slightly curled pose; correct hand anatomy, five fingers, subtle knuckles, no extra digits. The attached tablet is the dominant central object: slim dark navy metal bezel, small teal accents and two visible wrist straps. Its display is a completely EMPTY flat solid dark navy rectangle (#091723), front-facing and exactly horizontal, with straight parallel edges and 16:10 proportions, approximately spanning x=390 to1150, y=190 to665 in the 1536x1024 composition. Do not cover the display with any fingers or sleeve. Reserve the screen for a live programmatically drawn UI. Frame should be large and readable with refined small hardware details, no big screws or chunky lights. Forearm, wrist attachment and hand must look connected and anatomically natural. No other hands, no face, no body, no environment, no background, no lettering, no UI text, no logo, no watermark. Genuine transparent alpha around this single foreground cutout; no checkerboard drawn into image. Keep everything inside canvas except the sleeve intentionally running off the bottom-left edge. The result should feel like a warm, polished 2D adventure illustration, not plastic geometry, not photorealistic and not a wireframe.
```
