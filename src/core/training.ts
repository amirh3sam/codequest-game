import { AREA_IDS, type AreaId } from "./rules";
import type { GameState } from "./state";

export const TRAINING_KEY = "codequest:training:v1";
export const TRAINING_CHAPTERS = [
  "welcome",
  "movement",
  "courier",
  "missions",
  "menus",
  "tablet",
  "files",
  "travel",
  "lighting",
  "arcade",
  "saves",
  "comfort",
  "ready",
] as const;
export type TrainingChapterId = (typeof TRAINING_CHAPTERS)[number];
export type TrainingSettings = {
  version: 1;
  welcome: "new" | "in-progress" | "complete" | "skipped";
  chapter: TrainingChapterId;
  completed: TrainingChapterId[];
  autoDistricts: boolean;
};
export type DistrictTraining = { districts: readonly AreaId[] };

export function isDistrictTraining(value: unknown): value is DistrictTraining {
  if (!value || typeof value !== "object" || !("districts" in value) || !Array.isArray(value.districts)) return false;
  return (
    value.districts.length <= AREA_IDS.length &&
    new Set(value.districts).size === value.districts.length &&
    value.districts.every((id) => AREA_IDS.includes(id))
  );
}
export function markDistrictTrained(state: GameState, id = state.currentArea): GameState {
  if (state.training?.districts.includes(id)) return state;
  return { ...state, training: { districts: [...(state.training?.districts ?? []), id] } };
}
export function readTrainingSettings(storage?: Pick<Storage, "getItem">): TrainingSettings {
  const fallback: TrainingSettings = {
    version: 1,
    welcome: "new",
    chapter: "welcome",
    completed: [],
    autoDistricts: true,
  };
  try {
    const value = JSON.parse((storage ?? localStorage).getItem(TRAINING_KEY) ?? "null");
    if (
      value?.version !== 1 ||
      !["new", "in-progress", "complete", "skipped"].includes(value.welcome) ||
      !TRAINING_CHAPTERS.includes(value.chapter) ||
      !Array.isArray(value.completed) ||
      !value.completed.every((id: TrainingChapterId) => TRAINING_CHAPTERS.includes(id)) ||
      typeof value.autoDistricts !== "boolean"
    )
      return fallback;
    return {
      version: 1,
      welcome: value.welcome,
      chapter: value.chapter,
      completed: [...new Set<TrainingChapterId>(value.completed)],
      autoDistricts: value.autoDistricts,
    };
  } catch {
    return fallback;
  }
}
export function writeTrainingSettings(value: TrainingSettings, storage?: Pick<Storage, "setItem">): boolean {
  try {
    (storage ?? localStorage).setItem(TRAINING_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}
