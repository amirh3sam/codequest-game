import type Phaser from "phaser";
export type EnvironmentKind = "fir" | "oak" | "rock" | "fence";
const KINDS: EnvironmentKind[] = ["fir", "oak", "rock", "fence"];
export const OBJECT_SIZE = {
  fir: { width: 110, height: 158 },
  oak: { width: 144, height: 150 },
  rock: { width: 56, height: 42 },
  fence: { width: 126, height: 40 },
};
/** Atlas gutters are irregular; each region preserves all disconnected leaves. */
export function createEnvironmentFrames(scene: Phaser.Scene): void {
  const source = scene.textures.get("environment-source").getSourceImage() as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("City objects need a canvas.");
  ctx.drawImage(source, 0, 0);
  const data = ctx.getImageData(0, 0, source.width, source.height).data;
  const cuts = [0, 0.3, 0.6, 0.74, 1];
  for (const [index, kind] of KINDS.entries()) {
    const start = Math.round((cuts[index] ?? 0) * source.width),
      end = Math.round((cuts[index + 1] ?? 1) * source.width);
    let left = end,
      right = start,
      top = source.height,
      bottom = 0;
    for (let y = 0; y < source.height; y++)
      for (let x = start; x < end; x++)
        if ((data[(y * source.width + x) * 4 + 3] ?? 0) > 40) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
    const image = document.createElement("canvas");
    image.width = right - left + 1;
    image.height = bottom - top + 1;
    image.getContext("2d")?.drawImage(source, left, top, image.width, image.height, 0, 0, image.width, image.height);
    scene.textures.addCanvas(`environment-${kind}`, image);
  }
}
