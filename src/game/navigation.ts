import type { Position } from "../core/state";
import { type CollisionWorld, canStandAt, FOOTPRINT } from "./collision";

const CELL = 8;
const distance = (a: Position, b: Position) => Math.hypot(b.x - a.x, b.y - a.y);

export type WalkingRoute = { points: Position[]; destination: Position; adjusted: boolean };

/** Test the whole foot along a segment, so smoothing cannot cut a fence or pond corner. */
export function clearWalkingSegment(from: Position, to: Position, world: CollisionWorld): boolean {
  const steps = Math.max(1, Math.ceil(distance(from, to) / 2));
  for (let n = 0; n <= steps; n++) {
    const t = n / steps;
    if (!canStandAt({ x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t }, world)) return false;
  }
  return true;
}

class Frontier {
  private items: { id: number; score: number }[] = [];
  get length() {
    return this.items.length;
  }
  push(id: number, score: number): void {
    const item = { id, score };
    let index = this.items.length;
    this.items.push(item);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      const previous = this.items[parent];
      if (!previous || previous.score <= score) break;
      this.items[index] = previous;
      index = parent;
    }
    this.items[index] = item;
  }
  pop(): number {
    const first = this.items[0];
    const last = this.items.pop();
    if (!first) return -1;
    if (!this.items.length || !last) return first.id;
    let index = 0;
    while (index * 2 + 1 < this.items.length) {
      let child = index * 2 + 1;
      const right = this.items[child + 1],
        left = this.items[child];
      if (right && left && right.score < left.score) child++;
      const next = this.items[child];
      if (!next || next.score >= last.score) break;
      this.items[index] = next;
      index = child;
    }
    this.items[index] = last;
    return first.id;
  }
}

/** A* uses the same collision geometry as walking, including trees, gates and polygon shorelines. */
export function findWalkingRoute(from: Position, requested: Position, world: CollisionWorld): WalkingRoute | null {
  if (![from.x, from.y, requested.x, requested.y].every(Number.isFinite) || !canStandAt(from, world)) return null;
  const minX = world.bounds.left + FOOTPRINT.halfWidth,
    maxX = world.bounds.right - FOOTPRINT.halfWidth,
    minY = world.bounds.top + FOOTPRINT.back,
    maxY = world.bounds.bottom - FOOTPRINT.front;
  const target = { x: Math.max(minX, Math.min(maxX, requested.x)), y: Math.max(minY, Math.min(maxY, requested.y)) };
  if (clearWalkingSegment(from, target, world))
    return { points: [target], destination: target, adjusted: distance(target, requested) > 0.1 };
  const columns = Math.ceil((maxX - minX) / CELL) + 1,
    rows = Math.ceil((maxY - minY) / CELL) + 1,
    count = columns * rows;
  const point = (id: number): Position => ({
    x: Math.min(maxX, minX + (id % columns) * CELL),
    y: Math.min(maxY, minY + Math.floor(id / columns) * CELL),
  });
  const occupancy = new Int8Array(count);
  const walkable = (id: number) => {
    if (!occupancy[id]) occupancy[id] = canStandAt(point(id), world) ? 1 : -1;
    return occupancy[id] === 1;
  };
  const exact = canStandAt(target, world);
  let goal = target;
  if (!exact) {
    let nearest = Number.POSITIVE_INFINITY;
    for (let id = 0; id < count; id++) {
      const candidate = point(id),
        gap = distance(candidate, target);
      if (gap < nearest && walkable(id)) {
        nearest = gap;
        goal = candidate;
      }
    }
  }
  const cost = new Float64Array(count).fill(Number.POSITIVE_INFINITY),
    parent = new Int32Array(count).fill(-1),
    closed = new Uint8Array(count),
    queue = new Frontier();
  // Multiple visible start connectors avoid snapping the player into a wall or onto a different island.
  const startColumn = Math.round((from.x - minX) / CELL),
    startRow = Math.round((from.y - minY) / CELL);
  for (let row = Math.max(0, startRow - 2); row <= Math.min(rows - 1, startRow + 2); row++)
    for (let column = Math.max(0, startColumn - 2); column <= Math.min(columns - 1, startColumn + 2); column++) {
      const id = row * columns + column,
        position = point(id);
      if (!walkable(id) || !clearWalkingSegment(from, position, world)) continue;
      cost[id] = distance(from, position);
      queue.push(id, cost[id] + distance(position, goal));
    }
  if (!queue.length) return null;
  let best = -1,
    closest = Number.POSITIVE_INFINITY,
    reached = false;
  while (queue.length) {
    const current = queue.pop();
    if (current < 0 || closed[current]) continue;
    closed[current] = 1;
    const position = point(current),
      remaining = distance(position, target);
    if (remaining < closest) {
      closest = remaining;
      best = current;
    }
    if (distance(position, goal) <= CELL * 2 && clearWalkingSegment(position, goal, world)) {
      best = current;
      reached = true;
      break;
    }
    const column = current % columns,
      row = Math.floor(current / columns);
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if ((!dx && !dy) || column + dx < 0 || column + dx >= columns || row + dy < 0 || row + dy >= rows) continue;
        const next = (row + dy) * columns + column + dx;
        if (closed[next] || !walkable(next)) continue;
        // No diagonal squeezing between two blocked corners.
        if (dx && dy && (!walkable(row * columns + column + dx) || !walkable((row + dy) * columns + column))) continue;
        const destination = point(next),
          nextCost = cost[current] + distance(position, destination);
        if (nextCost >= cost[next] || !clearWalkingSegment(position, destination, world)) continue;
        cost[next] = nextCost;
        parent[next] = current;
        queue.push(next, nextCost + distance(destination, goal));
      }
  }
  if (best < 0) return null;
  if (!reached && distance(from, target) <= closest) return { points: [], destination: { ...from }, adjusted: true };
  const raw: Position[] = [];
  for (let node = best; node >= 0; node = parent[node] ?? -1) raw.push(point(node));
  raw.reverse();
  if (reached) raw.push(goal);
  // Keep only the furthest collision-clear corners, giving natural straight segments.
  const points: Position[] = [];
  let previous = from,
    index = 0;
  while (index < raw.length) {
    let next = raw.length - 1;
    while (next > index && !clearWalkingSegment(previous, raw[next] as Position, world)) next--;
    const waypoint = raw[next];
    if (!waypoint || !clearWalkingSegment(previous, waypoint, world)) return null;
    if (distance(previous, waypoint) > 0.01) points.push(waypoint);
    previous = waypoint;
    index = next + 1;
  }
  const destination = points.at(-1) ?? { ...from };
  return { points, destination, adjusted: !exact || !reached || distance(destination, requested) > 0.1 };
}
