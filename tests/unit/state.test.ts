import { describe, expect, it } from "vitest";
import { AREA_IDS, type AreaId, type SubmissionFailure } from "../../src/core/rules";
import {
  type AreaDefinition,
  applySubmissionFailure,
  buyNextHint,
  canFightBoss,
  canSolveTask,
  createGame,
  defeatBoss,
  discoverLesson,
  enterArea,
  type GameState,
  isAreaUnlocked,
  resetArea,
  solveTask,
} from "../../src/core/state";

const BEFORE = "2026-10-21T12:00:00.000Z";
const AFTER = "2026-10-21T12:01:00.000Z";
const HERO = { kind: "girl", name: "Ada" } as const;

function areaDefinition(id: AreaId = "variables"): AreaDefinition {
  const difficulties = ["easy", "easy", "easy", "normal", "normal", "normal", "hard", "hard"] as const;
  return {
    id,
    tasks: difficulties.map((difficulty, index) => ({ id: `${id}-${index + 1}`, difficulty })),
    boss: { hints: [{ cost: 1 }, { cost: 2 }, { cost: 3 }] },
  };
}

function newGame(): GameState {
  return createGame("javascript", HERO, BEFORE);
}

function solveAll(state: GameState, area: AreaDefinition): GameState {
  return area.tasks.reduce((next, task) => solveTask(next, area, task.id, AFTER), state);
}

function atConditions(): GameState {
  const variables = areaDefinition();
  return enterArea(defeatBoss(solveAll(newGame(), variables), variables, AFTER), "conditions", AFTER);
}

function freeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    Object.freeze(value);
    for (const nested of Object.values(value)) freeze(nested);
  }
  return value;
}

describe("new game", () => {
  it.each(["java", "javascript", "typescript", "python"] as const)("creates a separate %s game", (lang) => {
    const state = createGame(lang, HERO, BEFORE);
    expect(state.lang).toBe(lang);
    expect(state.hero).toEqual(HERO);
    expect(state.version).toBe(1);
    expect(state.updatedAt).toBe(BEFORE);
    expect(state.currentArea).toBe("variables");
    expect(state.position).toBeUndefined();
    expect(AREA_IDS.filter((id) => isAreaUnlocked(state, id))).toEqual(["variables"]);
    for (const progress of Object.values(state.areas)) {
      expect(progress).toEqual({
        solved: [],
        lessonsFound: false,
        gems: 0,
        hearts: 3,
        hintsBought: 0,
        bossDefeated: false,
        drafts: {},
      });
    }
  });

  it("does not share mutable hero, area, task or draft objects between slots", () => {
    const hero = { kind: "boy", name: "Linus" } as const;
    const state = createGame("python", hero, BEFORE);
    const other = createGame("python", hero, BEFORE);
    expect(state.hero).not.toBe(hero);
    expect(state.areas.variables).not.toBe(other.areas.variables);
    expect(state.areas.variables.solved).not.toBe(state.areas.conditions.solved);
    expect(state.areas.variables.drafts).not.toBe(state.areas.conditions.drafts);
  });
});

describe("task rewards and gates", () => {
  it("requires the previous tasks and rewards each accepted task once", () => {
    const area = areaDefinition();
    let state = freeze(newGame());
    expect(canSolveTask(state, area, "variables-1")).toBe(true);
    expect(canSolveTask(state, area, "variables-2")).toBe(false);
    expect(solveTask(state, area, "variables-2", AFTER)).toBe(state);
    state = freeze(solveTask(state, area, "variables-1", AFTER));
    expect(state.areas.variables.gems).toBe(1);
    expect(state.areas.variables.hearts).toBe(3);
    expect(state.updatedAt).toBe(AFTER);
    expect(canSolveTask(state, area, "variables-1")).toBe(false);
    expect(canSolveTask(state, area, "variables-2")).toBe(true);
    expect(canSolveTask(state, area, "variables-3")).toBe(false);
    expect(solveTask(state, area, "variables-1", AFTER)).toBe(state);
    expect(solveTask(state, area, "unknown", AFTER)).toBe(state);
    expect(state.areas.variables.gems).toBe(1);
  });

  it("earns 1/2/3 gems for easy/normal/hard tasks and enables the boss after all eight", () => {
    const area = freeze(areaDefinition());
    let state = freeze(newGame());
    const expectedGems = [1, 2, 3, 5, 7, 9, 12, 15];
    for (const [index, task] of area.tasks.entries()) {
      expect(canFightBoss(state, area)).toBe(false);
      state = freeze(solveTask(state, area, task.id, AFTER));
      expect(state.areas.variables.gems).toBe(expectedGems[index]);
    }
    expect(canFightBoss(state, area)).toBe(true);
    expect(isAreaUnlocked(state, "conditions")).toBe(false);
  });

  it("rejects content from a different area", () => {
    const state = freeze(newGame());
    const area = areaDefinition("conditions");
    expect(canSolveTask(state, area, "conditions-1")).toBe(false);
    expect(solveTask(state, area, "conditions-1", AFTER)).toBe(state);
    expect(canFightBoss(state, area)).toBe(false);
    expect(defeatBoss(state, area, AFTER)).toBe(state);
    expect(buyNextHint(state, area, AFTER)).toBe(state);
  });

  it("rejects incomplete, empty or duplicate task lists rather than enabling a boss", () => {
    const original = areaDefinition();
    const solved = freeze(solveAll(newGame(), original));
    const badLists = [
      [],
      original.tasks.slice(0, 7),
      original.tasks.map((task) => ({ ...task, id: "same-id" })),
      original.tasks.map((task, index) => ({ ...task, id: index === 0 ? "" : task.id })),
    ];
    for (const tasks of badLists) {
      const area = { ...original, tasks };
      expect(canFightBoss(solved, area)).toBe(false);
      expect(defeatBoss(solved, area, AFTER)).toBe(solved);
      expect(buyNextHint(solved, area, AFTER)).toBe(solved);
      expect(solveTask(solved, area, "same-id", AFTER)).toBe(solved);
    }
  });
});

describe("hearts and area resets", () => {
  it.each(["wrong-output", "rule-failed", "run-timeout"] as const)("charges one heart for %s", (reason) => {
    const state = freeze(newGame());
    const transition = applySubmissionFailure(state, "variables", reason, AFTER);
    expect(transition.areaReset).toBe(false);
    expect(transition.state.areas.variables.hearts).toBe(2);
    expect(transition.state.areas.variables.gems).toBe(0);
    expect(transition.state.updatedAt).toBe(AFTER);
    expect(state.areas.variables.hearts).toBe(3);
  });

  it.each(["compile-error", "runtime-error", "compile-timeout", "runner-error"] as const)(
    "does not charge a heart or reset for %s, even on the last heart",
    (reason) => {
      let state = applySubmissionFailure(newGame(), "variables", "wrong-output", BEFORE).state;
      state = freeze(applySubmissionFailure(state, "variables", "wrong-output", BEFORE).state);
      expect(state.areas.variables.hearts).toBe(1);
      expect(applySubmissionFailure(state, "variables", reason, AFTER)).toEqual({ state, areaReset: false });
      expect(applySubmissionFailure(state, "variables", reason, AFTER).state).toBe(state);
      expect(state.updatedAt).toBe(BEFORE);
    },
  );

  it("losing the final heart resets only the current area and reports the reset to the UI", () => {
    const conditions = areaDefinition("conditions");
    let state = discoverLesson(solveAll(atConditions(), conditions), BEFORE);
    state = buyNextHint(state, conditions, BEFORE);
    state = buyNextHint(state, conditions, BEFORE);
    state = {
      ...state,
      position: { x: 120, y: 80 },
      areas: { ...state.areas, conditions: { ...state.areas.conditions, drafts: { "conditions-1": "my code" } } },
    };
    state = applySubmissionFailure(state, "conditions", "wrong-output", BEFORE).state;
    state = freeze(applySubmissionFailure(state, "conditions", "rule-failed", BEFORE).state);
    const previousArea = state.areas.variables;
    const futureArea = state.areas.loops;
    const { state: next, areaReset } = applySubmissionFailure(state, "conditions", "run-timeout", AFTER);
    expect(areaReset).toBe(true);
    expect(next.currentArea).toBe("conditions");
    expect(next.position).toBeUndefined();
    expect(next.updatedAt).toBe(AFTER);
    expect(next.hero).toBe(state.hero);
    expect(next.lang).toBe(state.lang);
    expect(next.areas.conditions).toEqual({
      solved: [],
      lessonsFound: true,
      gems: 0,
      hearts: 3,
      hintsBought: 0,
      bossDefeated: false,
      drafts: {},
    });
    expect(next.areas.variables).toBe(previousArea);
    expect(next.areas.variables.bossDefeated).toBe(true);
    expect(next.areas.loops).toBe(futureArea);
    expect(isAreaUnlocked(next, "conditions")).toBe(true);
    expect(isAreaUnlocked(next, "loops")).toBe(false);
    expect(state.areas.conditions.hearts).toBe(1);
    expect(state.areas.conditions.gems).toBe(12);
    expect(state.position).toEqual({ x: 120, y: 80 });
  });

  it("a manual reset does not mark an undiscovered lesson as found", () => {
    const state = solveTask(newGame(), areaDefinition(), "variables-1", BEFORE);
    const next = resetArea(freeze(state), AFTER);
    expect(next.areas.variables.lessonsFound).toBe(false);
    expect(next.areas.variables.solved).toEqual([]);
    expect(next.areas.variables.gems).toBe(0);
    expect(canSolveTask(next, areaDefinition(), "variables-1")).toBe(true);
  });

  it("ignores a late submission failure from a different area", () => {
    const state = freeze(atConditions());
    const transition = applySubmissionFailure(state, "variables", "wrong-output", AFTER);
    expect(transition.state).toBe(state);
    expect(transition.areaReset).toBe(false);
    expect(state.areas.conditions.hearts).toBe(3);
  });

  it("finding a lesson is permanent for the area and repeat discovery is a no-op", () => {
    const state = freeze(newGame());
    const next = freeze(discoverLesson(state, AFTER));
    expect(state.areas.variables.lessonsFound).toBe(false);
    expect(next.areas.variables.lessonsFound).toBe(true);
    expect(discoverLesson(next, AFTER)).toBe(next);
    expect(resetArea(next, AFTER).areas.variables.lessonsFound).toBe(true);
  });
});

describe("boss hint spending", () => {
  const area = areaDefinition();

  it("cannot spend gems before the boss gate opens", () => {
    const state = freeze(solveTask(newGame(), area, "variables-1", BEFORE));
    expect(state.areas.variables.gems).toBe(1);
    expect(buyNextHint(state, area, AFTER)).toBe(state);
  });

  it("buys hints in content order, charging 1/2/3 gems once per hint", () => {
    let state = freeze(solveAll(newGame(), area));
    const expectedGems = [14, 12, 9];
    for (const [index, gems] of expectedGems.entries()) {
      state = freeze(buyNextHint(state, area, AFTER));
      expect(state.areas.variables.gems).toBe(gems);
      expect(state.areas.variables.hintsBought).toBe(index + 1);
      expect(state.areas.variables.hearts).toBe(3);
    }
    expect(buyNextHint(state, area, AFTER)).toBe(state);
  });

  it("rejects an unaffordable hint without losing gems or skipping ahead", () => {
    const ready = buyNextHint(solveAll(newGame(), area), area, BEFORE);
    const state = freeze({ ...ready, areas: { ...ready.areas, variables: { ...ready.areas.variables, gems: 1 } } });
    expect(buyNextHint(state, area, AFTER)).toBe(state);
    expect(state.areas.variables.hintsBought).toBe(1);
    expect(state.areas.variables.gems).toBe(1);
  });

  it("supports additional hints from content without changing the engine", () => {
    const extended = { ...area, boss: { hints: [...area.boss.hints, { cost: 1 as const }] } };
    let state = solveAll(newGame(), extended);
    for (let index = 0; index < 4; index++) state = buyNextHint(freeze(state), extended, AFTER);
    expect(state.areas.variables.hintsBought).toBe(4);
    expect(state.areas.variables.gems).toBe(8);
  });
});

describe("area progression", () => {
  it("rejects locked areas and boss victory before all tasks are solved", () => {
    const state = freeze(newGame());
    expect(enterArea(state, "conditions", AFTER)).toBe(state);
    expect(enterArea(state, "abstraction", AFTER)).toBe(state);
    expect(defeatBoss(state, areaDefinition(), AFTER)).toBe(state);
    expect(enterArea(state, "variables", AFTER)).toBe(state);
    expect(state.updatedAt).toBe(BEFORE);
  });

  it("unlocks all 23 areas sequentially and stops at the final category", () => {
    let state = freeze(newGame());
    for (const [index, id] of AREA_IDS.entries()) {
      expect(isAreaUnlocked(state, id)).toBe(true);
      state = enterArea(state, id, AFTER);
      expect(state.currentArea).toBe(id);
      const area = areaDefinition(id);
      const nextId = AREA_IDS[index + 1];
      if (nextId) expect(isAreaUnlocked(state, nextId)).toBe(false);
      state = freeze(defeatBoss(solveAll(state, area), area, AFTER));
      expect(state.areas[id].bossDefeated).toBe(true);
      if (nextId) expect(isAreaUnlocked(state, nextId)).toBe(true);
    }
    expect(state.currentArea).toBe("study-extra-topics");
    expect(Object.keys(state.areas)).toHaveLength(23);
  });

  it("clears old map coordinates but preserves hearts, gems and hints on area changes", () => {
    const area = areaDefinition("conditions");
    let state = buyNextHint(solveAll(atConditions(), area), area, BEFORE);
    state = applySubmissionFailure(state, "conditions", "wrong-output", BEFORE).state;
    state = freeze({ ...state, position: { x: 200, y: 150 } });
    const visiting = freeze(enterArea(state, "variables", AFTER));
    expect(visiting.position).toBeUndefined();
    const returning = enterArea(visiting, "conditions", AFTER);
    expect(returning.areas.conditions).toBe(state.areas.conditions);
    expect(returning.areas.conditions.hearts).toBe(2);
    expect(returning.areas.conditions.gems).toBe(14);
    expect(returning.areas.conditions.hintsBought).toBe(1);
  });

  it("protects completed areas from repeated rewards, failures, hint purchases and resets", () => {
    const area = areaDefinition();
    const state = freeze(defeatBoss(solveAll(newGame(), area), area, BEFORE));
    expect(solveTask(state, area, "variables-1", AFTER)).toBe(state);
    expect(defeatBoss(state, area, AFTER)).toBe(state);
    expect(buyNextHint(state, area, AFTER)).toBe(state);
    expect(resetArea(state, AFTER)).toBe(state);
    for (const reason of ["wrong-output", "rule-failed", "run-timeout"] satisfies SubmissionFailure[]) {
      expect(applySubmissionFailure(state, "variables", reason, AFTER).state).toBe(state);
    }
    expect(isAreaUnlocked(state, "conditions")).toBe(true);
    expect(state.areas.variables.gems).toBe(15);
  });
});
