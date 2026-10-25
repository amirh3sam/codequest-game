import type Phaser from "phaser";
import type { RoomState } from "../core/developer-room";
export const HOODIE_COLORS = { mint: [94, 226, 180], amber: [233, 179, 110], violet: [189, 149, 245] } as const;
/** Restrict recoloring to saturated blue/violet fabric in the torso band of each frame. */
export function hoodiePixel(
  r: number,
  g: number,
  b: number,
  a: number,
  x: number,
  y: number,
  color: Exclude<RoomState["hoodie"], "default">,
): readonly number[] {
  const px = x % 96,
    py = y % 112;
  if (
    a < 40 ||
    px < 18 ||
    px > 78 ||
    py < 32 ||
    py > 73 ||
    b <= 70 ||
    b <= r * 1.08 ||
    b < g * 0.95 ||
    b - Math.min(r, g) < 30
  )
    return [r, g, b, a];
  const brightness = Math.max(r, g, b) / 255;
  return [...HOODIE_COLORS[color].map((c) => Math.round(c * brightness)), a];
}
export function hoodieTexture(scene: Phaser.Scene, base: string, color: RoomState["hoodie"] = "default"): string {
  if (color === "default") return base;
  const key = `${base}-hoodie-${color}`;
  if (scene.textures.exists(key)) return key;
  const source = scene.textures.get(base).getSourceImage() as HTMLCanvasElement;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return base;
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < canvas.height; y++)
    for (let x = 0; x < canvas.width; x++) {
      const i = (y * canvas.width + x) * 4;
      const next = hoodiePixel(pixels.data[i], pixels.data[i + 1], pixels.data[i + 2], pixels.data[i + 3], x, y, color);
      for (let c = 0; c < 4; c++) pixels.data[i + c] = next[c];
    }
  ctx.putImageData(pixels, 0, 0);
  const texture = scene.textures.addCanvas(key, canvas);
  if (texture) scene.textures.addSpriteSheet("", texture, { frameWidth: 96, frameHeight: 112 });
  return key;
}
