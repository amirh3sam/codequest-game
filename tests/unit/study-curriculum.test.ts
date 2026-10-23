import { beforeEach, describe, expect, it } from "vitest";
import {
  readStudyProgress,
  STUDY_CURRICULUM,
  saveStudyTopic,
  studyProgressKey,
} from "../../src/content/study-curriculum";

describe("full study path curriculum", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  it("includes the 22 study categories with runnable samples for all four languages", () => {
    expect(STUDY_CURRICULUM).toHaveLength(22);
    expect(new Set(STUDY_CURRICULUM.map(({ id }) => id)).size).toBe(22);
    for (const topic of STUDY_CURRICULUM) {
      expect(topic.title).toBeTruthy();
      expect(topic.lesson.length).toBeGreaterThan(60);
      for (const lang of ["java", "javascript", "typescript", "python"] as const) {
        expect(topic.examples[lang].code.length).toBeGreaterThan(0);
        expect(topic.examples[lang].output.length).toBeGreaterThan(0);
      }
    }
  });

  it("saves unique completed topics separately for each adventure", () => {
    const topic = STUDY_CURRICULUM[0];
    if (!topic) throw new Error("Missing study topic");
    expect(saveStudyTopic("nova", topic.id)).toBe(true);
    expect(saveStudyTopic("nova", topic.id)).toBe(true);
    expect(readStudyProgress("nova")).toEqual([topic.id]);
    expect(readStudyProgress("ari")).toEqual([]);
    expect(studyProgressKey("nova")).not.toBe(studyProgressKey("ari"));
    expect(saveStudyTopic("nova", "not-a-topic")).toBe(false);
  });
});
