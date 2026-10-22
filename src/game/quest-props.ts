import type Phaser from "phaser";

export function createQuestProps(scene: Phaser.Scene): void {
  const source = scene.textures.get("quest-props-source").getSourceImage() as HTMLImageElement;
  const scratch = document.createElement("canvas");
  scratch.width = source.width;
  scratch.height = source.height;
  const ctx = scratch.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Quest artwork needs a canvas context.");
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
  const atlas = document.createElement("canvas");
  atlas.width = 384;
  atlas.height = 112;
  const draw = atlas.getContext("2d");
  if (!draw) throw new Error("Quest artwork needs a canvas context.");
  draw.imageSmoothingEnabled = false;
  const cellWidth = Math.floor(source.width / 4);
  const boxes = Array.from({ length: 4 }, (_, index) => {
    let left = source.width,
      right = 0,
      top = source.height,
      bottom = 0;
    for (let y = 0; y < source.height; y++)
      for (let x = index * cellWidth; x < (index + 1) * cellWidth; x++) {
        if ((pixels[(y * source.width + x) * 4 + 3] ?? 0) < 40) continue;
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
    return { left, top, width: right - left + 1, height: bottom - top + 1 };
  });
  const chestScale = 82 / Math.max(boxes[0]?.width ?? 1, boxes[1]?.width ?? 1);
  for (const [index, box] of boxes.entries()) {
    const scale = index < 2 ? chestScale : Math.min(82 / box.width, 104 / box.height);
    const width = box.width * scale,
      height = box.height * scale;
    draw.drawImage(
      source,
      box.left,
      box.top,
      box.width,
      box.height,
      index * 96 + (96 - width) / 2,
      106 - height,
      width,
      height,
    );
  }
  const texture = scene.textures.addCanvas("tech-props", atlas);
  if (texture) scene.textures.addSpriteSheet("", texture, { frameWidth: 96, frameHeight: 112 });
}
