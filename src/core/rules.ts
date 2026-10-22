// Game rule constants (see docs/PRD.md FR-9, FR-10, FR-12).
export const MAX_HEARTS = 3;
export const TASKS_PER_AREA = 8;

export const AREA_IDS = ["variables", "conditions", "loops", "arrays", "functions", "objects", "abstraction"] as const;
export type AreaId = (typeof AREA_IDS)[number];

export const HINT_COSTS = [1, 2, 3] as const;
export type HintCost = (typeof HINT_COSTS)[number];
export function isValidHeroName(name: string): boolean {
  return /^[\p{L}\p{N} ]{1,16}$/u.test(name) && name.trim().length > 0;
}
/** Max time the player's program may run (compile time not included). */
export const RUN_TIMEOUT_MS = 5000;
/** Safety cap for compiling (Java/TS) so a stuck compiler can't hang the game. */
export const COMPILE_TIMEOUT_MS = 20_000;
/** Safety cap for downloading + starting a language runtime. */
export const WARMUP_TIMEOUT_MS = 60_000;

export type Difficulty = "easy" | "normal" | "hard";

export const GEM_REWARD: Readonly<Record<Difficulty, number>> = { easy: 1, normal: 2, hard: 3 };

/** The grader maps its result to one of these reasons; Run never calls the penalty reducer. */
export type SubmissionFailure =
  | "wrong-output"
  | "rule-failed"
  | "run-timeout"
  | "compile-error"
  | "runtime-error"
  | "compile-timeout"
  | "runner-error";

export function costsHeart(reason: SubmissionFailure): boolean {
  return reason === "wrong-output" || reason === "rule-failed" || reason === "run-timeout";
}

/** Hearts can never drop below zero. */
export function loseHeart(hearts: number): number {
  return Math.max(0, hearts - 1);
}
