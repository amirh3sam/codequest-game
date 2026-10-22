import type { Boss, Task } from "../content/schema";
import type { SubmissionFailure } from "../core/rules";
import type { RunResult } from "../runners/types";

type Runner = { run(code: string, stdin?: string): Promise<RunResult> };
export type GradeResult = {
  passed: boolean;
  output: string;
  message: string;
  failure?: SubmissionFailure;
  passedCases: number;
  totalCases: number;
};
export function normalizeOutput(output: string): string {
  return output.replace(/\r\n?/g, "\n").trim();
}
export function executionError(result: RunResult): { reason: SubmissionFailure; message: string } | undefined {
  if (result.runnerError) return { reason: "runner-error", message: result.runnerError };
  if (result.compileErrors?.length)
    return {
      reason: "compile-error",
      message: result.compileErrors.map((error) => `Line ${error.line}: ${error.message}`).join("\n"),
    };
  if (result.timedOut)
    return {
      reason: result.timedOut === "run" ? "run-timeout" : "compile-timeout",
      message:
        result.timedOut === "run"
          ? "Your code took too long. Check your loop conditions."
          : "The compiler took too long. Try again.",
    };
  if (result.runtimeError) return { reason: "runtime-error", message: result.runtimeError };
  return undefined;
}
export async function grade(task: Task | Boss, code: string, runner: Runner): Promise<GradeResult> {
  let passedCases = 0;
  let output = "";
  for (const check of task.tests) {
    const result = await runner.run(code, check.stdin);
    output = result.stdout;
    const error = executionError(result);
    if (error)
      return {
        passed: false,
        output,
        message: error.message,
        failure: error.reason,
        passedCases,
        totalCases: task.tests.length,
      };
    if (normalizeOutput(output) === normalizeOutput(check.expectedStdout)) passedCases++;
  }
  if (passedCases !== task.tests.length)
    return {
      passed: false,
      output,
      message: "Your output doesn't match the requested result. Check the values and try again.",
      failure: "wrong-output",
      passedCases,
      totalCases: task.tests.length,
    };
  for (const rule of task.rules ?? []) {
    const matches = new RegExp(rule.pattern).test(code);
    if ((rule.kind === "mustMatch" && !matches) || (rule.kind === "mustNotMatch" && matches))
      return {
        passed: false,
        output,
        message: rule.message,
        failure: "rule-failed",
        passedCases,
        totalCases: task.tests.length,
      };
  }
  return { passed: true, output, message: "Correct!", passedCases, totalCases: task.tests.length };
}
