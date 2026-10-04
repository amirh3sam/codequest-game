import { COMPILE_TIMEOUT_MS, RUN_TIMEOUT_MS, WARMUP_TIMEOUT_MS } from "../core/rules";
import type { Lang, RunResult, WorkerMessage } from "./types";

export type WorkerFactory = () => Worker;

// `new URL(..., import.meta.url)` lets Vite bundle each worker as its own file.
const defaultFactories: Partial<Record<Lang, WorkerFactory>> = {
  java: () => new Worker(new URL("./java.worker.ts", import.meta.url), { type: "module" }),
  python: () => new Worker(new URL("./python.worker.ts", import.meta.url), { type: "module" }),
  typescript: () => new Worker(new URL("./typescript.worker.ts", import.meta.url), { type: "module" }),
};

/** Result used when the runner itself broke (not the player's fault, never costs a heart). */
function runnerFailure(id: number, message: string): RunResult {
  return { id, stdout: "", stderr: "", runnerError: message, runMs: 0 };
}

/**
 * Keeps one warm worker per language. Player code only ever runs inside it.
 * Runs are queued so exactly one request is inside the worker at a time.
 * If a run exceeds its timeout, the worker is killed and the next run spawns a fresh one.
 */
export class WorkerHost {
  private readonly factory: WorkerFactory;
  private readonly runTimeoutMs: number;
  private worker: Worker | null = null;
  private warm: Promise<void> | null = null;
  /** Rejects the pending warmup when the worker is killed. */
  private abortWarm: ((reason: Error) => void) | null = null;
  /** Settles the in-flight run when the worker is killed. */
  private abortRun: (() => void) | null = null;
  private queue: Promise<unknown> = Promise.resolve();
  private nextId = 1;

  constructor(lang: Lang, options: { factory?: WorkerFactory; runTimeoutMs?: number } = {}) {
    const factory = options.factory ?? defaultFactories[lang];
    if (!factory) throw new Error(`No runner for ${lang} yet`);
    this.factory = factory;
    this.runTimeoutMs = options.runTimeoutMs ?? RUN_TIMEOUT_MS;
  }

  /**
   * Starts the worker and loads the language runtime. The run timeout doesn't apply here:
   * the first download can be slow, and that's not the player's fault.
   */
  warmup(): Promise<void> {
    if (this.warm) return this.warm;
    const w = this.factory();
    this.worker = w;
    const warm = new Promise<void>((resolve, reject) => {
      const done = (err?: Error) => {
        clearTimeout(timer);
        w.removeEventListener("message", onMsg);
        w.removeEventListener("error", onError);
        this.abortWarm = null;
        if (err) {
          if (this.worker === w) this.kill();
          reject(err);
        } else resolve();
      };
      const onMsg = (e: MessageEvent<WorkerMessage>) => {
        if ("warm" in e.data) done();
        else if ("warmError" in e.data) done(new Error(e.data.warmError));
      };
      const onError = (e: ErrorEvent) => done(new Error(e.message || "Runner failed to start"));
      const timer = setTimeout(() => done(new Error("Runner took too long to load")), WARMUP_TIMEOUT_MS);
      this.abortWarm = done;
      w.addEventListener("message", onMsg);
      w.addEventListener("error", onError);
      w.postMessage({ warmup: true });
    });
    this.warm = warm;
    return warm;
  }

  /** Queues a run. Never rejects: runner problems come back as `runnerError`. */
  run(code: string, stdin?: string): Promise<RunResult> {
    const id = this.nextId++;
    const result = this.queue.then(() => this.runNow(id, code, stdin));
    this.queue = result;
    return result;
  }

  private async runNow(id: number, code: string, stdin?: string): Promise<RunResult> {
    try {
      await this.warmup();
    } catch (e) {
      return runnerFailure(id, `Could not load the runner: ${(e as Error).message}`);
    }
    const w = this.worker as Worker;
    const started = performance.now();
    return new Promise<RunResult>((resolve) => {
      const finish = (result: RunResult) => {
        clearTimeout(timer);
        w.removeEventListener("message", onMsg);
        w.removeEventListener("error", onError);
        this.abortRun = null;
        resolve(result);
      };
      const expire = (phase: "compile" | "run") => {
        finish({
          id,
          stdout: "",
          stderr: "",
          timedOut: phase,
          runMs: performance.now() - started,
        });
        if (this.worker === w) this.kill();
      };
      // Compiling gets a generous cap; once the worker says the program started,
      // the player's code gets the normal run timeout.
      let timer = setTimeout(() => expire("compile"), COMPILE_TIMEOUT_MS);
      const onMsg = (e: MessageEvent<WorkerMessage>) => {
        const data = e.data;
        if (!("id" in data) || data.id !== id) return;
        if ("phase" in data) {
          clearTimeout(timer);
          timer = setTimeout(() => expire("run"), this.runTimeoutMs);
          return;
        }
        finish(data);
        // A runner that failed (e.g. Pyodide fatal error) or whose built-ins were changed by
        // player code may be unusable: replace it so the next run starts clean.
        if ((data.runnerError || data.recycle) && this.worker === w) this.kill();
      };
      const onError = (e: ErrorEvent) => {
        finish(runnerFailure(id, e.message || "Runner crashed"));
        if (this.worker === w) this.kill();
      };
      this.abortRun = () => finish(runnerFailure(id, "Runner was restarted"));
      w.addEventListener("message", onMsg);
      w.addEventListener("error", onError);
      w.postMessage({ id, code, stdin });
    });
  }

  /** Stops the worker. Anything waiting on it settles (warmup rejects, the active run gets `runnerError`). */
  kill(): void {
    const w = this.worker;
    this.worker = null;
    this.warm = null;
    w?.terminate();
    this.abortWarm?.(new Error("Runner was stopped"));
    this.abortRun?.();
  }
}
