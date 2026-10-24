import { describe, expect, it } from "vitest";
import { beginnerProgram, beginnerStarter, FIRST_PROGRAM } from "../../src/content/first-program";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import {
  BEGINNER_STEPS,
  completeBeginnerStep,
  createBeginnerProgress,
  isBeginnerProgress,
  runRobotPlan,
} from "../../src/core/beginner";
import { isGameState } from "../../src/core/save";
import { createGame } from "../../src/core/state";

describe("beginner chapter progress", () => {
  it("advances only in order and keeps city progress separate", () => {
    const initial = createBeginnerProgress();
    expect(completeBeginnerStep(initial, "rescue")).toBe(initial);
    let progress = initial;
    for (const step of BEGINNER_STEPS) {
      progress = completeBeginnerStep(progress, step);
      expect(isBeginnerProgress(progress)).toBe(true);
    }
    expect(initial.completed).toEqual([]);
    expect(progress.status).toBe("complete");
    expect(completeBeginnerStep(progress, "transfer")).toBe(progress);
    const state = createGame("java", { name: "Ada", kind: "girl" }, "2026-10-24T18:00:00.000Z");
    const withChapter = { ...state, beginner: progress };
    expect(isGameState(state)).toBe(true);
    expect(isGameState(withChapter)).toBe(true);
    expect(withChapter.areas.variables).toMatchObject({ solved: [], gems: 0, hearts: 3, bossDefeated: false });
  });
  it("includes paused drafts, robot name and instruction cards in disk backups", () => {
    const beginner = {
      ...completeBeginnerStep(createBeginnerProgress(), "instructions"),
      step: 1,
      status: "paused" as const,
      robotName: "byte",
      drafts: { name: 'String robotName = "byte";', rescue: "battery += 7;" },
      plan: ["move", "collect", "deliver"] as const,
    };
    const state = {
      ...createGame("java", { name: "Ada", kind: "girl" }, "2026-10-24T18:00:00.000Z"),
      beginner: { ...beginner, plan: [...beginner.plan] },
    };
    const restored = parseAdventureBackup(JSON.stringify(makeAdventureBackup(state))).state;
    expect(restored.beginner).toEqual(beginner);
    expect(restored.areas).toEqual(state.areas);
    expect(restored.beginner).not.toBe(beginner);
  });
  it("rejects corrupt progress, skipped lessons and oversized/unknown drafts", () => {
    const base = createBeginnerProgress();
    const invalid = [
      null,
      [],
      { ...base, version: 2 },
      { ...base, completed: ["rescue"] },
      { ...base, completed: ["instructions", "instructions"] },
      { ...base, step: 2 },
      { ...base, step: -1 },
      { ...base, step: 0.5 },
      { ...base, status: "complete" },
      { ...base, status: "new" },
      { ...base, robotName: "<script>" },
      { ...base, robotName: "a".repeat(17) },
      { ...base, drafts: null },
      { ...base, drafts: { name: 3 } },
      { ...base, drafts: { transfer: "print(6)" } },
      { ...base, drafts: { rescue: "a".repeat(16001) } },
      { ...base, plan: ["teleport"] },
      { ...base, plan: ["move", "move", "move", "move"] },
    ];
    for (const value of invalid) {
      expect(isBeginnerProgress(value)).toBe(false);
      const state = createGame("javascript", { name: "Ada", kind: "girl" }, "2026-10-24T18:00:00.000Z");
      expect(isGameState({ ...state, beginner: value })).toBe(false);
    }
  });
});
describe("robot instructions", () => {
  it("follows real state transitions and stops at the first impossible instruction", () => {
    const correct = runRobotPlan(["move", "collect", "deliver"]);
    expect(correct.success).toBe(true);
    expect(correct.frames.map(({ station, carrying, delivered }) => ({ station, carrying, delivered }))).toEqual([
      { station: "supply", carrying: false, delivered: false },
      { station: "supply", carrying: true, delivered: false },
      { station: "clinic", carrying: false, delivered: true },
    ]);
    for (const plan of [
      ["collect", "move", "deliver"],
      ["deliver", "move", "collect"],
      ["move", "deliver", "collect"],
      ["collect", "deliver", "move"],
      ["deliver", "collect", "move"],
    ] as const) {
      const result = runRobotPlan(plan);
      expect(result.success).toBe(false);
      expect(result.frames.at(-1)?.delivered).toBe(false);
    }
    expect(runRobotPlan([]).success).toBe(false);
    expect(runRobotPlan(["move", "collect"]).success).toBe(false);
  });
});
it("provides a small supported-language program and staged help for every lesson", () => {
  expect(Object.keys(FIRST_PROGRAM)).toEqual(BEGINNER_STEPS);
  for (const lesson of Object.values(FIRST_PROGRAM)) {
    expect(lesson.hints).toHaveLength(3);
    expect(lesson.goal.length).toBeGreaterThan(20);
  }
  for (const lang of ["javascript", "typescript", "python", "java"] as const) {
    expect(beginnerStarter(lang, "rescue")).toBe("");
    const code = beginnerProgram(lang, "rescue", lang === "python" ? "battery += 7" : "battery += 7;", 4);
    expect(code).toMatch(/battery(?:: number)? = 4/);
    expect(code).toContain("battery += 7");
    expect(code).toContain(
      lang === "python" ? "print(battery)" : lang === "java" ? "System.out.println(battery)" : "console.log(battery)",
    );
    expect(code.includes("public static void main")).toBe(lang === "java");
  }
});
