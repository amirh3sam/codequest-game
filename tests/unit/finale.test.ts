import { describe, expect, it } from "vitest";
import { usesHubLesson } from "../../src/content/hub-finale";
import { loadVariables } from "../../src/content/loader";
import { hubStage, restoreHubSubsystem } from "../../src/core/finale";
import { isGameState } from "../../src/core/save";
import { createGame, solveTask } from "../../src/core/state";

const timestamp = "2026-10-23T12:00:00Z";
const definition = loadVariables("javascript");

function prepared() {
  return definition.tasks.reduce(
    (state, task) => solveTask(state, definition, task.id, timestamp),
    createGame("javascript", { kind: "girl", name: "Ada" }, timestamp),
  );
}

describe("staged hub restoration", () => {
  it("requires the taught variable updates and string joining in the free previews", () => {
    expect(usesHubLesson(0, "let power = 5; power += 3; power -= 2; console.log(power);")).toBe(true);
    expect(usesHubLesson(0, "console.log(6);")).toBe(false);
    expect(
      usesHubLesson(
        1,
        'const operatorName = "Ada"; const signal = "Ready, " + operatorName + "!"; console.log(signal);',
      ),
    ).toBe(true);
    expect(usesHubLesson(1, 'console.log("Ready, Ada!");')).toBe(false);
  });
  it("requires all eight missions and restores checkpoints one at a time", () => {
    const fresh = createGame("javascript", { kind: "girl", name: "Ada" }, timestamp);
    expect(restoreHubSubsystem(fresh, definition, 1, timestamp)).toBe(fresh);
    const complete = prepared();
    const power = restoreHubSubsystem(complete, definition, 1, timestamp);
    expect(hubStage(power)).toBe(1);
    expect(restoreHubSubsystem(power, definition, 2, timestamp).areas.variables.finaleStage).toBe(2);
    expect(restoreHubSubsystem(complete, definition, 2, timestamp)).toBe(complete);
    expect(isGameState(power)).toBe(true);
    expect(
      isGameState({ ...power, areas: { ...power.areas, variables: { ...power.areas.variables, finaleStage: 3 } } }),
    ).toBe(false);
  });
});
