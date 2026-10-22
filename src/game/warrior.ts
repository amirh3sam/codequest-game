import type Phaser from "phaser";
import { createWalkAtlas } from "./walk-cycle";

export const WARRIOR_FRAME = { width: 96, height: 112, columns: 4, rows: 4 } as const;
export type Facing = "south" | "west" | "east" | "north";
const ROWS: Record<Facing, number> = { south: 0, west: 1, east: 2, north: 3 };

function occupiedBands(counts: number[], minimumGap: number): { start: number; end: number }[] {
  const bands: { start: number; end: number }[] = [];
  let start = -1,
    last = -1;
  for (const [index, count] of counts.entries()) {
    if (count < 3) continue;
    if (start >= 0 && index - last >= minimumGap) {
      bands.push({ start, end: last });
      start = -1;
    }
    if (start < 0) start = index;
    last = index;
  }
  if (start >= 0) bands.push({ start, end: last });
  return bands;
}

export function warriorFrame(facing: Facing, stride = 0, columns = 4): number {
  return ROWS[facing] * columns + stride;
}

/** Align generated poses at the boots so the feet stay planted between frames. */
function createWarriorAtlas(
  scene: Phaser.Scene,
  sourceKey: string,
  columnCount: number,
  prefix: string,
): HTMLCanvasElement {
  const source = scene.textures.get(sourceKey).getSourceImage() as HTMLImageElement;
  const cellWidth = Math.floor(source.width / columnCount);
  const cellHeight = Math.floor(source.height / WARRIOR_FRAME.rows);
  const scratch = document.createElement("canvas");
  scratch.width = source.width;
  scratch.height = source.height;
  const context = scratch.getContext("2d", { willReadFrequently: true });
  if (!context) throw new Error("The warrior atlas needs a canvas context.");
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, source.width, source.height).data;
  const rowCounts = Array.from({ length: source.height }, () => 0);
  for (let y = 0; y < source.height; y++)
    for (let x = 0; x < source.width; x++)
      if ((pixels[(y * source.width + x) * 4 + 3] ?? 0) >= 40) rowCounts[y] = (rowCounts[y] ?? 0) + 1;
  // The painted sheet has natural gutters rather than perfectly uniform cells.
  const detectedRows = occupiedBands(rowCounts, 8);
  const rows =
    detectedRows.length === 4
      ? detectedRows
      : Array.from({ length: 4 }, (_, row) => ({ start: row * cellHeight, end: (row + 1) * cellHeight - 1 }));
  const bounds: { x: number; y: number; width: number; height: number }[] = [];
  for (const band of rows) {
    const columnCounts = Array.from({ length: source.width }, () => 0);
    for (let y = band.start; y <= band.end; y++)
      for (let x = 0; x < source.width; x++)
        if ((pixels[(y * source.width + x) * 4 + 3] ?? 0) >= 40) columnCounts[x] = (columnCounts[x] ?? 0) + 1;
    const detectedColumns = occupiedBands(columnCounts, 12);
    const columns =
      detectedColumns.length === columnCount
        ? detectedColumns
        : Array.from({ length: columnCount }, (_, col) => ({ start: col * cellWidth, end: (col + 1) * cellWidth - 1 }));
    for (const column of columns) {
      let left = source.width,
        top = source.height,
        right = 0,
        bottom = 0;
      for (let y = band.start; y <= band.end; y++) {
        for (let x = column.start; x <= column.end; x++) {
          const alpha = pixels[(y * source.width + x) * 4 + 3] ?? 0;
          if (alpha < 40) continue;
          left = Math.min(left, x);
          top = Math.min(top, y);
          right = Math.max(right, x);
          bottom = Math.max(bottom, y);
        }
      }
      bounds.push({
        x: left,
        y: top,
        width: Math.max(1, right - left + 1),
        height: Math.max(1, bottom - top + 1),
      });
    }
  }
  const scale = Math.min(82 / Math.max(...bounds.map((b) => b.width)), 100 / Math.max(...bounds.map((b) => b.height)));
  const atlas = document.createElement("canvas");
  atlas.width = WARRIOR_FRAME.width * columnCount;
  atlas.height = WARRIOR_FRAME.height * WARRIOR_FRAME.rows;
  const draw = atlas.getContext("2d");
  if (!draw) throw new Error("The warrior atlas needs a canvas context.");
  draw.imageSmoothingEnabled = false;
  for (const [index, box] of bounds.entries()) {
    const width = box.width * scale,
      height = box.height * scale;
    let headX = 0,
      headWeight = 0;
    for (let y = Math.floor(box.y + box.height * 0.12); y < box.y + box.height * 0.27; y++)
      for (let x = box.x; x < box.x + box.width; x++) {
        const i = (y * source.width + x) * 4;
        const r = pixels[i] ?? 0,
          g = pixels[i + 1] ?? 0,
          b = pixels[i + 2] ?? 0,
          a = pixels[i + 3] ?? 0;
        if (a > 100 && g > r * 0.75 && b > r * 0.75 && g > 45) {
          headX += x * a;
          headWeight += a;
        }
      }
    const anchor = headWeight ? headX / headWeight : box.x + box.width / 2;
    const start = (index % columnCount) * WARRIOR_FRAME.width;
    const alignedX = Math.max(
      start + 3,
      Math.min(start + WARRIOR_FRAME.width - width - 3, start + WARRIOR_FRAME.width / 2 - (anchor - box.x) * scale),
    );
    draw.drawImage(
      source,
      box.x,
      box.y,
      box.width,
      box.height,
      alignedX,
      Math.floor(index / columnCount) * WARRIOR_FRAME.height + 106 - height,
      width,
      height,
    );
  }
  registerCostumes(scene, atlas, prefix);
  return atlas;
}

function registerCostumes(scene: Phaser.Scene, atlas: HTMLCanvasElement, prefix: string): void {
  const crimson = scene.textures.addCanvas(`${prefix}crimson`, atlas);
  const frames = { frameWidth: WARRIOR_FRAME.width, frameHeight: WARRIOR_FRAME.height };
  if (crimson) scene.textures.addSpriteSheet("", crimson, frames);
  const alternate = document.createElement("canvas");
  alternate.width = atlas.width;
  alternate.height = atlas.height;
  const alternateContext = alternate.getContext("2d");
  if (!alternateContext) throw new Error("The warrior atlas needs a canvas context.");
  alternateContext.drawImage(atlas, 0, 0);
  const variant = alternateContext.getImageData(0, 0, atlas.width, atlas.height);
  // Only the crimson cloth changes; steel, gold, boots and skin keep their color.
  for (let i = 0; i < variant.data.length; i += 4) {
    const r = variant.data[i] ?? 0,
      g = variant.data[i + 1] ?? 0,
      b = variant.data[i + 2] ?? 0;
    if (r > g * 1.5 && r > b * 1.4) {
      variant.data[i] = Math.round(r * 0.75);
      variant.data[i + 1] = Math.round(r * 0.42);
      variant.data[i + 2] = Math.round(r * 0.94);
    }
  }
  alternateContext.putImageData(variant, 0, 0);
  const amethyst = scene.textures.addCanvas(`${prefix}amethyst`, alternate);
  if (amethyst) scene.textures.addSpriteSheet("", amethyst, frames);
}

export function createWarriorTextures(scene: Phaser.Scene): void {
  const idle = createWarriorAtlas(scene, "warrior-source", 4, "warrior-");
  registerCostumes(scene, createWalkAtlas(idle), "warrior-walk-");
}
