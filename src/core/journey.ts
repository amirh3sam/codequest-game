import { type ArcadeCreation, isArcadeCreations } from "./arcade-creation";
import { type CityService, isRestored } from "./city-restoration";
import { type CompanionState, isCompanion } from "./companion";
import { isReviewState, type ReviewState } from "./learning-review";

export type LessonProgress = {
  version: 1;
  status: "in-progress" | "paused" | "complete";
  step: number;
  completed: string[];
  drafts: Record<string, string>;
};
export const GATE_STEPS = ["welcome", "predict", "branches", "modify", "challenge"] as const;
export type JourneyState = {
  gate?: LessonProgress;
  companion?: CompanionState;
  creations?: ArcadeCreation[];
  restored?: CityService[];
  reviews?: ReviewState;
};
export function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
export function newLesson(): LessonProgress {
  return { version: 1, status: "in-progress", step: 0, completed: [], drafts: {} };
}
export function isLesson(
  value: unknown,
  steps: readonly string[],
  draftKeys: readonly string[],
): value is LessonProgress {
  if (!record(value) || !Array.isArray(value.completed) || !record(value.drafts)) return false;
  return (
    value.version === 1 &&
    ["in-progress", "paused", "complete"].includes(String(value.status)) &&
    Number.isInteger(value.step) &&
    Number(value.step) >= 0 &&
    Number(value.step) < steps.length &&
    value.completed.length <= steps.length &&
    value.completed.every((id, i) => id === steps[i]) &&
    Number(value.step) <= value.completed.length &&
    (value.status === "complete") === (value.completed.length === steps.length) &&
    Object.entries(value.drafts).every(
      ([key, code]) => draftKeys.includes(key) && typeof code === "string" && code.length <= 16000,
    )
  );
}
export function isJourney(value: unknown): value is JourneyState {
  return (
    record(value) &&
    (value.gate === undefined || isLesson(value.gate, GATE_STEPS, ["modify", "challenge"])) &&
    (value.companion === undefined || isCompanion(value.companion)) &&
    (value.creations === undefined || isArcadeCreations(value.creations)) &&
    (value.restored === undefined || isRestored(value.restored)) &&
    (value.reviews === undefined || isReviewState(value.reviews))
  );
}
