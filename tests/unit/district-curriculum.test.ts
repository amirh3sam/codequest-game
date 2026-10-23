import { describe, expect, it } from "vitest";
import { isAreaAvailable, loadArea } from "../../src/content/loader";
import { isAreaContent } from "../../src/content/schema";
import { STUDY_CURRICULUM, studyBossFor, studyTaskFor } from "../../src/content/study-curriculum";
import { AREA_IDS } from "../../src/core/rules";
import { createGame, defeatBoss, enterArea, solveTask } from "../../src/core/state";

const STORY_AREA_IDS = ["loops", "arrays", "functions", "objects", "abstraction"] as const;
const STUDY_TOPIC_IDS = ["loops", "arrays", "methods-functions", "classes-objects-two", "abstraction-polymorphism"];

describe("playable story district route", () => {
  it("provides eight tasks and a separate boss in all four languages", () => {
    for (const [areaIndex, areaId] of STORY_AREA_IDS.entries()) {
      expect(isAreaAvailable(areaId)).toBe(true);
      const topicId = STUDY_TOPIC_IDS[areaIndex];
      const topic = STUDY_CURRICULUM.find(({ id }) => id === topicId);
      if (!topic) throw new Error(`Missing Study Path topic ${topicId}`);
      for (const lang of ["java", "javascript", "typescript", "python"] as const) {
        const area = loadArea(lang, areaId);
        expect(isAreaContent(area)).toBe(true);
        expect(area.id).toBe(areaId);
        expect(area.order).toBe(AREA_IDS.indexOf(areaId) + 1);
        expect(area.tasks).toHaveLength(8);
        expect(area.boss.id).toBe(`${areaId}-boss`);
        for (const [index, task] of area.tasks.entries()) {
          const sample = studyTaskFor(topic, lang, index);
          expect(task.id).toBe(`${areaId}-${index + 1}`);
          expect(task.solution).toBe(sample.solution);
          expect(task.tests[0]?.expectedStdout).toBe(`${sample.output}\n`);
        }
        const boss = studyBossFor(topic, lang);
        expect(area.boss.solution).toBe(boss.solution);
        expect(area.boss.tests[0]?.expectedStdout).toBe(`${boss.output}\n`);
      }
    }
  });

  it("unlocks each new city district only after its previous boss", () => {
    const lang = "javascript" as const;
    let state = createGame(lang, { kind: "girl", name: "Nova" }, "2026-10-23T12:00:00Z");
    const route = AREA_IDS;
    for (const [index, areaId] of route.entries()) {
      const area = loadArea(lang, areaId);
      if (index > 0) {
        expect(state.currentArea).toBe(route[index - 1]);
        expect(enterArea(state, areaId, state.updatedAt)).not.toBe(state);
        state = enterArea(state, areaId, state.updatedAt);
      }
      for (const task of area.tasks) state = solveTask(state, area, task.id, state.updatedAt);
      state = defeatBoss(state, area, state.updatedAt);
      expect(state.areas[areaId].bossDefeated).toBe(true);
    }
    expect(state.areas.abstraction.bossDefeated).toBe(true);
  });
});
