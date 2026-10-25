import { expect, it } from "vitest";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { finishReview, isReviewState, newReview, noteMistake, recommendedReview } from "../../src/core/learning-review";
import { createGame } from "../../src/core/state";

it("recommends the most recent unresolved idea and clears it with a fresh successful review", () => {
  const first = noteMistake(undefined, "variables", 100),
    second = noteMistake(first, "conditions", 200);
  expect(recommendedReview(second)).toBe("conditions");
  const done = finishReview(second, "conditions");
  expect(done.conditions).toMatchObject({ wins: 1, misses: 1, needsReview: false, variant: 1 });
  expect(recommendedReview(done)).toBe("variables");
  expect(first.variables?.misses).toBe(1);
  expect(first.conditions).toBeUndefined();
  const third = finishReview(finishReview(done, "conditions"), "conditions");
  expect(third.conditions?.variant).toBe(0);
});
it("persists review drafts and recent needs through the existing adventure backup", () => {
  const reviews = noteMistake(undefined, "loops", 300);
  reviews.loops = { ...(reviews.loops ?? newReview()), draft: "for marker…" };
  const s = { ...createGame("java", { name: "Ada", kind: "girl" }, "2026-10-24T20:00:00Z"), journey: { reviews } };
  expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(s))).state.journey?.reviews).toEqual(reviews);
  for (const invalid of [
    { other: newReview() },
    { loops: { ...newReview(), variant: 3 } },
    { loops: { ...newReview(), misses: -1 } },
    { loops: { ...newReview(), lastMiss: -1 } },
    { loops: { ...newReview(), needsReview: "yes" } },
    { loops: { ...newReview(), draft: "a".repeat(16001) } },
  ])
    expect(isReviewState(invalid)).toBe(false);
});
