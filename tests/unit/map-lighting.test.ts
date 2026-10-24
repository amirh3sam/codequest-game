import { describe, expect, it } from "vitest";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import {
  DEFAULT_LIGHTS,
  isDistrictLights,
  parseLightOutput,
  resolveLights,
  setDistrictLights,
} from "../../src/core/map-lighting";
import { isGameState } from "../../src/core/save";
import { createGame, resetArea } from "../../src/core/state";

describe("programmed map lighting", () => {
  it("accepts power, color, or both from program output and rejects ambiguous commands", () => {
    expect(parseLightOutput("OFFLINE\nGREEN\n", DEFAULT_LIGHTS)).toEqual({ power: "offline", color: "green" });
    expect(parseLightOutput("red", DEFAULT_LIGHTS)).toEqual({ power: "online", color: "red" });
    expect(parseLightOutput("offline", DEFAULT_LIGHTS)).toEqual({ power: "offline", color: "blue" });
    for (const value of ["", "online offline", "green red", "orange", "online green extra"])
      expect(() => parseLightOutput(value, DEFAULT_LIGHTS)).toThrow();
    for (const color of ["green", "red", "white", "yellow", "blue", "purple"])
      expect(parseLightOutput(color, DEFAULT_LIGHTS).color).toBe(color);
  });
  it("keeps per-circuit settings in each map and lets whole-district commands replace overrides", () => {
    let state = createGame("javascript", { kind: "boy", name: "Nova" }, "2026-10-24T01:00:00Z");
    state = setDistrictLights(state, "all", { power: "offline", color: "yellow" }, state.updatedAt);
    state = setDistrictLights(state, "terminal-3", { power: "online", color: "green" }, state.updatedAt);
    expect(resolveLights(state.areas.variables.lighting, "terminal-3")).toEqual({ power: "online", color: "green" });
    expect(resolveLights(state.areas.variables.lighting, "terminal-2")).toEqual({ power: "offline", color: "yellow" });
    expect(resolveLights(state.areas.conditions.lighting, "terminal-3")).toEqual(DEFAULT_LIGHTS);
    expect(isGameState(state)).toBe(true);
    expect(resetArea(state, state.updatedAt).areas.variables.lighting).toEqual(state.areas.variables.lighting);
    expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(state))).state).toEqual(state);
    state = setDistrictLights(state, "all", { power: "online", color: "white" }, state.updatedAt);
    expect(Object.keys(state.areas.variables.lighting ?? {})).toEqual(["all"]);
    expect(resolveLights(state.areas.variables.lighting, "terminal-3")).toEqual({ power: "online", color: "white" });
  });
  it("rejects corrupt lighting settings before loading a save", () => {
    expect(isDistrictLights({ all: { power: "online", color: "green" } })).toBe(true);
    expect(isDistrictLights({ all: { power: "on", color: "green" } })).toBe(false);
    expect(isDistrictLights({ "terminal-9": DEFAULT_LIGHTS })).toBe(false);
    expect(isDistrictLights({ all: { power: "online", color: "constructor" } })).toBe(false);
  });
});
