/// <reference lib="webworker" />
// Compiles and runs player Java fully in the browser with teavm-javac
// (OpenJDK javac + TeaVM compiled to WebAssembly). Files live in public/runtimes/java.
import { type Diagnostic, MAX_OUTPUT_CHARS, type RunRequest, type RunResult, type WorkerMessage } from "./types";

type TeaVMDiagnostic = { type: string; severity: string; lineNumber: number; columnNumber?: number; message: string };
type Compiler = {
  setSdk(data: Int8Array): void;
  setTeaVMClasslib(data: Int8Array): void;
  onDiagnostic(listener: (d: TeaVMDiagnostic) => void): void;
  clearSourceFiles(): void;
  clearOutputFiles(): void;
  addSourceFile(path: string, content: string): void;
  compile(): boolean;
  detectMainClasses(): string[];
  generateWebAssembly(options: { outputName: string; mainClass: string }): boolean;
  getWebAssemblyOutputFile(path: string): Int8Array;
};
type ConsoleImports = { putcharStdout(c: number): void; putcharStderr(c: number): void };
type LoadFn = (
  source: string | Int8Array,
  options?: { installImports?(imports: { teavmConsole?: ConsoleImports }): void },
) => Promise<{ exports: Record<string, unknown> }>;

const base = `${import.meta.env.BASE_URL}runtimes/java/`;
let ready: Promise<{ compiler: Compiler; load: LoadFn }> | null = null;
let diagnostics: TeaVMDiagnostic[] = [];

class OutputLimitError extends Error {}

async function fetchBytes(file: string): Promise<Int8Array> {
  const res = await fetch(base + file);
  if (!res.ok) throw new Error(`Could not load ${file} (${res.status})`);
  return new Int8Array(await res.arrayBuffer());
}

function init() {
  ready ??= (async () => {
    const { load } = (await import(/* @vite-ignore */ `${base}compiler.wasm-runtime.js`)) as { load: LoadFn };
    const [teavm, sdk, classlib] = await Promise.all([
      load(`${base}compiler.wasm`),
      fetchBytes("compile-classlib-teavm.bin"),
      fetchBytes("runtime-classlib-teavm.bin"),
    ]);
    const compiler = (teavm.exports.createCompiler as () => Compiler)();
    compiler.setSdk(sdk);
    compiler.setTeaVMClasslib(classlib);
    compiler.onDiagnostic((d) => diagnostics.push(d));
    return { compiler, load };
  })();
  return ready;
}

async function run({ id, code, files }: RunRequest): Promise<RunResult> {
  const { compiler, load } = await init();
  diagnostics = [];
  const t0 = performance.now();
  compiler.clearSourceFiles();
  compiler.clearOutputFiles();
  compiler.addSourceFile("Main.java", code);
  for (const [path, source] of Object.entries(files ?? {})) {
    if (/^[\w./-]+\.java$/.test(path) && !path.split("/").some((part) => part === "..") && path !== "Main.java") {
      compiler.addSourceFile(path, source);
    }
  }

  const compiled = compiler.compile();
  const mainClass = compiled ? compiler.detectMainClasses()[0] : undefined;
  const built = mainClass !== undefined && compiler.generateWebAssembly({ outputName: "app", mainClass });
  const compileMs = performance.now() - t0;
  if (!built) {
    const errors: Diagnostic[] = diagnostics
      .filter((d) => d.severity === "error")
      .map((d) => ({ line: d.lineNumber, column: d.columnNumber, message: d.message }));
    if (compiled && mainClass === undefined) {
      errors.push({ line: 1, message: "No main method found. Add: public static void main(String[] args)" });
    }
    return { id, stdout: "", stderr: "", compileErrors: errors, compileMs, runMs: 0 };
  }

  let stdout = "";
  let stderr = "";
  // Check before appending, so output stays capped even if player code catches the error.
  const put = (target: "out" | "err") => (c: number) => {
    if (stdout.length + stderr.length >= MAX_OUTPUT_CHARS) throw new OutputLimitError();
    if (target === "out") stdout += String.fromCharCode(c);
    else stderr += String.fromCharCode(c);
  };
  const t1 = performance.now();
  let runtimeError: string | undefined;
  try {
    // Tell the host compiling is over, so the run timeout only measures the player's program.
    post({ id, phase: "running" });
    const program = await load(compiler.getWebAssemblyOutputFile("app.wasm"), {
      installImports(imports) {
        imports.teavmConsole = { putcharStdout: put("out"), putcharStderr: put("err") };
      },
    });
    (program.exports.main as (args: string[]) => void)([]);
  } catch (e) {
    runtimeError =
      e instanceof OutputLimitError ? "Too much output. Is there a print inside an endless loop?" : String(e);
  }
  return { id, stdout, stderr, runtimeError, compileMs, runMs: performance.now() - t1 };
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
