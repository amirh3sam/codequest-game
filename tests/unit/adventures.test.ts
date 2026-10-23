import { describe, expect, it } from "vitest";
import { ADVENTURES_KEY, loadAdventures, saveAdventure } from "../../src/core/adventures";
import { saveGame, saveKey } from "../../src/core/save";
import { createGame, type GameState } from "../../src/core/state";
import type { Lang } from "../../src/runners/types";

class MemoryStorage {
  data = new Map<string, string>();
  getItem(key: string) {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string) {
    this.data.set(key, value);
  }
}
const time = "2026-10-23T12:00:00Z";
const adventure = (id: string, lang: Lang = "javascript"): GameState => ({
  ...createGame(lang, { kind: "girl", name: id }, time),
  adventureId: id,
});

describe("adventure library", () => {
  it("keeps multiple same-language and different-language adventures when one is updated", () => {
    const storage = new MemoryStorage();
    for (const state of [adventure("Nova", "java"), adventure("Ada"), adventure("Ari")])
      expect(saveAdventure(state, storage).status).toBe("saved");
    const changed = { ...adventure("Ada"), position: { x: 310, y: 622 }, updatedAt: "2026-10-23T13:00:00Z" };
    expect(saveAdventure(changed, storage).status).toBe("saved");
    const library = loadAdventures(storage);
    expect(library.status).toBe("loaded");
    if (library.status !== "loaded") throw new Error("Missing library");
    expect(library.adventures.map((entry) => entry.adventureId).sort()).toEqual(["Ada", "Ari", "Nova"]);
    expect(library.adventures[0]).toEqual(changed);
    expect(library.adventures.find((entry) => entry.adventureId === "Nova")).toEqual(adventure("Nova", "java"));
  });
  it("imports all old language slots without changing or deleting them, then preserves them on a new start", () => {
    const storage = new MemoryStorage();
    for (const lang of ["java", "javascript", "python", "typescript"] as const)
      saveGame(createGame(lang, { kind: "boy", name: "Legacy" }, time), storage);
    const original = new Map(storage.data);
    const library = loadAdventures(storage);
    expect(library.status === "loaded" && library.adventures.length).toBe(4);
    expect(storage.data).toEqual(original);
    expect(saveAdventure(adventure("New"), storage).status).toBe("saved");
    const after = loadAdventures(storage);
    expect(after.status === "loaded" && after.adventures.length).toBe(5);
    for (const [key, value] of original) expect(storage.getItem(key)).toBe(value);
  });
  it("does not duplicate a mirrored adventure or allow its language to change", () => {
    const storage = new MemoryStorage(),
      state = adventure("Nova");
    saveAdventure(state, storage);
    saveGame(state, storage);
    const before = storage.getItem(ADVENTURES_KEY);
    expect(saveAdventure({ ...state, lang: "java" }, storage).status).toBe("invalid");
    expect(storage.getItem(ADVENTURES_KEY)).toBe(before);
    const library = loadAdventures(storage);
    expect(library.status === "loaded" && library.adventures.length).toBe(1);
  });
  it("preserves corrupt and future libraries instead of replacing all adventures", () => {
    const storage = new MemoryStorage();
    for (const raw of [
      "{",
      '{"version":2,"adventures":[]}',
      '{"version":1,"adventures":[{}]}',
      JSON.stringify({ version: 1, adventures: [adventure("Ada"), adventure("Ada")] }),
    ]) {
      storage.setItem(ADVENTURES_KEY, raw);
      expect(saveAdventure(adventure("New"), storage).status).toBe("invalid");
      expect(storage.getItem(ADVENTURES_KEY)).toBe(raw);
    }
  });
  it("preserves unreadable legacy slots while allowing a separate new adventure", () => {
    const storage = new MemoryStorage();
    storage.setItem(saveKey("javascript"), "{");
    expect(saveAdventure(adventure("New"), storage).status).toBe("saved");
    expect(storage.getItem(saveKey("javascript"))).toBe("{");
  });
  it("reports failed writes without losing the last successful library", () => {
    const storage = new MemoryStorage();
    saveAdventure(adventure("Ada"), storage);
    const before = storage.getItem(ADVENTURES_KEY);
    const full = {
      getItem: storage.getItem.bind(storage),
      setItem: () => {
        throw { name: "QuotaExceededError" };
      },
    };
    expect(saveAdventure(adventure("New"), full)).toEqual({ status: "storage-error", reason: "quota" });
    expect(storage.getItem(ADVENTURES_KEY)).toBe(before);
    expect(saveAdventure({ ...adventure("Ada"), adventureId: "../../bad" }, storage).status).toBe("invalid");
  });
});
