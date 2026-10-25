import { describe, expect, it } from "vitest";
import { loadArea } from "../../src/content/loader";
import {
  deleteAdventure,
  deleteAllGameData,
  freshGuidedAdventure,
  renameAdventure,
  restartAdventure,
} from "../../src/core/adventure-management";
import { ADVENTURES_KEY, loadAdventures, saveAdventure } from "../../src/core/adventures";
import { saveGame, saveKey } from "../../src/core/save";
import { createGame, solveTask } from "../../src/core/state";

class MemoryStorage {
  data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
}
const at = "2026-10-24T12:00:00.000Z";
const later = "2026-10-24T13:00:00.000Z";
it("starts a new-player guided copy without removing the original adventure, projects or other characters", () => {
  const { storage, state, other } = setup();
  if (!state.adventureId) throw new Error("Fixture adventure ID missing");
  storage.setItem(`codequest:project-workspace:v1:${state.adventureId}:arcade-builder`, "keep my classes");
  const result = freshGuidedAdventure(state.adventureId, "fresh-guided", later, storage);
  expect(result.status).toBe("saved");
  if (result.status !== "saved" || !result.state) throw new Error("Fresh adventure missing");
  expect(result.state.hero).toEqual(state.hero);
  expect(result.state.areas).toEqual(createGame(state.lang, state.hero, later).areas);
  expect(result.state.journey?.path).toEqual({ version: 1, mode: "guided" });
  const library = loadAdventures(storage);
  if (library.status !== "loaded") throw new Error("Unreadable library");
  expect(library.adventures).toHaveLength(3);
  expect(library.adventures.find((s) => s.adventureId === state.adventureId)).toEqual(state);
  expect(library.adventures.find((s) => s.adventureId === other.adventureId)).toEqual(other);
  expect(storage.getItem(`codequest:project-workspace:v1:${state.adventureId}:arcade-builder`)).toBe("keep my classes");
  expect(freshGuidedAdventure(state.adventureId, state.adventureId, later, storage).status).toBe("invalid");
  expect(freshGuidedAdventure(state.adventureId, other.adventureId, later, storage).status).toBe("invalid");
});
function setup() {
  const storage = new MemoryStorage();
  const base = { ...createGame("javascript", { name: "Ada", kind: "girl" }, at), adventureId: "hero-1" };
  const state = {
    ...solveTask(base, loadArea(base.lang, "variables"), "variables-1", at),
    games: { packetDashBest: 77 },
    training: { districts: ["variables" as const] },
  };
  saveAdventure(state, storage);
  saveGame(state, storage);
  const other = { ...createGame("java", { name: "Noah", kind: "boy" }, at), adventureId: "hero-10" };
  saveAdventure(other, storage);
  return { storage, state, other };
}
function read(storage: MemoryStorage) {
  const library = loadAdventures(storage);
  if (library.status !== "loaded") throw new Error("Unreadable library");
  return library.adventures;
}

describe("character management", () => {
  it("renames only the selected character, preserving identity, progress and coding data", () => {
    const { storage, state, other } = setup();
    storage.setItem("codequest:workspace:v1:hero-1", "project");
    const result = renameAdventure("hero-1", "  Alex  ", later, storage);
    expect(result.status).toBe("saved");
    expect(read(storage).find((entry) => entry.adventureId === "hero-1")).toEqual({
      ...state,
      hero: { ...state.hero, name: "Alex" },
      updatedAt: later,
    });
    expect(read(storage).find((entry) => entry.adventureId === "hero-10")).toEqual(other);
    expect(storage.getItem("codequest:workspace:v1:hero-1")).toBe("project");
  });
  it("keeps a rename newer than a compatibility snapshot dated in the future", () => {
    const { storage, state } = setup();
    saveGame({ ...state, updatedAt: "2030-01-01T00:00:00.000Z" }, storage);
    expect(renameAdventure("hero-1", "Nova", later, storage).status).toBe("saved");
    expect(read(storage).find((entry) => entry.adventureId === "hero-1")?.hero.name).toBe("Nova");
  });
  it("rejects invalid names and failed writes without changing existing data", () => {
    const { storage } = setup(),
      before = new Map(storage.data);
    for (const name of [" ", "<script>", "abcdefghijklmnopq"])
      expect(renameAdventure("hero-1", name, later, storage).status).toBe("invalid");
    storage.setItem = () => {
      throw new Error("quota");
    };
    expect(renameAdventure("hero-1", "Nova", later, storage).status).toBe("storage-error");
    expect(restartAdventure("hero-1", "fresh-id", later, storage).status).toBe("storage-error");
    expect(deleteAdventure("hero-1", storage).status).toBe("storage-error");
    expect(storage.data).toEqual(before);
  });
  it("restarts all districts with a new identity and clears that character's browser work", () => {
    const { storage, state, other } = setup();
    const owned = [
      "codequest:workspace:v1:hero-1",
      "codequest:tablet:v2:hero-1",
      "codequest:project-workspace:v1:hero-1:badge-builder",
      "codequest:project-progress:v1:hero-1:badge-builder",
      "codequest:daily:v1:hero-1:2026-10-24",
      "codequest:daily-draft:v1:hero-1:2026-10-24",
      "codequest:study-progress:v2:hero-1",
      "codequest:study-progress:v1:hero-1",
      "codequest:study-bosses:v1:hero-1",
      "codequest:study-draft:v2:hero-1:javascript:variables:0",
      "codequest:onboarding:v1:hero-1",
    ];
    for (const key of owned) storage.setItem(key, "old work");
    storage.setItem("codequest:workspace:v1:hero-10", "keep other work");
    const result = restartAdventure("hero-1", "fresh-id", later, storage);
    expect(result).toEqual({
      status: "saved",
      cleanupComplete: true,
      state: { ...createGame(state.lang, state.hero, later), adventureId: "fresh-id", training: { districts: [] } },
    });
    expect(
      read(storage)
        .map((entry) => entry.adventureId)
        .sort(),
    ).toEqual(["fresh-id", "hero-10"]);
    expect(read(storage).find((entry) => entry.adventureId === "hero-10")).toEqual(other);
    for (const key of owned) expect(storage.getItem(key)).toBeNull();
    expect(storage.getItem("codequest:workspace:v1:hero-10")).toBe("keep other work");
    expect(storage.getItem(saveKey(state.lang))).toBeNull();
  });
  it("deletes one character and blocks resurrection from stale sessions or legacy slots", () => {
    const { storage, state, other } = setup();
    expect(deleteAdventure("hero-1", storage)).toEqual({ status: "saved", cleanupComplete: true });
    expect(read(storage)).toEqual([other]);
    saveGame({ ...state, updatedAt: "2030-01-01T00:00:00.000Z" }, storage);
    expect(read(storage)).toEqual([other]);
    expect(saveAdventure(state, storage).status).toBe("invalid");
    saveAdventure({ ...other, updatedAt: later }, storage);
    expect(read(storage)).toHaveLength(1);
  });
  it("also deletes a pre-library character and its legacy coding draft", () => {
    const storage = new MemoryStorage();
    saveGame(createGame("python", { name: "Legacy", kind: "boy" }, at), storage);
    storage.setItem("codequest:tablet:v1:python", "print('old')");
    storage.setItem("codequest:workspace:v1:guest-python", "old files");
    expect(deleteAdventure("legacy-python", storage)).toEqual({ status: "saved", cleanupComplete: true });
    expect(read(storage)).toEqual([]);
    expect(storage.getItem("codequest:tablet:v1:python")).toBeNull();
    expect(storage.getItem("codequest:workspace:v1:guest-python")).toBeNull();
  });
  it("reports incomplete cleanup without resurrecting the deleted adventure", () => {
    const { storage, other } = setup();
    storage.setItem("codequest:workspace:v1:hero-1", "old work");
    storage.removeItem = () => {
      throw new Error("denied");
    };
    expect(deleteAdventure("hero-1", storage)).toEqual({ status: "saved", cleanupComplete: false });
    expect(read(storage)).toEqual([other]);
  });
  it("rejects missing targets and restart identity collisions without touching saves", () => {
    const { storage } = setup(),
      before = new Map(storage.data);
    expect(deleteAdventure("missing", storage).status).toBe("invalid");
    for (const id of ["hero-1", "hero-10", "../../bad"])
      expect(restartAdventure("hero-1", id, later, storage).status).toBe("invalid");
    expect(storage.data).toEqual(before);
  });
  it("erases all CodeQuest profile data, including corrupt saves, while preserving unrelated keys", () => {
    const { storage } = setup();
    storage.setItem(ADVENTURES_KEY, "{");
    storage.setItem("codequest:training:v1", "preferences");
    storage.setItem("codequest:workspace:v1:orphan", "project");
    storage.setItem("other-app", "keep");
    expect(deleteAllGameData(storage)).toBe(true);
    expect(storage.data).toEqual(new Map([["other-app", "keep"]]));
  });
  it("does not report success when profile erasure fails", () => {
    const { storage } = setup();
    storage.removeItem = () => {
      throw new Error("denied");
    };
    expect(deleteAllGameData(storage)).toBe(false);
    expect(read(storage)).toHaveLength(2);
  });
});
