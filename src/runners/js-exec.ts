// Runs player JavaScript (plain, or compiled from TypeScript) inside a runner worker.
// Shared by the JS and TS workers. Never import this on the main thread.
import { formatLog } from "./inspect";
import { MAX_OUTPUT_CHARS } from "./types";

// Captured at load, so player code that replaces globals can't break the runner itself.
const realSetTimeout = setTimeout;
const realClearTimeout = clearTimeout;
const realSetInterval = setInterval;
const realClearInterval = clearInterval;
const RealPromise = Promise;
const AsyncFunction = (async () => {}).constructor as new (...args: string[]) => (...args: unknown[]) => Promise<void>;

export type JsRunResult = {
  stdout: string;
  stderr: string;
  runtimeError?: string;
  errorLine?: number;
  /** Player code changed shared built-ins (e.g. Array.prototype); the worker should be replaced. */
  recycle?: boolean;
};

const TOO_MUCH_OUTPUT = "Too much output. Is there a print inside an endless loop?";

class OutputLimitError extends Error {}

// Worker globals that player code has no reason to touch. Shadowed with `undefined` so
// player code can't talk to the host or the network by accident (not a hard security boundary).
const SHADOWED = [
  "self",
  "globalThis",
  "postMessage",
  "close",
  "fetch",
  "importScripts",
  "XMLHttpRequest",
  "WebSocket",
];

// `new AsyncFunction` puts 2 lines ("async function anonymous(...\n) {") before the body.
const FUNCTION_HEADER_LINES = 2;

// Built-ins that player code might change (e.g. adding Array.prototype.sum in the Objects area).
const WATCHED: object[] = [
  globalThis,
  Object,
  Object.prototype,
  Array,
  Array.prototype,
  String,
  String.prototype,
  Number,
  Number.prototype,
  Boolean.prototype,
  Function.prototype,
  Symbol,
  Math,
  JSON,
  Reflect,
  Promise,
  Promise.prototype,
  Map.prototype,
  Set.prototype,
  Error.prototype,
  RegExp.prototype,
  Date.prototype,
];

function snapshotBuiltins(): Map<PropertyKey, unknown>[] {
  return WATCHED.map((obj) => {
    const props = new Map<PropertyKey, unknown>();
    for (const key of Reflect.ownKeys(obj)) {
      const desc = Reflect.getOwnPropertyDescriptor(obj, key);
      props.set(key, desc && ("value" in desc ? desc.value : desc.get));
    }
    return props;
  });
}

function builtinsChanged(before: Map<PropertyKey, unknown>[]): boolean {
  const after = snapshotBuiltins();
  return before.some((props, i) => {
    if (props.size !== after[i].size) return true;
    for (const [key, value] of props) if (after[i].get(key) !== value) return true;
    return false;
  });
}

/** Finds the player's line in an error stack (frames look like "at main.js:5:3" or "main.js:5:3"). */
function errorLineFrom(stack: string | undefined): number | undefined {
  const m = /(?:^|[\s(@])main\.js:(\d+):\d+/m.exec(stack ?? "");
  return m ? Number(m[1]) - FUNCTION_HEADER_LINES : undefined;
}

/**
 * Runs `code` like Node runs a script: `console.log` output is captured (formatted like Node),
 * `prompt()` reads lines from `stdin`, top-level `await` works, and the run ends once the code
 * and all its timers are done. Endless timers/intervals are stopped by the host's run timeout.
 */
export async function runJs(code: string, stdin = ""): Promise<JsRunResult> {
  let stdout = "";
  let stderr = "";
  let active = true; // after the run, leftover callbacks must not write output
  let overLimit = false;
  let runtimeError: string | undefined;
  let errorLine: number | undefined;
  let failed: () => void = () => {};
  const failure = new RealPromise<void>((resolve) => {
    failed = resolve;
  });

  // Like Node: the first uncaught error ends the program.
  const onError = (e: unknown) => {
    if (runtimeError) return;
    if (e instanceof OutputLimitError || overLimit) {
      runtimeError = TOO_MUCH_OUTPUT;
    } else {
      const err = e instanceof Error ? e : new Error(String(e));
      runtimeError = `${err.name}: ${err.message}`;
      errorLine = errorLineFrom(err.stack);
    }
    active = false;
    failed();
  };

  const write = (target: "out" | "err", args: unknown[]) => {
    if (!active) return;
    if (overLimit) throw new OutputLimitError();
    const line = `${formatLog(args)}\n`;
    if (target === "out") stdout += line;
    else stderr += line;
    if (stdout.length + stderr.length > MAX_OUTPUT_CHARS) overLimit = true;
  };
  const playerConsole = {
    log: (...a: unknown[]) => write("out", a),
    info: (...a: unknown[]) => write("out", a),
    debug: (...a: unknown[]) => write("out", a),
    error: (...a: unknown[]) => write("err", a),
    warn: (...a: unknown[]) => write("err", a),
  };
  const lines = stdin === "" ? [] : stdin.replace(/\r\n/g, "\n").replace(/\n$/, "").split("\n");
  const prompt = () => (lines.length ? (lines.shift() as string) : null);

  // Timers are tracked so the run can wait for them (like Node) and clear leftovers afterwards.
  const timers = new Set<number>();
  let timersChanged: () => void = () => {};
  const guard = (fn: unknown, args: unknown[]) => (): void => {
    if (!active) return;
    try {
      if (typeof fn === "function") fn(...args);
    } catch (e) {
      onError(e);
    }
  };
  const playerSetTimeout = (fn: unknown, ms?: number, ...args: unknown[]) => {
    const id = realSetTimeout(() => {
      timers.delete(id);
      guard(fn, args)();
      timersChanged();
    }, ms) as unknown as number;
    timers.add(id);
    return id;
  };
  const playerSetInterval = (fn: unknown, ms?: number, ...args: unknown[]) => {
    const id = realSetInterval(guard(fn, args), ms) as unknown as number;
    timers.add(id);
    return id;
  };
  const playerClearTimer = (id?: number) => {
    if (id === undefined) return;
    realClearTimeout(id);
    realClearInterval(id);
    timers.delete(id);
    timersChanged();
  };

  const onUnhandledRejection = (e: PromiseRejectionEvent) => {
    e.preventDefault();
    onError(e.reason);
  };
  const onUncaught = (e: ErrorEvent) => {
    e.preventDefault();
    onError(e.error ?? e.message);
  };
  self.addEventListener("unhandledrejection", onUnhandledRejection);
  self.addEventListener("error", onUncaught);
  const builtinsBefore = snapshotBuiltins();

  const params = ["console", "prompt", "setTimeout", "setInterval", "clearTimeout", "clearInterval", ...SHADOWED];
  const values = [
    playerConsole,
    prompt,
    playerSetTimeout,
    playerSetInterval,
    playerClearTimer,
    playerClearTimer,
    ...SHADOWED.map(() => undefined),
  ];
  try {
    // The block (opened on line 1) lets player code declare names like `close` or `console`
    // without clashing with the parameters above. The source line count stays the same.
    const fn = new AsyncFunction(...params, `"use strict";{${code}\n}\n//# sourceURL=main.js`);
    await RealPromise.race([fn(...values).catch(onError), failure]);
    // Wait for pending timers (an endless setInterval runs until the host's timeout, like Node).
    while (timers.size > 0 && !runtimeError) {
      await RealPromise.race([
        new RealPromise<void>((resolve) => {
          timersChanged = resolve;
        }),
        failure,
      ]);
    }
    // Tick 1 lets promise chains settle; tick 2 lets the browser deliver "unhandledrejection".
    await new RealPromise((resolve) => realSetTimeout(resolve, 0));
    await new RealPromise((resolve) => realSetTimeout(resolve, 0));
  } catch (e) {
    onError(e); // e.g. a syntax error in plain JavaScript
  } finally {
    active = false;
    for (const id of timers) playerClearTimer(id);
    self.removeEventListener("unhandledrejection", onUnhandledRejection);
    self.removeEventListener("error", onUncaught);
  }
  if (overLimit) runtimeError = TOO_MUCH_OUTPUT;
  stdout = stdout.slice(0, MAX_OUTPUT_CHARS);
  return {
    stdout,
    stderr: stderr.slice(0, MAX_OUTPUT_CHARS - stdout.length),
    runtimeError,
    errorLine,
    recycle: builtinsChanged(builtinsBefore) || undefined,
  };
}
