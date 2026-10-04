// Game rule constants (see docs/PRD.md FR-9, FR-10, FR-12).
export const MAX_HEARTS = 3;
export const RUN_TIMEOUT_MS = 5000;

export type Difficulty = "easy" | "normal" | "hard";

export const GEM_REWARD: Record<Difficulty, number> = { easy: 1, normal: 2, hard: 3 };

/** Hearts can never drop below zero. */
export function loseHeart(hearts: number): number {
  return Math.max(0, hearts - 1);
}
