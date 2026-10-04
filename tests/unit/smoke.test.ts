import { describe, expect, it } from "vitest";
import { GEM_REWARD, loseHeart, MAX_HEARTS } from "../../src/core/rules";

describe("smoke: core rules", () => {
  it("starts with 3 hearts and never goes below 0", () => {
    expect(MAX_HEARTS).toBe(3);
    expect(loseHeart(1)).toBe(0);
    expect(loseHeart(0)).toBe(0);
  });

  it("rewards harder tasks with more gems", () => {
    expect(GEM_REWARD).toEqual({ easy: 1, normal: 2, hard: 3 });
  });
});
