import type { Lang } from "../runners/types";
import { isBeaconChoice } from "./discoveries";
import { AREA_IDS, type AreaId, GEM_REWARD, isValidHeroName, MAX_HEARTS, TASKS_PER_AREA } from "./rules";
import { type AreaState, type GameState, isAreaUnlocked } from "./state";

export const SAVE_VERSION = 1;

export type SaveStorage = Pick<Storage, "getItem" | "setItem">;
type StorageError = Readonly<{ status: "storage-error"; reason: "quota" | "unavailable" }>;
export type LoadResult =
  | Readonly<{ status: "loaded"; state: GameState }>
  | Readonly<{ status: "empty" }>
  | Readonly<{ status: "corrupt" }>
  | Readonly<{ status: "unsupported-version"; version: number }>
  | StorageError;
export type SaveResult = Readonly<{ status: "saved" | "invalid" }> | StorageError;

export function saveKey(lang: Lang): string {
  return `codequest:v${SAVE_VERSION}:${lang}`;
}

export function isAdventureId(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isLang(value: unknown): value is Lang {
  return value === "java" || value === "javascript" || value === "typescript" || value === "python";
}

function isAreaId(value: unknown): value is AreaId {
  return typeof value === "string" && AREA_IDS.some((id) => id === value);
}

function isInteger(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= min && value <= max;
}

function isAreaState(value: unknown): value is AreaState {
  if (!isRecord(value) || !Array.isArray(value.solved) || !isRecord(value.drafts)) return false;
  if (
    value.solved.length > TASKS_PER_AREA ||
    !value.solved.every((id: unknown) => typeof id === "string" && id.length > 0) ||
    new Set(value.solved).size !== value.solved.length ||
    typeof value.lessonsFound !== "boolean" ||
    typeof value.bossDefeated !== "boolean" ||
    !isInteger(value.hearts, 1, MAX_HEARTS)
  )
    return false;

  const maxGems = value.solved.length * Math.max(...Object.values(GEM_REWARD));
  if (
    Object.hasOwn(value, "finaleStage") &&
    (!isInteger(value.finaleStage, 0, 2) || (Number(value.finaleStage) > 0 && value.solved.length !== TASKS_PER_AREA))
  )
    return false;
  if (
    !isInteger(value.gems, 0, maxGems) ||
    !isInteger(value.hintsBought, 0, maxGems) ||
    value.gems + value.hintsBought > maxGems ||
    ((value.bossDefeated || value.hintsBought > 0) && value.solved.length !== TASKS_PER_AREA)
  )
    return false;

  return Object.entries(value.drafts).every(([id, code]) => id.length > 0 && typeof code === "string");
}

function hasProgress(area: AreaState): boolean {
  return (
    area.solved.length > 0 ||
    area.lessonsFound ||
    area.gems > 0 ||
    area.hearts !== MAX_HEARTS ||
    area.hintsBought > 0 ||
    area.bossDefeated ||
    (area.finaleStage ?? 0) > 0 ||
    Object.keys(area.drafts).length > 0
  );
}

/** Validate persisted data before it can reach reducers; content-specific task IDs are checked by the future loader. */
export function isGameState(value: unknown): value is GameState {
  if (
    !isRecord(value) ||
    value.version !== SAVE_VERSION ||
    !isLang(value.lang) ||
    !isAreaId(value.currentArea) ||
    !isRecord(value.hero) ||
    !isRecord(value.areas) ||
    typeof value.updatedAt !== "string" ||
    !Number.isFinite(Date.parse(value.updatedAt))
  )
    return false;

  if (
    (value.hero.kind !== "boy" && value.hero.kind !== "girl") ||
    typeof value.hero.name !== "string" ||
    !isValidHeroName(value.hero.name)
  )
    return false;

  if (Object.hasOwn(value, "position") && value.position !== undefined) {
    if (
      !isRecord(value.position) ||
      typeof value.position.x !== "number" ||
      typeof value.position.y !== "number" ||
      !Number.isFinite(value.position.x) ||
      !Number.isFinite(value.position.y)
    )
      return false;
  }

  if (Object.hasOwn(value, "discoveries") && value.discoveries !== undefined) {
    if (
      !isRecord(value.discoveries) ||
      (Object.hasOwn(value.discoveries, "beacon") && !isBeaconChoice(value.discoveries.beacon))
    )
      return false;
  }

  if (Object.hasOwn(value, "games") && value.games !== undefined) {
    if (!isRecord(value.games) || !isInteger(value.games.packetDashBest, 0, 1_000_000)) return false;
  }

  if (Object.hasOwn(value, "adventureId") && !isAdventureId(value.adventureId)) return false;
  const areas = value.areas;
  if (Object.keys(areas).length !== AREA_IDS.length || !AREA_IDS.every((id) => isAreaState(areas[id]))) return false;
  // All fields have been narrowed above; now check invariants across the seven areas.
  const state = value as GameState;
  return (
    isAreaUnlocked(state, state.currentArea) &&
    AREA_IDS.every((id) => isAreaUnlocked(state, id) || !hasProgress(state.areas[id]))
  );
}

function storageError(error: unknown): StorageError {
  const quota = error !== null && typeof error === "object" && "name" in error && error.name === "QuotaExceededError";
  return { status: "storage-error", reason: quota ? "quota" : "unavailable" };
}

/** Resolve storage inside the try block: even reading window.localStorage can throw. */
function browserStorage(): SaveStorage {
  const storage = globalThis.localStorage;
  if (!storage) throw new Error("Browser storage is unavailable.");
  return storage;
}

export function loadGame(lang: Lang, storage?: SaveStorage): LoadResult {
  let raw: string | null;
  try {
    raw = (storage ?? browserStorage()).getItem(saveKey(lang));
  } catch (error) {
    return storageError(error);
  }
  if (raw === null) return { status: "empty" };

  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return { status: "corrupt" };
  }
  if (isRecord(value) && isInteger(value.version, 0, Number.MAX_SAFE_INTEGER) && value.version !== SAVE_VERSION) {
    return { status: "unsupported-version", version: value.version };
  }
  if (!isGameState(value) || value.lang !== lang) return { status: "corrupt" };
  return { status: "loaded", state: value };
}

/** Call after a state transition. Replacing an existing game requires confirmation in the future UI. */
export function saveGame(state: GameState, storage?: SaveStorage): SaveResult {
  let raw: string;
  try {
    if (!isGameState(state)) return { status: "invalid" };
    raw = JSON.stringify(state);
    // Reject custom toJSON output or lossy serialization before overwriting the existing slot.
    const decoded: unknown = JSON.parse(raw);
    if (!isGameState(decoded) || decoded.lang !== state.lang) return { status: "invalid" };
  } catch {
    return { status: "invalid" };
  }
  try {
    (storage ?? browserStorage()).setItem(saveKey(state.lang), raw);
    return { status: "saved" };
  } catch (error) {
    return storageError(error);
  }
}
