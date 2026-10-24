import { describe, expect, it } from "vitest";
import { cityGuide, TITLE_GUIDE } from "../../src/content/guided-tour";
import { guidePlacement, readGuideProgress } from "../../src/core/guided-tour";

describe("guided tour", () => {
  it("loads valid progress and safely recovers from blocked/corrupt storage", () => {
    const value = { version: 1, status: "in-progress", index: 12 };
    expect(readGuideProgress({ getItem: () => JSON.stringify(value) })).toEqual(value);
    for (const raw of [
      "{",
      "null",
      '{"version":2}',
      JSON.stringify({ ...value, index: -1 }),
      JSON.stringify({ ...value, status: "bad" }),
      JSON.stringify({ ...value, index: 1.2 }),
    ])
      expect(readGuideProgress({ getItem: () => raw }).status).toBe("new");
    expect(
      readGuideProgress({
        getItem: () => {
          throw new Error("blocked");
        },
      }).status,
    ).toBe("new");
  });
  it("covers all seven real tablet tabs and the required game controls with stable step IDs", () => {
    const steps = cityGuide("Ava");
    expect(new Set(steps.map((step) => step.id)).size).toBe(steps.length);
    expect([...new Set(steps.filter((step) => step.view === "tablet").map((step) => step.tab))].sort()).toEqual([
      0, 1, 2, 3, 4, 5, 6,
    ]);
    expect(steps.find((step) => step.id === "welcome")?.title).toContain("Ava");
    expect(steps.find((step) => step.id === "save")?.text).toContain("hard drive");
    expect(steps.find((step) => step.id === "load")?.text).toContain("separate adventure");
    expect(steps.some((step) => step.view === "character")).toBe(true);
    expect(TITLE_GUIDE.every((step) => step.view === "title")).toBe(true);
  });
  it("places cards beside desktop controls without covering the target", () => {
    const card = { width: 370, height: 400 },
      target = { left: 100, top: 50, width: 100, height: 40 };
    const position = guidePlacement(1440, 900, card, target);
    expect(position.left).toBeGreaterThan(target.left + target.width);
    expect(position.top).toBeGreaterThanOrEqual(12);
    const rightTarget = { ...target, left: 1300 };
    expect(guidePlacement(1440, 900, card, rightTarget).left + card.width).toBeLessThan(rightTarget.left);
  });
  it("keeps phone cards in bounds and docks away from top/bottom controls", () => {
    for (const [width, height] of [
      [390, 844],
      [844, 390],
      [320, 568],
    ]) {
      const card = { width: Math.min(370, width - 24), height: Math.min(420, height - 24) };
      for (const target of [
        undefined,
        { left: 15, top: 15, width: 200, height: 35 },
        { left: 15, top: height - 70, width: 200, height: 35 },
      ]) {
        const point = guidePlacement(width, height, card, target);
        expect(point.left).toBeGreaterThanOrEqual(12);
        expect(point.top).toBeGreaterThanOrEqual(12);
        expect(point.left + card.width).toBeLessThanOrEqual(width - 12);
        expect(point.top + card.height).toBeLessThanOrEqual(height - 12);
      }
    }
    expect(
      guidePlacement(390, 844, { width: 366, height: 420 }, { left: 10, top: 20, width: 200, height: 50 }).top,
    ).toBeGreaterThan(70);
  });
});
