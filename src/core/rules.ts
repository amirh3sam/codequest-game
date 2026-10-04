// Game rule constants (see docs/PRD.md FR-9, FR-10, FR-12).
export const MAX_HEARTS = 3;
/** Max time the player's program may run (compile time not included). */
export const RUN_TIMEOUT_MS = 5000;
/** Safety cap for compiling (Java/TS) so a stuck compiler can't hang the game. */
export const COMPILE_TIMEOUT_MS = 20_000;
/** Safety cap for downloading + starting a language runtime. */
export const WARMUP_TIMEOUT_MS = 60_000;

export type Difficulty = "easy" | "normal" | "hard";

export const GEM_REWARD: Record<Difficulty, number> = { easy: 1, normal: 2, hard: 3 };

/** Hearts can never drop below zero. */
export function loseHeart(hearts: number): number {
  return Math.max(0, hearts - 1);
}
