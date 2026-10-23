import { afterEach, describe, expect, it, vi } from "vitest";
import { isGameState, loadGame, type SaveStorage, saveGame, saveKey } from "../../src/core/save";
import {
  type AreaDefinition,
  applySubmissionFailure,
  buyNextHint,
  createGame,
  defeatBoss,
  discoverLesson,
  enterArea,
  type GameState,
  solveTask,
} from "../../src/core/state";
import type { Lang } from "../../src/runners/types";

const AT = "2026-10-21T18:00:00.000Z";
const LANGUAGES = ["java", "javascript", "typescript", "python"] as const;

class MemoryStorage implements SaveStorage {
  data = new Map<string, string>();
  writes = 0;
  readError?: Error;
  writeError?: Error;

  getItem(key: string): string | null {
    if (this.readError) throw this.readError;
    return this.data.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.writeError) throw this.writeError;
    this.data.set(key, value);
    this.writes++;
  }
}

function newGame(lang: Lang = "javascript"): GameState {
  return createGame(lang, { kind: "girl", name: "Ada" }, AT);
}

function progressedGame(lang: Lang = "javascript"): GameState {
  const area: AreaDefinition = {
    id: "variables",
    tasks: Array.from({ length: 8 }, (_, index) => ({ id: `variables-${index + 1}`, difficulty: "normal" })),
    boss: { hints: [{ cost: 1 }, { cost: 2 }, { cost: 3 }] },
  };
  let state = discoverLesson(newGame(lang), AT);
  for (const task of area.tasks) state = solveTask(state, area, task.id, AT);
  state = buyNextHint(state, area, AT);
  state = enterArea(defeatBoss(state, area, AT), "conditions", AT);
  state = discoverLesson(applySubmissionFailure(state, "conditions", "wrong-output", AT).state, AT);
  return {
    ...state,
    position: { x: 64, y: 96 },
    areas: {
      ...state.areas,
      conditions: { ...state.areas.conditions, drafts: { "conditions-1": "if (true) {\n  console.log('<tag>');\n}" } },
    },
  };
}

function changedArea(state: GameState, patch: Record<string, unknown>, id = "variables"): unknown {
  return { ...state, areas: { ...state.areas, [id]: { ...state.areas.variables, ...patch } } };
}

afterEach(() => vi.unstubAllGlobals());

describe("language save slots", () => {
  it.each(LANGUAGES)("round-trips a progressed %s game with its hero, position, drafts and other areas", (lang) => {
    const storage = new MemoryStorage();
    const state = progressedGame(lang);
    expect(saveGame(state, storage)).toEqual({ status: "saved" });
    expect(storage.data.has(`codequest:v1:${lang}`)).toBe(true);
    const loaded = loadGame(lang, storage);
    expect(loaded).toEqual({ status: "loaded", state });
    if (loaded.status !== "loaded") throw new Error("Expected a loaded game.");
    expect(loaded.state).not.toBe(state);
    expect(loaded.state.areas.conditions).not.toBe(state.areas.conditions);
    expect(loaded.state.areas.variables.bossDefeated).toBe(true);
    expect(loaded.state.areas.variables.hintsBought).toBe(1);
    expect(loaded.state.areas.conditions.hearts).toBe(2);
    expect(loaded.state.areas.conditions.lessonsFound).toBe(true);
  });

  it("updates only the selected language and leaves unrelated storage untouched", () => {
    const storage = new MemoryStorage();
    storage.data.set("other-app:key", "keep me");
    for (const lang of LANGUAGES) expect(saveGame(newGame(lang), storage).status).toBe("saved");
    expect(saveGame(progressedGame("python"), storage).status).toBe("saved");
    for (const lang of LANGUAGES) {
      expect(loadGame(lang, storage)).toEqual({
        status: "loaded",
        state: lang === "python" ? progressedGame(lang) : newGame(lang),
      });
    }
    expect(storage.data.get("other-app:key")).toBe("keep me");
    expect(storage.data.size).toBe(5);
  });

  it("returns empty for an absent slot and does not create or remove anything", () => {
    const storage = new MemoryStorage();
    saveGame(newGame("java"), storage);
    const writes = storage.writes;
    expect(loadGame("python", storage)).toEqual({ status: "empty" });
    expect(storage.writes).toBe(writes);
    expect(storage.data.size).toBe(1);
  });

  it("uses browser localStorage by default and accepts an omitted optional position", () => {
    const storage = new MemoryStorage();
    vi.stubGlobal("localStorage", storage);
    expect(saveGame({ ...newGame(), position: undefined })).toEqual({ status: "saved" });
    expect(loadGame("javascript")).toEqual({ status: "loaded", state: newGame() });
  });

  it("persists a Packet Dash record inside its own adventure", () => {
    const storage = new MemoryStorage();
    const state = { ...newGame(), games: { packetDashBest: 1234 } };
    expect(saveGame(state, storage)).toEqual({ status: "saved" });
    expect(loadGame("javascript", storage)).toEqual({ status: "loaded", state });
  });

  it("does not treat a different language's otherwise valid save as the requested slot", () => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify(newGame("python"));
    storage.data.set(saveKey("java"), raw);
    expect(loadGame("java", storage)).toEqual({ status: "corrupt" });
    expect(storage.data.get(saveKey("java"))).toBe(raw);
    expect(storage.writes).toBe(0);
  });
});

describe("version and corruption handling", () => {
  it.each([0, 2, 99])("reports unsupported version %i and preserves its bytes", (version) => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify({ ...newGame(), version });
    storage.data.set(saveKey("javascript"), raw);
    expect(loadGame("javascript", storage)).toEqual({ status: "unsupported-version", version });
    expect(storage.data.get(saveKey("javascript"))).toBe(raw);
    expect(storage.writes).toBe(0);
  });

  it.each(["", "{", "undefined", "null", "[]", "42", '"save"'])("handles invalid JSON or shape %j", (raw) => {
    const storage = new MemoryStorage();
    storage.data.set(saveKey("javascript"), raw);
    expect(loadGame("javascript", storage)).toEqual({ status: "corrupt" });
    expect(storage.data.get(saveKey("javascript"))).toBe(raw);
    expect(storage.writes).toBe(0);
  });

  const corruptCases: [string, (state: GameState) => unknown][] = [
    ["missing state fields", () => ({ version: 1 })],
    ["a string version", (state) => ({ ...state, version: "1" })],
    ["an unsupported language", (state) => ({ ...state, lang: "ruby" })],
    ["an unknown current area", (state) => ({ ...state, currentArea: "unknown" })],
    ["a locked current area", (state) => ({ ...state, currentArea: "conditions" })],
    ["an invalid timestamp", (state) => ({ ...state, updatedAt: "not a date" })],
    ["an invalid hero kind", (state) => ({ ...state, hero: { ...state.hero, kind: "wizard" } })],
    ["a blank hero name", (state) => ({ ...state, hero: { ...state.hero, name: "   " } })],
    ["a long hero name", (state) => ({ ...state, hero: { ...state.hero, name: "a".repeat(17) } })],
    ["punctuation in a hero name", (state) => ({ ...state, hero: { ...state.hero, name: "<Ada>" } })],
    ["missing areas", (state) => ({ ...state, areas: {} })],
    ["an unknown area entry", (state) => ({ ...state, areas: { ...state.areas, unknown: state.areas.variables } })],
    [
      "too many solved tasks",
      (state) => changedArea(state, { solved: Array.from({ length: 9 }, (_, index) => `task-${index}`) }),
    ],
    ["duplicate solved tasks", (state) => changedArea(state, { solved: ["task-1", "task-1"] })],
    ["non-string task IDs", (state) => changedArea(state, { solved: [1] })],
    ["empty task IDs", (state) => changedArea(state, { solved: [""] })],
    ["zero hearts after an atomic reset", (state) => changedArea(state, { hearts: 0 })],
    ["too many hearts", (state) => changedArea(state, { hearts: 4 })],
    ["fractional hearts", (state) => changedArea(state, { hearts: 1.5 })],
    ["negative gems", (state) => changedArea(state, { gems: -1 })],
    ["unearned gems", (state) => changedArea(state, { gems: 1 })],
    ["fractional gems", (state) => changedArea(state, { solved: ["task-1"], gems: 0.5 })],
    ["purchased hints before the boss gate", (state) => changedArea(state, { solved: ["task-1"], hintsBought: 1 })],
    ["negative hint purchases", (state) => changedArea(state, { hintsBought: -1 })],
    ["a premature boss victory", (state) => changedArea(state, { bossDefeated: true })],
    ["non-boolean lesson discovery", (state) => changedArea(state, { lessonsFound: "yes" })],
    ["non-boolean boss completion", (state) => changedArea(state, { bossDefeated: "yes" })],
    ["an array as drafts", (state) => changedArea(state, { drafts: [] })],
    ["non-string draft code", (state) => changedArea(state, { drafts: { "task-1": 42 } })],
    ["an empty draft ID", (state) => changedArea(state, { drafts: { "": "code" } })],
    ["null position", (state) => ({ ...state, position: null })],
    ["non-finite coordinates", (state) => ({ ...state, position: { x: Number.POSITIVE_INFINITY, y: 0 } })],
    ["a missing coordinate", (state) => ({ ...state, position: { x: 0 } })],
    ["a negative arcade record", (state) => ({ ...state, games: { packetDashBest: -1 } })],
    ["a fractional arcade record", (state) => ({ ...state, games: { packetDashBest: 4.5 } })],
    ["an oversized arcade record", (state) => ({ ...state, games: { packetDashBest: 1_000_001 } })],
    ["progress in a locked area", (state) => changedArea(state, { lessonsFound: true }, "conditions")],
  ];

  it.each(corruptCases)("rejects %s without overwriting the slot", (_label, change) => {
    const storage = new MemoryStorage();
    const raw = JSON.stringify(change(newGame()));
    storage.data.set(saveKey("javascript"), raw);
    expect(loadGame("javascript", storage)).toEqual({ status: "corrupt" });
    expect(storage.data.get(saveKey("javascript"))).toBe(raw);
    expect(storage.writes).toBe(0);
  });

  it("allows letters and digits from other alphabets in valid hero names", () => {
    const state = { ...newGame(), hero: { kind: "girl" as const, name: "آدا 2" } };
    expect(isGameState(state)).toBe(true);
    const storage = new MemoryStorage();
    expect(saveGame(state, storage).status).toBe("saved");
    expect(loadGame("javascript", storage)).toEqual({ status: "loaded", state });
  });

  it("rejects an impossible hint/gem total even after all eight tasks", () => {
    const state = progressedGame();
    const impossible = { ...state, areas: { ...state.areas, variables: { ...state.areas.variables, gems: 24 } } };
    expect(isGameState(impossible)).toBe(false);
  });
});

describe("safe writes and storage failures", () => {
  it("refuses invalid states without replacing a valid save", () => {
    const storage = new MemoryStorage();
    saveGame(newGame(), storage);
    const previous = storage.data.get(saveKey("javascript"));
    const bad = { ...newGame(), areas: { ...newGame().areas, variables: { ...newGame().areas.variables, gems: -1 } } };
    expect(saveGame(bad, storage)).toEqual({ status: "invalid" });
    expect(storage.data.get(saveKey("javascript"))).toBe(previous);
    expect(storage.writes).toBe(1);
  });

  it("handles serialization failure without modifying storage", () => {
    const storage = new MemoryStorage();
    const cyclic = { ...newGame(), extra: {} };
    cyclic.extra = cyclic;
    expect(saveGame(cyclic, storage)).toEqual({ status: "invalid" });
    expect(storage.writes).toBe(0);
  });

  it("rejects custom toJSON output that would produce a corrupt or wrong-language save", () => {
    const storage = new MemoryStorage();
    for (const output of [null, newGame("python")]) {
      const state = { ...newGame(), toJSON: () => output };
      expect(saveGame(state, storage)).toEqual({ status: "invalid" });
    }
    expect(storage.writes).toBe(0);
  });

  it("reports a full quota and preserves the last successful save", () => {
    const storage = new MemoryStorage();
    saveGame(newGame(), storage);
    const previous = storage.data.get(saveKey("javascript"));
    storage.writeError = new DOMException("Storage is full.", "QuotaExceededError");
    expect(saveGame(progressedGame(), storage)).toEqual({ status: "storage-error", reason: "quota" });
    expect(storage.data.get(saveKey("javascript"))).toBe(previous);
    expect(loadGame("javascript", storage)).toEqual({ status: "loaded", state: newGame() });
  });

  it("reports denied reads and writes without throwing or pretending that the slot is empty", () => {
    const storage = new MemoryStorage();
    storage.readError = new DOMException("Denied.", "SecurityError");
    storage.writeError = new DOMException("Denied.", "SecurityError");
    expect(loadGame("java", storage)).toEqual({ status: "storage-error", reason: "unavailable" });
    expect(saveGame(newGame("java"), storage)).toEqual({ status: "storage-error", reason: "unavailable" });
  });

  it("catches failures when accessing localStorage itself", () => {
    vi.stubGlobal("localStorage", undefined);
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      get() {
        throw new DOMException("Denied.", "SecurityError");
      },
    });
    expect(loadGame("java")).toEqual({ status: "storage-error", reason: "unavailable" });
    expect(saveGame(newGame("java"))).toEqual({ status: "storage-error", reason: "unavailable" });
  });

  it("works without browser globals when storage is injected, and fails safely when none is available", () => {
    vi.stubGlobal("localStorage", undefined);
    expect(loadGame("java")).toEqual({ status: "storage-error", reason: "unavailable" });
    expect(saveGame(newGame("java"))).toEqual({ status: "storage-error", reason: "unavailable" });
    const storage = new MemoryStorage();
    expect(saveGame(newGame("java"), storage).status).toBe("saved");
    expect(loadGame("java", storage)).toEqual({ status: "loaded", state: newGame("java") });
  });
});
