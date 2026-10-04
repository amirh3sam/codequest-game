export type Lang = "java" | "javascript" | "typescript" | "python";

export type RunRequest = { id: number; code: string; stdin?: string };

export type Diagnostic = { line: number; column?: number; message: string };

export type RunResult = {
  id: number;
  stdout: string;
  stderr: string;
  /** Code didn't compile (Java/TS). Never costs a heart. */
  compileErrors?: Diagnostic[];
  /** Code compiled but crashed while running. */
  runtimeError?: string;
  /** "run" = the player's program ran too long (endless loop). "compile" = the compiler got stuck (not the player's fault). */
  timedOut?: "compile" | "run";
  /** The runner itself broke (failed to load, crashed, restarted). Never the player's fault. */
  runnerError?: string;
  /** Player code changed the worker's shared built-ins; the host replaces the worker after this run. */
  recycle?: boolean;
  /** Time spent compiling (ms), if the language compiles. */
  compileMs?: number;
  runMs: number;
};

/** Everything a runner worker can post back to the host. */
export type WorkerMessage = { warm: true } | { warmError: string } | { id: number; phase: "running" } | RunResult;

/** Stop runaway output (e.g. printing inside an infinite loop) before it eats memory. */
export const MAX_OUTPUT_CHARS = 64_000;
