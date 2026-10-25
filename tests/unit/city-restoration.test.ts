import { expect, it } from "vitest";
import { DEFAULT_DESIGN } from "../../src/core/arcade-creation";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { restoreService, serviceRequirement } from "../../src/core/city-restoration";
import { GATE_STEPS, newLesson } from "../../src/core/journey";
import { isGameState } from "../../src/core/save";
import { createGame, type GameState } from "../../src/core/state";

it("restoration needs earned achievements and preserves district progress in portable saves", () => {
  let s: GameState = createGame("java", { name: "Ada", kind: "girl" }, "2026-10-24T20:00:00Z");
  const areas = s.areas;
  for (const id of ["workshop", "tram", "network"] as const) expect(restoreService(s, id)).toBeNull();
  s = {
    ...s,
    journey: {
      gate: { ...newLesson(), status: "complete", step: 4, completed: [...GATE_STEPS] },
      companion: { enabled: true, draft: "", trips: 1 },
    },
  };
  expect(serviceRequirement(s, "workshop")).toBeNull();
  s = { ...s, journey: { ...s.journey, restored: restoreService(s, "workshop") ?? [] } };
  expect(restoreService(s, "workshop")).toBeNull();
  s = { ...s, journey: { ...s.journey, restored: restoreService(s, "tram") ?? [] } };
  expect(restoreService(s, "network")).toBeNull();
  s = { ...s, journey: { ...s.journey, creations: [{ id: "mine", design: DEFAULT_DESIGN, best: 50, won: true }] } };
  s = { ...s, journey: { ...s.journey, restored: restoreService(s, "network") ?? [] } };
  expect(s.journey?.restored).toEqual(["workshop", "tram", "network"]);
  expect(s.areas).toBe(areas);
  expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(s))).state.journey).toEqual(s.journey);
  expect(isGameState({ ...s, journey: { restored: ["tram", "tram"] } })).toBe(false);
  expect(isGameState({ ...s, journey: { restored: ["unknown"] } })).toBe(false);
});
