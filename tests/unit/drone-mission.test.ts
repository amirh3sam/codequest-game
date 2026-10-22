import { describe, expect, it } from "vitest";
import { batteryExample } from "../../src/content/drone-pilot";
import { loadVariables } from "../../src/content/loader";
import { DRONE_TASK_ID, isDroneRepaired, readBatteryOutput } from "../../src/core/drone-mission";
import { createGame, resetArea, solveTask } from "../../src/core/state";
import { canStandAt, moveWithCollisions } from "../../src/game/collision";
import { courierSolids } from "../../src/game/drone-layout";
import { grade } from "../../src/grader/grade";

describe("drone preview boundary", () => {
  it("accepts only one printed battery value within capacity", () => {
    for (let n = 0; n <= 12; n++) expect(readBatteryOutput(` ${n}\n`)).toBe(n);
    for (const text of ["", "13", "-1", "3.5", "03", "NaN", "12\n12", "battery: 12", "Infinity"])
      expect(readBatteryOutput(text)).toBeUndefined();
  });
  it("restores an existing completion, awards once and closes on an area reset", () => {
    const area = loadVariables("javascript"),
      time = "2026-10-22T12:00:00.000Z";
    const initial = createGame("javascript", { kind: "girl", name: "Ada" }, time);
    const badge = solveTask(initial, area, "variables-1", time);
    expect(isDroneRepaired(badge)).toBe(false);
    const completed = solveTask(badge, area, DRONE_TASK_ID, time);
    expect(isDroneRepaired(JSON.parse(JSON.stringify(completed)))).toBe(true);
    expect(completed.areas.variables.gems).toBe(2);
    expect(solveTask(completed, area, DRONE_TASK_ID, time).areas.variables.gems).toBe(2);
    expect(isDroneRepaired(resetArea(completed, time))).toBe(false);
    expect(initial.areas.variables.solved).toEqual([]);
  });
});

it("opens a traversable passage while keeping its rails solid", () => {
  const bounds = { left: 77, right: 1459, top: 179, bottom: 691 };
  const closed = { bounds, solids: courierSolids(false) },
    open = { bounds, solids: courierSolids(true) };
  expect(moveWithCollisions({ x: 768, y: 370 }, 0, -150, closed).y).toBeGreaterThanOrEqual(354);
  expect(moveWithCollisions({ x: 768, y: 370 }, 0, -150, open).y).toBe(220);
  expect(canStandAt({ x: 707, y: 300 }, open)).toBe(false);
  expect(moveWithCollisions({ x: 154, y: 640 }, 153, 0, closed).x).toBe(307);
});

for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  it(`${lang}: requires a changing battery, rather than a hardcoded answer`, async () => {
    const task = loadVariables(lang).tasks.find((t) => t.id === DRONE_TASK_ID);
    if (!task) throw new Error("Missing drone mission");
    const runner = { run: async () => ({ id: 1, stdout: "12\n", stderr: "", runMs: 1 }) };
    expect((await grade(task, task.solution, runner)).passed).toBe(true);
    expect((await grade(task, "print(12)", runner)).passed).toBe(false);
    const example = batteryExample(lang, 4, 3);
    expect(example).toContain("battery");
    expect(example).not.toContain("__START__");
    expect(example).not.toContain("__CHARGE__");
  });
}
