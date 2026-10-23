import { describe, expect, it } from "vitest";
import { isAreaAvailable, loadArea } from "../../src/content/loader";
import { isAreaContent } from "../../src/content/schema";
import { applySubmissionFailure, createGame, defeatBoss, enterArea, solveTask } from "../../src/core/state";

describe("Logic Junction", () => {
  it.each(["javascript", "typescript", "python", "java"] as const)(
    "validates %s missions and their code rules",
    (lang) => {
      const area = loadArea(lang, "conditions");
      expect(isAreaContent(area)).toBe(true);
      expect(area.tasks.map(({ id }) => id)).toEqual(Array.from({ length: 8 }, (_, i) => `conditions-${i + 1}`));
      for (const task of [...area.tasks, area.boss])
        for (const rule of task.rules ?? [])
          expect(new RegExp(rule.pattern).test(task.solution), `${task.id}: ${rule.message}`).toBe(
            rule.kind === "mustMatch",
          );
      expect(isAreaAvailable("conditions")).toBe(true);
      expect(isAreaAvailable("loops")).toBe(true);
    },
  );
  it("unlocks after the Firewall and keeps the earlier district safe on reset", () => {
    const variables = loadArea("javascript", "variables"),
      conditions = loadArea("javascript", "conditions");
    let state = createGame("javascript", { kind: "boy", name: "Ari" }, "2026-10-22T12:00:00Z");
    expect(enterArea(state, "conditions", state.updatedAt)).toBe(state);
    for (const task of variables.tasks) state = solveTask(state, variables, task.id, state.updatedAt);
    state = defeatBoss(state, variables, state.updatedAt);
    const first = state.areas.variables;
    state = enterArea(state, "conditions", state.updatedAt);
    state = solveTask(state, conditions, "conditions-1", state.updatedAt);
    for (let n = 0; n < 3; n++)
      state = applySubmissionFailure(state, "conditions", "wrong-output", state.updatedAt).state;
    expect(state.currentArea).toBe("conditions");
    expect(state.areas.conditions.solved).toEqual([]);
    expect(state.areas.variables).toEqual(first);
  });
});
