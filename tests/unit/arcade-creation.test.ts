import { expect, it } from "vitest";
import {
  DEFAULT_DESIGN,
  isArcadeCreations,
  moveGrid,
  newGridRound,
  reachable,
  readGameDesign,
} from "../../src/core/arcade-creation";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { createGame } from "../../src/core/state";

it("validates bounded data from real program output without executing it", () => {
  expect(readGameDesign(JSON.stringify(DEFAULT_DESIGN))).toEqual(DEFAULT_DESIGN);
  for (const change of [
    { goal: 0 },
    { goal: 13 },
    { speed: 99 },
    { obstacles: 100 },
    { points: -1 },
    { name: "" },
    { playerColor: "red" },
    { theme: "<script>" },
  ])
    expect(readGameDesign(JSON.stringify({ ...DEFAULT_DESIGN, ...change }))).toBeNull();
  expect(readGameDesign("console.log(1)")).toBeNull();
  expect(isArcadeCreations([{ id: "mine", design: DEFAULT_DESIGN, best: 50, won: true }])).toBe(true);
  expect(isArcadeCreations(Array(9).fill({ id: "mine", design: DEFAULT_DESIGN, best: 0, won: false }))).toBe(false);
  const state = {
    ...createGame("java", { name: "Ada", kind: "girl" }, "2026-10-24T20:00:00Z"),
    journey: { creations: [{ id: "mine", design: DEFAULT_DESIGN, best: 50, won: true }] },
  };
  expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(state))).state.journey?.creations).toEqual(
    state.journey.creations,
  );
});
it("all supported goals have reachable gems even at the maximum wall count", () => {
  for (let goal = 3; goal <= 12; goal++) {
    const r = newGridRound({ ...DEFAULT_DESIGN, goal, obstacles: 12 });
    expect(r.walls).toHaveLength(12);
    expect(r.items).toHaveLength(goal);
    expect(r.items.every((n) => reachable(r.walls).includes(n))).toBe(true);
    expect(moveGrid(r, -1, 0)).toBe(r);
    expect(moveGrid(r, 0, -1)).toBe(r);
  }
});
it("walls block movement and collecting the last gem wins once", () => {
  const r = { player: 0, walls: [12], items: [1], collected: 0, won: false };
  expect(moveGrid(r, 0, 1)).toBe(r);
  const won = moveGrid(r, 1, 0);
  expect(won.won).toBe(true);
  expect(won.collected).toBe(1);
  expect(moveGrid(won, 1, 0)).toBe(won);
});
