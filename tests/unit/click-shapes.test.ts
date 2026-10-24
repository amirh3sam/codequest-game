import { describe, expect, it } from "vitest";
import { containsClickShape, LIGHTING_CLICK_SHAPE, TRANSIT_CLICK_SHAPE } from "../../src/game/click-shapes";

describe("clickable building silhouettes", () => {
  it("accepts the console screen, stand and base but rejects pavement underneath", () => {
    for (const [x, y] of [
      [0, -69],
      [-28, -45],
      [28, -45],
      [0, -16],
      [18, -4],
    ])
      expect(containsClickShape(LIGHTING_CLICK_SHAPE, x, y)).toBe(true);
    for (let y = 5; y <= 100; y += 5)
      for (let x = -50; x <= 50; x += 5) expect(containsClickShape(LIGHTING_CLICK_SHAPE, x, y)).toBe(false);
  });
  it("excludes rounded corners, stand gaps and the console's shadow", () => {
    for (const [x, y] of [
      [-29, -70],
      [-28, -68],
      [29, -70],
      [20, -16],
      [-20, -17],
      [30, -40],
      [25, -4],
      [0, 3],
    ])
      expect(containsClickShape(LIGHTING_CLICK_SHAPE, x, y)).toBe(false);
  });
  it("includes transit roof, doorway and steps without label/shadow corner hotspots", () => {
    for (const [x, y] of [
      [0, -112],
      [-46, -60],
      [46, -60],
      [0, -42],
      [38, 27],
      [0, 33],
    ])
      expect(containsClickShape(TRANSIT_CLICK_SHAPE, x, y)).toBe(true);
    for (const [x, y] of [
      [60, -110],
      [-60, -110],
      [0, -125],
      [60, 27],
      [70, 0],
      [0, 36],
    ])
      expect(containsClickShape(TRANSIT_CLICK_SHAPE, x, y)).toBe(false);
  });
  it("rejects invalid pointer coordinates", () => {
    for (const value of [NaN, Infinity, -Infinity])
      expect(containsClickShape(LIGHTING_CLICK_SHAPE, value, -40)).toBe(false);
  });
});
