import { beforeEach, describe, expect, it } from "vitest";
import {
  readStudyProgress,
  readStudyTaskProgress,
  STUDY_CURRICULUM,
  STUDY_TASKS_PER_TOPIC,
  saveStudyBossProgress,
  saveStudyTaskProgress,
  studyProgressKey,
  studyTaskFor,
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

  it("includes 17 Java categories with eight tasks and runnable examples for every language", () => {
    expect(STUDY_CURRICULUM).toHaveLength(17);
    expect(new Set(STUDY_CURRICULUM.map(({ id }) => id)).size).toBe(17);
    expect(STUDY_CURRICULUM.map(({ id }) => id)).not.toContain("language-tools");
    for (const topic of STUDY_CURRICULUM) {
      expect(topic.title).toBeTruthy();
      expect(topic.lesson.length).toBeGreaterThan(60);
      expect(topic.practice.variations).toHaveLength(STUDY_TASKS_PER_TOPIC);
      expect(topic.practice.boss.value).toBeTruthy();
      expect(topic.practice.boss.output).toBeTruthy();
      for (const lang of ["java", "javascript", "typescript", "python"] as const) {
        expect(topic.examples[lang].code.length).toBeGreaterThan(0);
        expect(topic.examples[lang].output.length).toBeGreaterThan(0);
        expect(topic.examples[lang].code).toContain(topic.practice.token[lang]);
        for (let taskIndex = 0; taskIndex < STUDY_TASKS_PER_TOPIC; taskIndex++) {
          const task = studyTaskFor(topic, lang, taskIndex);
          expect(task.starter.length).toBeGreaterThan(0);
          expect(task.solution.length).toBeGreaterThan(0);
          expect(task.output.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("saves all eight task checkpoints separately for each adventure", () => {
    const topic = STUDY_CURRICULUM[0];
    if (!topic) throw new Error("Missing study topic");
    expect(saveStudyBossProgress("nova", topic.id)).toBe(false);
    for (let count = 1; count <= STUDY_TASKS_PER_TOPIC; count++)
      expect(saveStudyTaskProgress("nova", topic.id, count)).toBe(true);
    expect(readStudyTaskProgress("nova", topic.id)).toBe(8);
    expect(readStudyProgress("nova")).toEqual([]);
    expect(saveStudyBossProgress("nova", topic.id)).toBe(true);
    expect(readStudyProgress("nova")).toEqual([topic.id]);
    expect(saveStudyBossProgress("nova", topic.id)).toBe(false);
    expect(readStudyProgress("ari")).toEqual([]);
    expect(studyProgressKey("nova")).not.toBe(studyProgressKey("ari"));
    expect(saveStudyTaskProgress("nova", topic.id, 8)).toBe(false);
    expect(saveStudyTaskProgress("nova", "not-a-topic", 1)).toBe(false);
  });

  it("keeps a prior one-checkpoint completion as the first task of its level", () => {
    const topic = STUDY_CURRICULUM[0];
    if (!topic) throw new Error("Missing study topic");
    localStorage.setItem(`codequest:study-progress:v1:legacy`, JSON.stringify([topic.id]));
    expect(readStudyTaskProgress("legacy", topic.id)).toBe(1);
    expect(readStudyProgress("legacy")).toEqual([]);
    expect(saveStudyTaskProgress("legacy", topic.id, 2)).toBe(true);
    expect(readStudyTaskProgress("legacy", topic.id)).toBe(2);
  });
});
