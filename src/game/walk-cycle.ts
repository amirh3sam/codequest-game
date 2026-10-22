import { createDeveloperWalkAtlas } from "./developer-walk";

type Point = { x: number; y: number };
type Crop = { x: number; y: number; width: number; height: number };
const WIDTH = 96,
  HEIGHT = 112,
  STEPS = 6;

function crop(source: HTMLCanvasElement, row: number, region: Crop): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = region.width;
  canvas.height = region.height;
  canvas
    .getContext("2d")
    ?.drawImage(
      source,
      region.x,
      row * HEIGHT + region.y,
      region.width,
      region.height,
      0,
      0,
      region.width,
      region.height,
    );
  return canvas;
}

function segment(ctx: CanvasRenderingContext2D, image: HTMLCanvasElement, from: Point, to: Point): void {
  ctx.save();
  ctx.translate(from.x, from.y);
  ctx.rotate(Math.atan2(to.y - from.y, to.x - from.x) - Math.PI / 2);
  ctx.drawImage(image, -image.width / 2, -1, image.width, Math.hypot(to.x - from.x, to.y - from.y) + 2);
  ctx.restore();
}

function knee(hip: Point, ankle: Point, upper: number, lower: number, bend: number): Point {
  const dx = ankle.x - hip.x,
    dy = ankle.y - hip.y;
  const distance = Math.min(Math.hypot(dx, dy), upper + lower - 0.1);
  const along = (upper * upper - lower * lower + distance * distance) / (2 * distance);
  const across = Math.sqrt(Math.max(0, upper * upper - along * along)) * bend;
  return {
    x: hip.x + (along * dx) / distance - (across * dy) / distance,
    y: hip.y + (along * dy) / distance + (across * dx) / distance,
  };
}

/** Two separately jointed legs: alternating planted/swing phases, no mirrored boots. */
export function createWalkAtlas(
  source: HTMLCanvasElement,
  costume: "knight" | "developer" = "knight",
): HTMLCanvasElement {
  if (costume === "developer") return createDeveloperWalkAtlas(source);
  const atlas = document.createElement("canvas");
  atlas.width = WIDTH * STEPS;
  atlas.height = HEIGHT * 4;
  const out = atlas.getContext("2d");
  if (!out) throw new Error("Walking animation needs a canvas.");
  out.imageSmoothingEnabled = false;
  for (let row = 0; row < 4; row++) {
    const side = row === 1 || row === 2;
    const torso = crop(source, row, { x: 0, y: 0, width: WIDTH, height: HEIGHT });
    const body = torso.getContext("2d");
    if (!body) continue;
    const pixels = body.getImageData(0, 0, WIDTH, HEIGHT);
    for (let y = side ? 68 : row === 3 ? 75 : 58; y < HEIGHT; y++)
      for (
        let x = side ? (y >= 94 ? 32 : row === 1 ? 44 : 40) : 38;
        x < (side ? (y >= 94 ? 71 : row === 1 ? 60 : 57) : 63);
        x++
      ) {
        const i = (y * WIDTH + x) * 4,
          r = pixels.data[i] ?? 0,
          g = pixels.data[i + 1] ?? 0,
          b = pixels.data[i + 2] ?? 0;
        if (y < 88 && r > g * 1.7 && r > b * 1.4) continue; // Keep the cape with the torso.
        pixels.data[i + 3] = 0;
      }
    body.putImageData(pixels, 0, 0);
    const legs = [0, 1].map((index) => {
      const x = side ? (row === 1 ? 45 : 43) : row === 3 ? 42 + index * 11 : 38 + index * 12;
      const y = side ? 68 : row === 3 ? 75 : 58;
      const upper = side ? 14 : row === 3 ? 9 : 21,
        lower = side ? 16 : row === 3 ? 13 : 17;
      return {
        x: side ? 48 + index * 4 : x + 5.5,
        y,
        upper: crop(source, row, { x, y, width: 11, height: upper }),
        lower: crop(source, row, { x: x + 1, y: y + upper - 1, width: 10, height: lower + 1 }),
        boot: crop(source, row, { x: side ? (row === 1 ? 39 : 46) : 50, y: 96, width: side ? 18 : 11, height: 11 }),
      };
    });
    for (let frame = 0; frame < STEPS; frame++) {
      const phase = (frame / STEPS) * Math.PI * 2,
        bob = Math.cos(phase * 2) * 0.6;
      out.save();
      out.translate(frame * WIDTH, row * HEIGHT);
      for (const index of side ? [0, 1] : [1, 0]) {
        const leg = legs[index];
        if (!leg) continue;
        const angle = phase + index * Math.PI;
        const hip = { x: leg.x, y: leg.y + bob };
        const ankle = {
          x: leg.x + (side ? Math.sin(angle) * 12 : Math.sin(angle) * 0.65),
          y: 96 - (side ? Math.max(0, Math.cos(angle)) * 6 : Math.sin(angle) * 3 + Math.max(0, Math.cos(angle)) * 2),
        };
        const joint = side
          ? knee(hip, ankle, 16, 18, row === 1 ? 1 : -1)
          : { x: hip.x, y: hip.y + (ankle.y - hip.y) * 0.55 };
        segment(out, leg.upper, hip, joint);
        segment(out, leg.lower, joint, ankle);
        out.drawImage(leg.boot, ankle.x - leg.boot.width / 2, ankle.y - 1);
      }
      out.drawImage(torso, 0, bob);
      out.restore();
    }
  }
  return atlas;
}
