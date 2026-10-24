import { isAdventureId, isGameState, loadGame, migrateGameState, type SaveResult, type SaveStorage } from "./save";
import type { GameState } from "./state";

export const ADVENTURES_KEY = "codequest:adventures:v1";
export type Adventure = GameState & Readonly<{ adventureId: string }>;
type Library = Readonly<{ version: 1; adventures: readonly Adventure[] }>;
export type AdventureLibrary =
  | { status: "loaded"; adventures: readonly Adventure[] }
  | { status: "corrupt" | "unsupported-version" | "storage-error" };

function storageFor(storage?: SaveStorage): SaveStorage {
  const target = storage ?? globalThis.localStorage;
  if (!target) throw new Error("Storage unavailable");
  return target;
}

function parseLibrary(raw: string | null, storage?: SaveStorage): AdventureLibrary {
  if (raw === null) return { status: "loaded", adventures: [] };
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return { status: "corrupt" };
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) return { status: "corrupt" };
  const record = data as Record<string, unknown>;
  if (typeof record.version === "number" && record.version !== 1) return { status: "unsupported-version" };
  if (record.version !== 1 || !Array.isArray(record.adventures)) return { status: "corrupt" };
  const entries: Adventure[] = [];
  for (const entry of record.adventures) {
    const state = migrateGameState(entry, storage);
    if (
      !isGameState(state) ||
      !isAdventureId(state.adventureId) ||
      entries.some((entry) => entry.adventureId === state.adventureId)
    )
      return { status: "corrupt" };
    entries.push(state as Adventure);
  }
  return { status: "loaded", adventures: entries };
}

/** Read old language slots alongside the library. Reading never deletes or rewrites a player's data. */
export function loadAdventures(storage?: SaveStorage): AdventureLibrary {
  try {
    const target = storageFor(storage),
      library = parseLibrary(target.getItem(ADVENTURES_KEY), target);
    if (library.status !== "loaded") return library;
    const entries = new Map(library.adventures.map((entry) => [entry.adventureId, entry]));
    for (const lang of ["javascript", "typescript", "python", "java"] as const) {
      const legacy = loadGame(lang, target);
      if (legacy.status === "storage-error") return { status: "storage-error" };
      if (legacy.status !== "loaded") continue;
      const state = legacy.state,
        adventureId = state.adventureId ?? `legacy-${lang}`;
      const archived = entries.get(adventureId);
      if (!archived || (archived.lang === lang && Date.parse(state.updatedAt) > Date.parse(archived.updatedAt))) {
        entries.set(adventureId, { ...state, adventureId });
      }
    }
    return {
      status: "loaded",
      adventures: [...entries.values()].sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)),
    };
  } catch {
    return { status: "storage-error" };
  }
}

/** One atomic library write preserves every other adventure, including imported legacy slots. */
export function saveAdventure(state: GameState, storage?: SaveStorage): SaveResult {
  if (!isGameState(state) || !isAdventureId(state.adventureId)) return { status: "invalid" };
  try {
    const target = storageFor(storage),
      library = loadAdventures(target);
    if (library.status === "storage-error") return { status: "storage-error", reason: "unavailable" };
    if (library.status !== "loaded") return { status: "invalid" };
    const existing = library.adventures.find((entry) => entry.adventureId === state.adventureId);
    if (existing && existing.lang !== state.lang) return { status: "invalid" };
    const data: Library = {
      version: 1,
      adventures: [
        state as Adventure,
        ...library.adventures.filter((entry) => entry.adventureId !== state.adventureId),
      ],
    };
    const raw = JSON.stringify(data),
      decoded = parseLibrary(raw);
    if (decoded.status !== "loaded" || decoded.adventures[0]?.adventureId !== state.adventureId)
      return { status: "invalid" };
    target.setItem(ADVENTURES_KEY, raw);
    return { status: "saved" };
  } catch (error) {
    return {
      status: "storage-error",
      reason:
        error && typeof error === "object" && "name" in error && error.name === "QuotaExceededError"
          ? "quota"
          : "unavailable",
    };
  }
}
