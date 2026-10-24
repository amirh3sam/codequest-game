import { type Adventure, loadAdventures, removeAdventure, saveAdventure } from "./adventures";
import { isValidHeroName } from "./rules";
import { loadGame, saveKey } from "./save";
import { createGame } from "./state";

export type ManagementStorage = Pick<Storage, "getItem" | "setItem" | "removeItem" | "key" | "length">;
export type ManagementResult =
  | { status: "saved"; state?: Adventure; cleanupComplete: boolean }
  | { status: "invalid" | "storage-error" };

function find(id: string, storage: ManagementStorage): Adventure | undefined {
  const library = loadAdventures(storage);
  return library.status === "loaded" ? library.adventures.find((state) => state.adventureId === id) : undefined;
}
function keys(storage: ManagementStorage): string[] {
  return Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
    (key): key is string => key !== null,
  );
}
/** Only browser data belonging to this ID is removed. Never touches connected disk folders. */
export function cleanAdventureData(state: Adventure, storage: ManagementStorage = localStorage): boolean {
  try {
    const ids = [state.adventureId, ...(state.adventureId === `legacy-${state.lang}` ? [`guest-${state.lang}`] : [])];
    for (const key of keys(storage)) {
      const match =
        /^codequest:(?:onboarding|tablet|workspace|study-progress|study-bosses|daily|daily-draft|project-workspace|project-progress|study-draft):v\d+:([^:]+)(?::|$)/.exec(
          key,
        );
      if (
        (match && ids.includes(match[1])) ||
        (state.adventureId === `legacy-${state.lang}` && key === `codequest:tablet:v1:${state.lang}`)
      )
        storage.removeItem(key);
    }
    const legacy = loadGame(state.lang, storage);
    if (legacy.status === "storage-error") return false;
    if (legacy.status === "loaded" && (legacy.state.adventureId ?? `legacy-${state.lang}`) === state.adventureId)
      storage.removeItem(saveKey(state.lang));
    return true;
  } catch {
    return false;
  }
}

export function renameAdventure(
  id: string,
  name: string,
  at: string,
  storage: ManagementStorage = localStorage,
): ManagementResult {
  if (!isValidHeroName(name.trim())) return { status: "invalid" };
  try {
    const previous = find(id, storage);
    if (!previous || !Number.isFinite(Date.parse(at))) return { status: "invalid" };
    const state = {
      ...previous,
      hero: { ...previous.hero, name: name.trim() },
      updatedAt: new Date(Math.max(Date.parse(at), Date.parse(previous.updatedAt) + 1)).toISOString(),
    };
    const result = saveAdventure(state, storage);
    return result.status === "saved" ? { status: "saved", state, cleanupComplete: true } : { status: result.status };
  } catch {
    return { status: "storage-error" };
  }
}

export function restartAdventure(
  id: string,
  freshId: string,
  at: string,
  storage: ManagementStorage = localStorage,
): ManagementResult {
  try {
    const previous = find(id, storage);
    if (!previous) return { status: "invalid" };
    const state: Adventure = {
      ...createGame(previous.lang, previous.hero, at),
      adventureId: freshId,
      training: { districts: [] },
    };
    const result = removeAdventure(id, state, storage);
    return result.status === "saved"
      ? { status: "saved", state, cleanupComplete: cleanAdventureData(previous, storage) }
      : { status: result.status };
  } catch {
    return { status: "storage-error" };
  }
}

export function deleteAdventure(id: string, storage: ManagementStorage = localStorage): ManagementResult {
  try {
    const previous = find(id, storage);
    if (!previous) return { status: "invalid" };
    const result = removeAdventure(id, undefined, storage);
    return result.status === "saved"
      ? { status: "saved", cleanupComplete: cleanAdventureData(previous, storage) }
      : { status: result.status };
  } catch {
    return { status: "storage-error" };
  }
}

/** Explicit full-profile erasure. Other applications on this origin are preserved. */
export function deleteAllGameData(storage: ManagementStorage = localStorage): boolean {
  try {
    const owned = keys(storage).filter((key) => key.startsWith("codequest:"));
    // Keep the library until the last removal so an interrupted cleanup remains recoverable.
    owned.sort((a, b) => Number(a === "codequest:adventures:v1") - Number(b === "codequest:adventures:v1"));
    for (const key of owned) storage.removeItem(key);
    return !keys(storage).some((key) => key.startsWith("codequest:"));
  } catch {
    return false;
  }
}
