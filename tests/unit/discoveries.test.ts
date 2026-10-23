import { describe, expect, it } from "vitest";
import { loadVariables } from "../../src/content/loader";
import { type BeaconChoice, canLightBeacon, lightBeacon } from "../../src/core/discoveries";
import { isGameState, loadGame, saveGame } from "../../src/core/save";
import { createGame, type GameState, resetArea, solveTask } from "../../src/core/state";
import { BEACON_POSITION, BEACON_SOLID } from "../../src/game/beacon-layout";
import { canStandAt, moveWithCollisions } from "../../src/game/collision";
import { courierSolids } from "../../src/game/drone-layout";
import type { Lang } from "../../src/runners/types";

const time = "2026-10-22T20:00:00.000Z";
function ready(lang: Lang = "javascript"): GameState {
  const area = loadVariables(lang);
  return solveTask(
    solveTask(createGame(lang, { kind: "girl", name: "Nova" }, time), area, "variables-1", time),
    area,
    "variables-2",
    time,
  );
}

describe("optional community discovery", () => {
  it("keeps old saves valid and requires a repaired drone for a new discovery", () => {
    const initial = createGame("javascript", { kind: "boy", name: "Ari" }, time);
    expect(isGameState(initial)).toBe(true);
    expect(canLightBeacon(initial)).toBe(false);
    expect(lightBeacon(initial, "garden", time)).toBe(initial);
    expect(canLightBeacon(ready())).toBe(true);
  });
  it("changes only the choice and timestamp, including repeats and invalid choices", () => {
    const state = ready(),
      next = lightBeacon(state, "garden", "2026-10-22T20:01:00.000Z");
    expect(next.areas).toBe(state.areas);
    expect(state.discoveries).toBeUndefined();
    expect(next.discoveries?.beacon).toBe("garden");
    expect(lightBeacon(next, "garden", time)).toBe(next);
    expect(lightBeacon(next, "arcade", time).areas).toBe(state.areas);
    expect(lightBeacon(next, "unknown" as BeaconChoice, time)).toBe(next);
    expect(lightBeacon({ ...next, currentArea: "conditions" }, "arcade", time).discoveries?.beacon).toBe("garden");
  });
  it("keeps the cosmetic on district retry, while a new adventure starts without it", () => {
    const reset = resetArea(lightBeacon(ready(), "arcade", time), time);
    expect(reset.areas.variables.solved).toEqual([]);
    expect(reset.discoveries?.beacon).toBe("arcade");
    expect(canLightBeacon(reset)).toBe(true);
    expect(isGameState(reset)).toBe(true);
    expect(createGame(reset.lang, reset.hero, time).discoveries).toBeUndefined();
  });
  it("rejects malformed discovery data before overwriting a valid save", () => {
    let stored = "original";
    const storage = {
      getItem: () => stored,
      setItem: (_key: string, value: string) => {
        stored = value;
      },
    };
    for (const discoveries of [null, [], "garden", { beacon: "bad" }, { beacon: 1 }, { beacon: null }]) {
      const malformed = { ...ready(), discoveries };
      expect(isGameState(malformed)).toBe(false);
      expect(saveGame(malformed as GameState, storage).status).toBe("invalid");
      expect(stored).toBe("original");
    }
  });
  it("round-trips both choices in independent language save slots", () => {
    const slots = new Map<string, string>(),
      storage = {
        getItem: (key: string) => slots.get(key) ?? null,
        setItem: (key: string, value: string) => {
          slots.set(key, value);
        },
      };
    for (const lang of ["javascript", "typescript", "python", "java"] as const) {
      for (const choice of ["garden", "arcade"] as const) {
        const state = lightBeacon(ready(lang), choice, time);
        expect(saveGame(state, storage).status).toBe("saved");
        expect(loadGame(lang, storage)).toEqual({ status: "loaded", state });
      }
    }
    saveGame(lightBeacon(ready("python"), "garden", time), storage);
    expect(loadGame("javascript", storage)).toMatchObject({ state: { discoveries: { beacon: "arcade" } } });
    expect(loadGame("python", storage)).toMatchObject({ state: { discoveries: { beacon: "garden" } } });
  });
  it("blocks the beacon base without blocking the courier lane or the path beside it", () => {
    const world = {
      bounds: { left: 77, right: 1459, top: 179, bottom: 691 },
      solids: [...courierSolids(true), BEACON_SOLID],
    };
    expect(canStandAt(BEACON_POSITION, world)).toBe(false);
    expect(moveWithCollisions({ x: 866, y: 240 }, 0, 70, world).y).toBeLessThanOrEqual(276);
    expect(moveWithCollisions({ x: 768, y: 370 }, 0, -150, world).y).toBe(220);
    expect(moveWithCollisions({ x: 906, y: 260 }, 0, 70, world).y).toBeCloseTo(330);
  });
});
