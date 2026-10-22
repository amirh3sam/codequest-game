import type { Position } from "../core/state";

export type Bounds = { left: number; right: number; top: number; bottom: number };
export type Solid = { id: string } & (
  | { x: number; y: number; width: number; height: number }
  | { points: readonly Position[] }
);
export type CollisionWorld = { bounds: Bounds; solids: readonly Solid[] };
export const FOOTPRINT = { halfWidth: 9, back: 8, front: 2 };

function inside(point: Position, polygon: readonly Position[]): boolean {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i],
      b = polygon[j];
    if (a && b && a.y > point.y !== b.y > point.y && point.x < ((b.x - a.x) * (point.y - a.y)) / (b.y - a.y) + a.x)
      hit = !hit;
  }
  return hit;
}

function intersects(position: Position, solid: Solid): boolean {
  const left = position.x - FOOTPRINT.halfWidth,
    right = position.x + FOOTPRINT.halfWidth;
  const top = position.y - FOOTPRINT.back,
    bottom = position.y + FOOTPRINT.front;
  if (!("points" in solid))
    return right > solid.x && left < solid.x + solid.width && bottom > solid.y && top < solid.y + solid.height;
  const points = solid.points;
  if (
    [{ x: left, y: top }, { x: right, y: top }, { x: right, y: bottom }, { x: left, y: bottom }, position].some((p) =>
      inside(p, points),
    )
  )
    return true;
  if (points.some((p) => p.x >= left && p.x <= right && p.y >= top && p.y <= bottom)) return true;
  // A thin shoreline edge can cross the footprint without containing a corner.
  for (let i = 0; i < points.length; i++) {
    const a = points[i],
      b = points[(i + 1) % points.length];
    if (!a || !b) continue;
    for (const x of [left, right]) {
      const t = (x - a.x) / (b.x - a.x);
      const y = a.y + t * (b.y - a.y);
      if (t >= 0 && t <= 1 && y >= top && y <= bottom) return true;
    }
    for (const y of [top, bottom]) {
      const t = (y - a.y) / (b.y - a.y);
      const x = a.x + t * (b.x - a.x);
      if (t >= 0 && t <= 1 && x >= left && x <= right) return true;
    }
  }
  return false;
}

export function canStandAt(position: Position, world: CollisionWorld): boolean {
  const b = world.bounds;
  return (
    position.x - FOOTPRINT.halfWidth >= b.left &&
    position.x + FOOTPRINT.halfWidth <= b.right &&
    position.y - FOOTPRINT.back >= b.top &&
    position.y + FOOTPRINT.front <= b.bottom &&
    !world.solids.some((solid) => intersects(position, solid))
  );
}

/** Small swept steps prevent crossing thin trunks or fences during a slow frame. */
export function moveWithCollisions(position: Position, dx: number, dy: number, world: CollisionWorld): Position {
  const next = { ...position };
  const steps = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / 3));
  for (let i = 0; i < steps; i++) {
    const x = next.x + dx / steps,
      y = next.y + dy / steps;
    if (canStandAt({ x, y: next.y }, world)) next.x = x;
    if (canStandAt({ x: next.x, y }, world)) next.y = y;
  }
  return next;
}
