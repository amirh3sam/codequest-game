/// <reference lib="webworker" />
// Runs player Python fully in the browser with Pyodide (CPython compiled to WebAssembly).
// Files are copied into public/runtimes/python by scripts/copy-runtimes.mjs.

import { combineProjectSources } from "./project-source";
import { MAX_OUTPUT_CHARS, type RunRequest, type RunResult, type WorkerMessage } from "./types";

// Only the small part of the Pyodide API we use (its own .d.ts pulls in Node types).
type PyCallable = ((...args: string[]) => string) & { destroy(): void };
type Pyodide = {
  setStdout(options: { write(buffer: Uint8Array): number }): void;
  setStderr(options: { write(buffer: Uint8Array): number }): void;
  runPython(code: string): unknown;
  globals: { get(name: string): PyCallable };
};

const base = `${import.meta.env.BASE_URL}runtimes/python/`;

// Python-side helpers. Results come back as JSON strings so no Python objects leak into JS.
// `main.py` is the file name players see in error messages.
// Each run gets a fresh namespace, its own stdin, and the interpreter state it may have
// changed (streams, recursion limit, newly imported modules) is put back afterwards, so one
// task can never affect the next.
const DRIVER = `
import builtins, io, json, sys, traceback
_dumps = json.dumps
_extract_tb = traceback.extract_tb
_modules_before = set(sys.modules)
_recursion_limit = sys.getrecursionlimit()
_print, _input = builtins.print, builtins.input
_code = None

def _cq_check(src):
    global _code
    _code = None
    try:
        _code = compile(src, "main.py", "exec")
        return "null"
    except SyntaxError as e:
        err = {"line": e.lineno or 1, "message": f"{type(e).__name__}: {e.msg}"}
        if e.offset is not None:
            err["column"] = e.offset
        return _dumps(err)
    except Exception as e:  # e.g. RecursionError for absurdly nested code
        return _dumps({"line": 1, "message": f"{type(e).__name__}: {e}"})

def _cq_run(stdin):
    sys.stdin = io.StringIO(stdin)
    ns = {"__name__": "__main__"}
    try:
        exec(_code, ns)
        return "null"
    except SystemExit as e:
        return "null" if e.code in (None, 0) else _dumps(f"SystemExit: {e.code}")
    except BaseException as e:
        frames = [f for f in _extract_tb(e.__traceback__) if f.filename == "main.py"]
        where = f" (line {frames[-1].lineno})" if frames else ""
        text = str(e)
        return _dumps(f"{type(e).__name__}: {text}{where}" if text else f"{type(e).__name__}{where}")
    finally:
        # Flushing fails once the output cap is hit; that is already reported by the worker.
        for stream in (sys.stdout, sys.stderr):
            try:
                stream.flush()
            except Exception:
                pass
        sys.stdin, sys.stdout, sys.stderr = sys.__stdin__, sys.__stdout__, sys.__stderr__
        builtins.print, builtins.input = _print, _input
        sys.setrecursionlimit(_recursion_limit)
        for name in set(sys.modules) - _modules_before:
            del sys.modules[name]
`;

type Helpers = { pyodide: Pyodide; check: PyCallable; exec: PyCallable };
let ready: Promise<Helpers> | null = null;

function init(): Promise<Helpers> {
  ready ??= (async () => {
    const { loadPyodide } = (await import(/* @vite-ignore */ `${base}pyodide.mjs`)) as {
      loadPyodide(options: { indexURL: string }): Promise<Pyodide>;
    };
    const pyodide = await loadPyodide({ indexURL: base });
    pyodide.runPython(DRIVER);
    return { pyodide, check: pyodide.globals.get("_cq_check"), exec: pyodide.globals.get("_cq_run") };
  })();
  return ready;
}

class OutputLimitError extends Error {}

async function run({ id, code, stdin, files, entryPath }: RunRequest): Promise<RunResult> {
  const { pyodide, check, exec } = await init();

  let stdout = "";
  let stderr = "";
  let overLimit = false;
  // Pyodide hands us UTF-8 bytes; streaming decoders keep multi-byte characters (é, 💎) intact.
  const writer = (target: "out" | "err") => {
    const decoder = new TextDecoder();
    return {
      write(buffer: Uint8Array): number {
        // Once over the limit, refuse all further output (even if player code catches the error).
        // Python may flush a big buffer in one call, so check after appending too.
        if (overLimit) throw new OutputLimitError();
        const text = decoder.decode(buffer, { stream: true });
        if (target === "out") stdout += text;
        else stderr += text;
        if (stdout.length + stderr.length > MAX_OUTPUT_CHARS) overLimit = true;
        return buffer.length;
      },
    };
  };
  // Set before compiling so compile-time warnings land in this run's output.
  pyodide.setStdout(writer("out"));
  pyodide.setStderr(writer("err"));

  const t0 = performance.now();
  const source = combineProjectSources(code, files, "python", entryPath);
  const syntaxError = JSON.parse(check(source)) as { line: number; column?: number; message: string } | null;
  const compileMs = performance.now() - t0;
  if (syntaxError) {
    return { id, stdout: "", stderr: "", compileErrors: [syntaxError], compileMs, runMs: 0 };
  }

  // Tell the host the program starts now, so the run timeout only measures the player's code.
  post({ id, phase: "running" });
  const t1 = performance.now();
  // Runs the code object compiled by check(). stdin is fresh every run; empty → input() raises EOFError.
  let runtimeError = JSON.parse(exec(stdin ?? "")) as string | null;
  if (overLimit) runtimeError = "Too much output. Is there a print inside an endless loop?";
  stdout = stdout.slice(0, MAX_OUTPUT_CHARS);
  return {
    id,
    stdout,
    stderr: stderr.slice(0, MAX_OUTPUT_CHARS - stdout.length),
    runtimeError: runtimeError ?? undefined,
    compileMs,
    runMs: performance.now() - t1,
  };
}

function post(message: WorkerMessage): void {
  self.postMessage(message);
}

self.onmessage = async (e: MessageEvent<RunRequest | { warmup: true }>) => {
  const data = e.data;
  if ("warmup" in data) {
    try {
      await init();
      post({ warm: true });
    } catch (err) {
      ready = null; // allow a retry
      post({ warmError: String(err) });
    }
    return;
  }
  try {
    post(await run(data));
  } catch (err) {
    post({ id: data.id, stdout: "", stderr: "", runnerError: `Runner failed: ${String(err)}`, runMs: 0 });
  }
};
