import { expect, it } from "vitest";
import { DEFAULT_DESIGN } from "../../src/core/arcade-creation";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { BEGINNER_STEPS, createBeginnerProgress } from "../../src/core/beginner";
import {
  availableRewards,
  awardRewards,
  canEquipRoom,
  defaultRoom,
  isRoom,
  REWARD_IDS,
} from "../../src/core/developer-room";
import { GATE_STEPS, newLesson } from "../../src/core/journey";
import { createGame, type GameState } from "../../src/core/state";
import { hoodiePixel } from "../../src/game/hoodie-palette";

it("awards each learning milestone, retains earned rewards and validates portable room data", () => {
  const base = createGame("java", { name: "Ada", kind: "girl" }, "2026-10-25T04:00:00Z");
  expect(availableRewards(base)).toEqual([]);
  expect(canEquipRoom({ ...defaultRoom(), hoodie: "amber" }, [])).toBe(false);
  const s: GameState = {
    ...base,
    beginner: { ...createBeginnerProgress(), status: "complete", step: 6, completed: [...BEGINNER_STEPS] },
    journey: {
      gate: { ...newLesson(), status: "complete", step: 4, completed: [...GATE_STEPS] },
      companion: { enabled: true, draft: "", trips: 1 },
      creations: [{ id: "mine", design: DEFAULT_DESIGN, best: 50, won: true }],
      restored: ["workshop", "tram", "network"],
      reviews: { variables: { misses: 1, wins: 3, variant: 0 } },
    },
  };
  const awarded = awardRewards(s);
  expect(awarded.journey?.earned).toHaveLength(10);
  expect(availableRewards(s)).toEqual([...REWARD_IDS]);
  const removed = awardRewards({ ...awarded, journey: { ...awarded.journey, creations: [] } });
  expect(removed.journey?.earned).toContain("robot-rose");
  expect(awardRewards(awarded)).toBe(awarded);
  const room = {
    ...defaultRoom(),
    hoodie: "amber" as const,
    robot: "gold" as const,
    antenna: "double" as const,
    decor: ["plant", "lamp", "trophy"] as ("plant" | "lamp" | "trophy")[],
  };
  expect(canEquipRoom(room, [...REWARD_IDS])).toBe(true);
  const state = { ...removed, journey: { ...removed.journey, room } };
  expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(state))).state.journey).toEqual(state.journey);
  expect(isRoom({ ...room, decor: ["plant", "plant"] })).toBe(false);
  expect(isRoom({ ...room, hoodie: "red" })).toBe(false);
});
it("hoodie recoloring preserves faces, hair, equipment, pants, transparency and directional frame boundaries", () => {
  const tint = hoodiePixel(45, 76, 160, 255, 48, 45, "mint");
  expect(tint).not.toEqual([45, 76, 160, 255]);
  expect(tint[1]).toBeGreaterThan(tint[2]);
  expect(hoodiePixel(45, 76, 160, 255, 48 + 96, 45 + 112, "mint")).toEqual(tint);
  for (const [r, g, b, a, x, y] of [
    [220, 170, 145, 255, 48, 40],
    [45, 30, 20, 255, 48, 40],
    [160, 170, 180, 255, 48, 52],
    [30, 47, 65, 255, 48, 69],
    [45, 76, 160, 255, 48, 88],
    [45, 76, 160, 255, 48, 20],
    [45, 76, 160, 0, 48, 45],
  ])
    expect(hoodiePixel(r, g, b, a, x, y, "amber")).toEqual([r, g, b, a]);
});
