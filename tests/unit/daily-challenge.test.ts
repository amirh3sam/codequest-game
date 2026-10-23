import { describe, expect, it } from "vitest";
import { dailyChallengeFor } from "../../src/content/daily-challenge";

describe("daily coding challenges", () => {
  it("keeps the daily prompt aligned across all supported languages", () => {
    const date = "2026-10-23";
    const challenges = (["javascript", "typescript", "python", "java"] as const).map((lang) =>
      dailyChallengeFor(date, lang),
    );
    expect(new Set(challenges.map(({ id }) => id)).size).toBe(1);
    for (const challenge of challenges) {
      expect(challenge.date).toBe(date);
      expect(challenge.starter.length).toBeGreaterThan(0);
      expect(challenge.solution.length).toBeGreaterThan(challenge.starter.length / 2);
      expect(challenge.expected).toBeTruthy();
    }
  });

  it("rotates predictably and rejects invalid dates", () => {
    expect(dailyChallengeFor("2026-10-23", "java").id).toBe(dailyChallengeFor("2026-10-23", "java").id);
    expect(dailyChallengeFor("2026-10-24", "java").id).not.toBe(dailyChallengeFor("2026-10-23", "java").id);
    expect(() => dailyChallengeFor("2026-02-30", "python")).toThrow("real date");
  });
});
