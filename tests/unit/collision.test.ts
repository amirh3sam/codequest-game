import { describe, expect, it } from "vitest";
import { type CollisionWorld, canStandAt, moveWithCollisions } from "../../src/game/collision";

const bounds = { left: 0, right: 300, top: 0, bottom: 300 };
const world: CollisionWorld = { bounds, solids: [{ id: "chest", x: 100, y: 100, width: 48, height: 25 }] };

describe("world footprints", () => {
  it("stops at each face of a chest even across a very large movement", () => {
    expect(moveWithCollisions({ x: 50, y: 115 }, 200, 0, world).x).toBeLessThanOrEqual(91);
    expect(moveWithCollisions({ x: 200, y: 115 }, -180, 0, world).x).toBeGreaterThanOrEqual(157);
    expect(moveWithCollisions({ x: 124, y: 60 }, 0, 180, world).y).toBeLessThanOrEqual(98);
    expect(moveWithCollisions({ x: 124, y: 200 }, 0, -180, world).y).toBeGreaterThanOrEqual(133);
  });
  it("lets the warrior walk around a chest and continue past it", () => {
    let p = moveWithCollisions({ x: 50, y: 115 }, 0, 40, world);
    p = moveWithCollisions(p, 150, 0, world);
    p = moveWithCollisions(p, 0, -40, world);
    expect(p.x).toBeCloseTo(200);
    expect(p.y).toBeCloseTo(115);
  });
  it("slides along an obstacle instead of freezing diagonal movement", () => {
    const result = moveWithCollisions({ x: 80, y: 105 }, 40, 15, world);
    expect(result.x).toBeLessThanOrEqual(91);
    expect(result.y).toBeCloseTo(120);
  });
  it("blocks a thin tree trunk without blocking the ground behind its canopy", () => {
    const trees = { bounds, solids: [{ id: "tree", x: 140, y: 140, width: 20, height: 16 }] };
    expect(canStandAt({ x: 150, y: 105 }, trees)).toBe(true);
    expect(moveWithCollisions({ x: 80, y: 150 }, 120, 0, trees).x).toBeLessThanOrEqual(131);
  });
  it("respects the whole foot at the map boundary", () => {
    expect(canStandAt({ x: 5, y: 20 }, { bounds, solids: [] })).toBe(false);
    const result = moveWithCollisions({ x: 20, y: 20 }, -100, -100, { bounds, solids: [] });
    expect(result.x).toBeGreaterThanOrEqual(9);
    expect(result.x).toBeLessThan(20);
    expect(result.y).toBeGreaterThanOrEqual(8);
    expect(result.y).toBeLessThan(20);
  });
  it("uses the pond shoreline rather than blocking the corners of its bounding box", () => {
    const pond = {
      bounds,
      solids: [
        {
          id: "pond",
          points: [
            { x: 150, y: 100 },
            { x: 200, y: 150 },
            { x: 150, y: 200 },
            { x: 100, y: 150 },
          ],
        },
      ],
    };
    expect(canStandAt({ x: 110, y: 110 }, pond)).toBe(true);
    expect(canStandAt({ x: 150, y: 150 }, pond)).toBe(false);
    expect(moveWithCollisions({ x: 60, y: 150 }, 180, 0, pond).x).toBeLessThanOrEqual(100);
  });
});
