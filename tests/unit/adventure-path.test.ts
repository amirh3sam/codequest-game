import { expect, it } from "vitest";
import { adventurePath, isAdventurePath } from "../../src/core/adventure-path";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { BEGINNER_STEPS, createBeginnerProgress } from "../../src/core/beginner";
import { defaultRoom } from "../../src/core/developer-room";
import { GATE_STEPS, newLesson } from "../../src/core/journey";
import { createGame, type GameState } from "../../src/core/state";

it("recommends one verified next step, preserves prior achievements and never skips a missing foundation", () => {
  const base = createGame("java", { name: "Ada", kind: "girl" }, "2026-10-25T12:00:00Z");
  expect(adventurePath(base).next?.id).toBe("basics");
  expect(adventurePath({ ...base, journey: { earned: ["robot-rose"] } }).next?.id).toBe("basics");
  let s: GameState = {
    ...base,
    journey: { path: { version: 1, mode: "guided" } },
    beginner: { ...createBeginnerProgress(), status: "complete", step: 6, completed: [...BEGINNER_STEPS] },
  };
  expect(adventurePath(s).next?.id).toBe("mission");
  s = { ...s, areas: { ...s.areas, variables: { ...s.areas.variables, solved: ["variables-1"] } } };
  expect(adventurePath(s).next?.id).toBe("gate");
  s = {
    ...s,
    journey: { ...s.journey, gate: { ...newLesson(), status: "complete", step: 4, completed: [...GATE_STEPS] } },
  };
  expect(adventurePath(s).next?.id).toBe("robot");
  s = { ...s, journey: { ...s.journey, companion: { enabled: true, trips: 1, draft: "" } } };
  expect(adventurePath(s).next?.id).toBe("game");
  s = { ...s, journey: { ...s.journey, earned: ["robot-rose"] } };
  expect(adventurePath(s).next?.id).toBe("city");
  s = { ...s, journey: { ...s.journey, restored: ["workshop", "tram", "network"] } };
  expect(adventurePath(s).next?.id).toBe("review");
  s = { ...s, journey: { ...s.journey, reviews: { variables: { misses: 0, wins: 3, variant: 0 } } } };
  expect(adventurePath(s).next?.id).toBe("room");
  s = { ...s, journey: { ...s.journey, room: defaultRoom() } };
  expect(adventurePath(s).next).toBeNull();
  expect(adventurePath(s).completed).toBe(8);
  expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(s))).state.journey?.path).toEqual({
    version: 1,
    mode: "guided",
  });
  expect(isAdventurePath({ version: 2, mode: "guided" })).toBe(false);
  expect(isAdventurePath({ version: 1, mode: "invented" })).toBe(false);
});
