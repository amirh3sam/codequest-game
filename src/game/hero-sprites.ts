import type Phaser from "phaser";
import { createWalkAtlas } from "./walk-cycle";

export type Facing = "south" | "west" | "east" | "north";
const ROWS: Record<Facing, number> = { south: 0, west: 1, east: 2, north: 3 };
export function heroFrame(facing: Facing, stride = 0, columns = 4): number {
  return ROWS[facing] * columns + stride;
}

function bands(counts: number[], gap: number): { start: number; end: number }[] {
  const result: { start: number; end: number }[] = [];
  let start = -1,
    last = -1;
  for (const [i, n] of counts.entries()) {
    if (n < 3) continue;
    if (start >= 0 && i - last >= gap) {
      result.push({ start, end: last });
      start = -1;
    }
    if (start < 0) start = i;
    last = i;
  }
  if (start >= 0) result.push({ start, end: last });
  return result;
}

/** Register distinct boy/girl silhouettes, keeping the shoe baseline aligned. */
export function createHeroTextures(scene: Phaser.Scene): void {
  const source = scene.textures.get("hero-source").getSourceImage() as HTMLImageElement;
  const raw = document.createElement("canvas");
  raw.width = source.width;
  raw.height = source.height;
  const ctx = raw.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Hero sprites need a canvas.");
  ctx.drawImage(source, 0, 0);
  const pixels = ctx.getImageData(0, 0, source.width, source.height).data;
  const rowCounts = Array.from({ length: source.height }, () => 0);
  for (let y = 0; y < source.height; y++)
    for (let x = 0; x < source.width; x++)
      if ((pixels[(y * source.width + x) * 4 + 3] ?? 0) > 40) rowCounts[y] = (rowCounts[y] ?? 0) + 1;
  const detected = bands(rowCounts, 8);
  const rows =
    detected.length === 4
      ? detected
      : Array.from({ length: 4 }, (_, i) => ({
          start: Math.floor((i * source.height) / 4),
          end: Math.floor(((i + 1) * source.height) / 4) - 1,
        }));
  const boxes: { x: number; y: number; width: number; height: number; headX: number }[] = [];
  for (const row of rows) {
    const counts = Array.from({ length: source.width }, () => 0);
    for (let y = row.start; y <= row.end; y++)
      for (let x = 0; x < source.width; x++)
        if ((pixels[(y * source.width + x) * 4 + 3] ?? 0) > 40) counts[x] = (counts[x] ?? 0) + 1;
    const groups = bands(counts, 12);
    const columns =
      groups.length === 2
        ? groups
        : [
            { start: 0, end: Math.floor(source.width / 2) - 1 },
            { start: Math.floor(source.width / 2), end: source.width - 1 },
          ];
    for (const column of columns) {
      let left = source.width,
        right = 0,
        top = source.height,
        bottom = 0;
      for (let y = row.start; y <= row.end; y++)
        for (let x = column.start; x <= column.end; x++)
          if ((pixels[(y * source.width + x) * 4 + 3] ?? 0) > 40) {
            left = Math.min(left, x);
            right = Math.max(right, x);
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
      const height = bottom - top + 1;
      let head = 0,
        weight = 0;
      for (let y = top; y < top + height * 0.18; y++)
        for (let x = left; x <= right; x++) {
          const a = pixels[(y * source.width + x) * 4 + 3] ?? 0;
          if (a > 100) {
            head += x * a;
            weight += a;
          }
        }
      boxes.push({
        x: left,
        y: top,
        width: right - left + 1,
        height,
        headX: weight ? head / weight : (left + right) / 2,
      });
    }
  }
  const scale = Math.min(80 / Math.max(...boxes.map((b) => b.width)), 100 / Math.max(...boxes.map((b) => b.height)));
  for (const [column, kind] of ["boy", "girl"].entries()) {
    const atlas = document.createElement("canvas");
    atlas.width = 384;
    atlas.height = 448;
    const draw = atlas.getContext("2d");
    if (!draw) continue;
    draw.imageSmoothingEnabled = false;
    for (let row = 0; row < 4; row++) {
      const box = boxes[row * 2 + column];
      if (!box) continue;
      const width = box.width * scale,
        height = box.height * scale;
      const x = Math.max(3, Math.min(93 - width, 48 - (box.headX - box.x) * scale));
      for (let pose = 0; pose < 4; pose++) {
        draw.save();
        draw.translate(pose * 96, 0);
        if (row === 1 && kind === "girl") {
          draw.translate(96, 0);
          draw.scale(-1, 1);
        }
        draw.drawImage(source, box.x, box.y, box.width, box.height, x, row * 112 + 106 - height, width, height);
        draw.restore();
      }
    }
    const idle = scene.textures.addCanvas(`hero-${kind}`, atlas);
    const frames = { frameWidth: 96, frameHeight: 112 };
    if (idle) scene.textures.addSpriteSheet("", idle, frames);
    const walk = scene.textures.addCanvas(`hero-walk-${kind}`, createWalkAtlas(atlas, "developer"));
    if (walk) scene.textures.addSpriteSheet("", walk, frames);
  }
}
