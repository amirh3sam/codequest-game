import { describe, expect, it } from "vitest";
import { loadVariables } from "../../src/content/loader";
import { isAreaContent } from "../../src/content/schema";
import { grade } from "../../src/grader/grade";
import type { RunResult } from "../../src/runners/types";

describe("content and grading", () => {
  it.each(["java", "javascript", "typescript", "python"] as const)("validates %s content", (lang) => {
    const area = loadVariables(lang);
    expect(isAreaContent(area)).toBe(true);
    expect(area.tasks).toHaveLength(8);
    expect(isAreaContent({ ...area, tasks: area.tasks.slice(1) })).toBe(false);
    expect(isAreaContent({ ...area, tasks: Array.from({ length: 8 }, () => area.tasks[0]) })).toBe(false);
  });
  const task = loadVariables("javascript").tasks[0];
  if (!task) throw new Error("Missing task");
  const run = (patch: Partial<RunResult>) => ({
    run: async () => ({ id: 0, stdout: "Ada\r\n", stderr: "", runMs: 0, ...patch }),
  });
  it("normalizes output and requires code rules as well as output", async () => {
    expect((await grade(task, task.solution, run({}))).passed).toBe(true);
    expect((await grade(task, 'console.log("Ada")', run({}))).failure).toBe("rule-failed");
    expect((await grade(task, task.solution, run({ stdout: "other" }))).failure).toBe("wrong-output");
  });
  it.each([
    [{ compileErrors: [{ line: 1, message: "Bad syntax" }] }, "compile-error"],
    [{ runtimeError: "ReferenceError" }, "runtime-error"],
    [{ runnerError: "Unavailable" }, "runner-error"],
    [{ timedOut: "compile" }, "compile-timeout"],
    [{ timedOut: "run" }, "run-timeout"],
  ] as const)("classifies execution failures before checking answers", async (patch, failure) => {
    expect((await grade(task, task.solution, run(patch as Partial<RunResult>))).failure).toBe(failure);
  });
});
