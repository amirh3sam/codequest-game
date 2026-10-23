/// <reference lib="webworker" />
import { runJs } from "./js-exec";
import { combineProjectSources } from "./project-source";
import type { RunRequest, RunResult, WorkerMessage } from "./types";

function post(message: WorkerMessage): void {
  self.postMessage(message);
}

self.onmessage = async ({ data }: MessageEvent<RunRequest | { warmup: true }>) => {
  if ("warmup" in data) {
    post({ warm: true });
    return;
  }
  try {
    post({ id: data.id, phase: "running" });
    const started = performance.now();
    const source = combineProjectSources(data.code, data.files, "javascript", data.entryPath);
    const result = await runJs(source, data.stdin);
    const syntaxError = result.runtimeError?.startsWith("SyntaxError:");
    const response: RunResult = {
      id: data.id,
      stdout: result.stdout,
      stderr: result.stderr,
      recycle: result.recycle,
      runMs: performance.now() - started,
      ...(syntaxError
        ? { compileErrors: [{ line: result.errorLine ?? 1, message: result.runtimeError ?? "Syntax error" }] }
        : { runtimeError: result.runtimeError }),
    };
    post(response);
  } catch (error) {
    post({ id: data.id, stdout: "", stderr: "", runnerError: String(error), runMs: 0 });
  }
};
