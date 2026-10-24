import { describe, expect, it } from "vitest";
import { loadArea } from "../../src/content/loader";
import { districtTraining, TABLET_TRAINING, welcomeTraining } from "../../src/content/training";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { AREA_IDS } from "../../src/core/rules";
import { isGameState } from "../../src/core/save";
import { createGame } from "../../src/core/state";
import {
  markDistrictTrained,
  readTrainingSettings,
  TRAINING_CHAPTERS,
  writeTrainingSettings,
} from "../../src/core/training";

describe("training persistence", () => {
  it("remembers a partial tour and automatic introduction preference", () => {
    let value = "";
    const storage = {
      getItem: () => value,
      setItem: (_key: string, source: string) => {
        value = source;
      },
    };
    const settings = {
      ...readTrainingSettings(storage),
      welcome: "in-progress" as const,
      chapter: "tablet" as const,
      completed: ["welcome" as const],
      autoDistricts: false,
    };
    expect(writeTrainingSettings(settings, storage)).toBe(true);
    expect(readTrainingSettings(storage)).toEqual(settings);
  });
  it("recovers from corrupt, unsupported or unavailable browser preferences", () => {
    for (const value of [
      "{",
      "null",
      "1",
      '{"version":2}',
      JSON.stringify({ ...readTrainingSettings({ getItem: () => null }), completed: ["injected"] }),
    ])
      expect(readTrainingSettings({ getItem: () => value }).welcome).toBe("new");
    expect(
      readTrainingSettings({
        getItem: () => {
          throw new Error("denied");
        },
      }).welcome,
    ).toBe("new");
    expect(
      writeTrainingSettings(readTrainingSettings({ getItem: () => null }), {
        setItem: () => {
          throw new Error("full");
        },
      }),
    ).toBe(false);
  });
  it("keeps district briefings per adventure and includes them in backups", () => {
    const state = createGame("java", { kind: "boy", name: "Noah" }, "2026-10-24T15:00:00.000Z");
    const trained = markDistrictTrained(markDistrictTrained(state), "conditions");
    expect(state.training).toBeUndefined();
    expect(trained.training?.districts).toEqual(["variables", "conditions"]);
    expect(markDistrictTrained(trained, "conditions")).toBe(trained);
    expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(trained))).state.training).toEqual(trained.training);
    expect(isGameState(state)).toBe(true);
    for (const training of [
      null,
      { districts: ["unknown"] },
      { districts: ["variables", "variables"] },
      { districts: "variables" },
    ])
      expect(isGameState({ ...state, training })).toBe(false);
  });
});
it("covers every handbook chapter, tablet tab and all 23 districts in every language", () => {
  expect(welcomeTraining("Ava").map((chapter) => chapter.id)).toEqual(TRAINING_CHAPTERS);
  expect(TABLET_TRAINING.map(([name]) => name)).toEqual([
    "Code",
    "Examples",
    "Console",
    "Missions",
    "Guide",
    "Daily Quest",
    "Study Path",
    "Projects",
  ]);
  for (const lang of ["java", "javascript", "typescript", "python"] as const)
    for (const id of AREA_IDS) {
      const area = loadArea(lang, id),
        chapters = districtTraining(area);
      expect(chapters).toHaveLength(3);
      expect(chapters[0].body.join(" ")).toContain(area.tasks[0].title);
      expect(chapters[1].body).toContain(area.lesson.pages[0].body);
      expect(chapters[2].body.join(" ")).toContain(area.boss.name);
    }
});
