type Point = { x: number; y: number };
export type ClickPart =
  | { x: number; y: number; width: number; height: number; radius?: number }
  | { points: readonly Point[] };

/** Local art geometry only: shadows, glow, labels and surrounding pavement are excluded. */
export function containsClickShape(parts: readonly ClickPart[], x: number, y: number): boolean {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  return parts.some((part) => {
    if ("points" in part) {
      let hit = false;
      for (let i = 0, j = part.points.length - 1; i < part.points.length; j = i++) {
        const a = part.points[i],
          b = part.points[j];
        if (!a || !b) continue;
        const cross = (x - a.x) * (b.y - a.y) - (y - a.y) * (b.x - a.x);
        if (
          Math.abs(cross) < 0.0001 &&
          x >= Math.min(a.x, b.x) &&
          x <= Math.max(a.x, b.x) &&
          y >= Math.min(a.y, b.y) &&
          y <= Math.max(a.y, b.y)
        )
          return true;
        if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) hit = !hit;
      }
      return hit;
    }
    if (x < part.x || x > part.x + part.width || y < part.y || y > part.y + part.height) return false;
    const radius = part.radius ?? 0;
    if (!radius) return true;
    const cx = Math.max(part.x + radius, Math.min(part.x + part.width - radius, x));
    const cy = Math.max(part.y + radius, Math.min(part.y + part.height - radius, y));
    return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
  });
}
export const LIGHTING_CLICK_SHAPE: readonly ClickPart[] = [
  { x: -29, y: -70, width: 58, height: 52, radius: 6 },
  { x: -4, y: -31, width: 8, height: 21 },
  { x: -23, y: -15, width: 46, height: 15, radius: 4 },
];
export const TRANSIT_CLICK_SHAPE: readonly ClickPart[] = [
  {
    points: [
      { x: -43, y: -113 },
      { x: 43, y: -113 },
      { x: 59, y: -99 },
      { x: 44, y: -88 },
      { x: -44, y: -88 },
      { x: -59, y: -99 },
    ],
  },
  { x: -58, y: -99, width: 24, height: 108, radius: 7 },
  { x: 34, y: -99, width: 24, height: 108, radius: 7 },
  { x: -33, y: -88, width: 66, height: 94, radius: 24 },
  {
    points: [
      { x: -62, y: -4 },
      { x: 0, y: -21 },
      { x: 62, y: -4 },
      { x: 62, y: 17 },
      { x: 0, y: 34 },
      { x: -62, y: 17 },
    ],
  },
  { x: -32, y: 17, width: 64, height: 7, radius: 2 },
  { x: -39, y: 24, width: 78, height: 7, radius: 2 },
];
