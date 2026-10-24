import { describe, expect, it } from "vitest";
import type { Position } from "../../src/core/state";
import { type CollisionWorld, canStandAt, moveWithCollisions } from "../../src/game/collision";
import { clearWalkingSegment, findWalkingRoute } from "../../src/game/navigation";

const bounds = { left: 0, right: 300, top: 0, bottom: 300 };
const obstacle: CollisionWorld = { bounds, solids: [{ id: "building", x: 125, y: 65, width: 50, height: 170 }] };

/** Follow the route with the game's actual small-step collision physics. */
function follow(from: Position, points: Position[], world: CollisionWorld): Position {
  let position = { ...from };
  for (const target of points) {
    for (let tick = 0; tick < 2000; tick++) {
      const dx = target.x - position.x,
        dy = target.y - position.y;
      const remaining = Math.hypot(dx, dy);
      if (remaining < 0.01) break;
      const step = Math.min(2, remaining);
      const next = moveWithCollisions(position, (dx / remaining) * step, (dy / remaining) * step, world);
      expect(canStandAt(next, world)).toBe(true);
      expect(Math.hypot(next.x - position.x, next.y - position.y)).toBeGreaterThan(0.001);
      position = next;
    }
    expect(Math.hypot(position.x - target.x, position.y - target.y)).toBeLessThan(0.1);
  }
  return position;
}

describe("click navigation", () => {
  it("reaches the exact diagonal click instead of snapping to an axis", () => {
    const world = { bounds, solids: [] };
    const from = { x: 30, y: 30 },
      target = { x: 252.4, y: 178.6 };
    const route = findWalkingRoute(from, target, world);
    expect(route?.adjusted).toBe(false);
    expect(route?.destination).toEqual(target);
    expect(follow(from, route?.points ?? [], world)).toEqual(target);
  });
  it("walks around a building with collision-clear corners", () => {
    const from = { x: 40, y: 150 },
      target = { x: 260, y: 150 };
    const route = findWalkingRoute(from, target, obstacle);
    expect(route?.adjusted).toBe(false);
    expect(route?.points.length).toBeGreaterThan(1);
    expect(follow(from, route?.points ?? [], obstacle)).toEqual(target);
  });
  it("finds the entrance to a concave courtyard instead of getting caught on its wall", () => {
    const world = {
      bounds,
      solids: [
        { id: "left", x: 100, y: 100, width: 10, height: 100 },
        { id: "right", x: 200, y: 100, width: 10, height: 100 },
        { id: "bottom", x: 100, y: 190, width: 110, height: 10 },
      ],
    };
    const from = { x: 50, y: 150 },
      target = { x: 150, y: 150 };
    const route = findWalkingRoute(from, target, world);
    expect(route?.adjusted).toBe(false);
    expect(follow(from, route?.points ?? [], world)).toEqual(target);
  });
  it("routes around a polygon shoreline and respects the player's whole foot", () => {
    const world = {
      bounds,
      solids: [
        {
          id: "pond",
          points: [
            { x: 150, y: 75 },
            { x: 225, y: 150 },
            { x: 150, y: 225 },
            { x: 75, y: 150 },
          ],
        },
      ],
    };
    const from = { x: 35, y: 150 },
      target = { x: 265, y: 150 };
    const route = findWalkingRoute(from, target, world);
    expect(route?.adjusted).toBe(false);
    expect(follow(from, route?.points ?? [], world)).toEqual(target);
  });
  it("chooses a safe nearby destination when the click is inside a building", () => {
    const from = { x: 40, y: 150 },
      target = { x: 150, y: 150 };
    const route = findWalkingRoute(from, target, obstacle);
    expect(route?.adjusted).toBe(true);
    expect(canStandAt(route?.destination ?? target, obstacle)).toBe(true);
    expect(Math.hypot((route?.destination.x ?? 0) - target.x, (route?.destination.y ?? 0) - target.y)).toBeLessThan(45);
    follow(from, route?.points ?? [], obstacle);
  });
  it("does not cross a sealed wall to reach a disconnected destination", () => {
    const world = { bounds, solids: [{ id: "wall", x: 140, y: 0, width: 15, height: 300 }] };
    const from = { x: 40, y: 150 },
      target = { x: 250, y: 150 };
    const route = findWalkingRoute(from, target, world);
    expect(route?.adjusted).toBe(true);
    expect(route?.destination.x).toBeLessThanOrEqual(131);
    follow(from, route?.points ?? [], world);
  });
  it("cannot squeeze diagonally between two touching wall corners", () => {
    const world = {
      bounds,
      solids: [
        { id: "upper", x: 50, y: 0, width: 30, height: 50 },
        { id: "left", x: 0, y: 50, width: 50, height: 30 },
      ],
    };
    const from = { x: 30, y: 30 },
      target = { x: 120, y: 120 };
    const route = findWalkingRoute(from, target, world);
    expect(route?.adjusted).toBe(true);
    follow(from, route?.points ?? [], world);
  });
  it("clamps an off-map click to a standable edge", () => {
    const world = { bounds, solids: [] };
    const route = findWalkingRoute({ x: 30, y: 30 }, { x: 999, y: -50 }, world);
    expect(route?.adjusted).toBe(true);
    expect(route?.destination).toEqual({ x: 291, y: 8 });
  });
  it("detects thin obstacles along otherwise clear line endpoints", () => {
    const world = { bounds, solids: [{ id: "post", x: 149, y: 149, width: 2, height: 2 }] };
    expect(clearWalkingSegment({ x: 30, y: 150 }, { x: 270, y: 150 }, world)).toBe(false);
  });
  it("rejects invalid coordinates and invalid starting positions", () => {
    expect(findWalkingRoute({ x: 5, y: 5 }, { x: 50, y: 50 }, obstacle)).toBeNull();
    expect(findWalkingRoute({ x: 30, y: 30 }, { x: Number.NaN, y: 50 }, obstacle)).toBeNull();
  });
});
