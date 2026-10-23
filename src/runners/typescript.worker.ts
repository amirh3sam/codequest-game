/// <reference lib="webworker" />
// Type-checks player TypeScript with the real compiler (typescript@6.0.3, aliased as
// `typescript-js`, because TS 7 has no JS API), then runs the JavaScript output.
// Library .d.ts files are bundled into public/runtimes/typescript/libs.json by scripts/copy-runtimes.mjs.
import type * as TS from "typescript-js";
import { runJs } from "./js-exec";
import { combineProjectSources } from "./project-source";
import { lineMapper } from "./source-map";
import type { Diagnostic, RunRequest, RunResult, WorkerMessage } from "./types";

const base = `${import.meta.env.BASE_URL}runtimes/typescript/`;
const MAIN = "/main.ts";
const GLOBALS = "/globals.d.ts";
const LIB_DIR = "/lib/";

// What player code can use besides the ES2022 standard library. Matches js-exec.ts.
const GLOBALS_SOURCE = `
interface Console {
  log(...data: any[]): void;
  info(...data: any[]): void;
  debug(...data: any[]): void;
  error(...data: any[]): void;
  warn(...data: any[]): void;
}
declare var console: Console;
/** Reads the next line of input, or null when there is none. */
declare function prompt(message?: string): string | null;
declare function setTimeout(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearTimeout(id: number | undefined): void;
declare function setInterval(handler: (...args: any[]) => void, timeout?: number, ...args: any[]): number;
declare function clearInterval(id: number | undefined): void;
declare function queueMicrotask(callback: () => void): void;
`;

type Compiler = {
  ts: typeof TS;
  options: TS.CompilerOptions;
  /** Parsed once and reused: parsing the standard library is the slow part. */
  fixedFiles: Map<string, TS.SourceFile>;
  oldProgram?: TS.Program;
};
let ready: Promise<Compiler> | null = null;

function init(): Promise<Compiler> {
  ready ??= (async () => {
    const [{ default: ts }, libsResponse] = await Promise.all([import("typescript-js"), fetch(`${base}libs.json`)]);
    if (!libsResponse.ok) throw new Error(`Could not load libs.json (${libsResponse.status})`);
    const libs = (await libsResponse.json()) as Record<string, string>;
    const options: TS.CompilerOptions = {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      // Every file is its own module, so player names never clash with globals.
      moduleDetection: ts.ModuleDetectionKind.Force,
      lib: ["lib.es2022.d.ts"],
      strict: true,
      // The library .d.ts files are trusted; re-checking them every run costs ~100 ms.
      skipLibCheck: true,
      sourceMap: true,
      types: [],
    };
    const fixedFiles = new Map<string, TS.SourceFile>();
    for (const [name, text] of Object.entries(libs)) {
      fixedFiles.set(LIB_DIR + name, ts.createSourceFile(LIB_DIR + name, text, ts.ScriptTarget.ES2022));
    }
    fixedFiles.set(GLOBALS, ts.createSourceFile(GLOBALS, GLOBALS_SOURCE, ts.ScriptTarget.ES2022));
    return { ts, options, fixedFiles };
  })();
  return ready;
}

function compile(c: Compiler, code: string) {
  const { ts, options, fixedFiles } = c;
  const main = ts.createSourceFile(MAIN, code, ts.ScriptTarget.ES2022);
  const output = new Map<string, string>();
  const host: TS.CompilerHost = {
    getSourceFile: (name) => (name === MAIN ? main : fixedFiles.get(name)),
    getDefaultLibFileName: () => `${LIB_DIR}lib.es2022.d.ts`,
    getDefaultLibLocation: () => LIB_DIR,
    writeFile: (name, text) => output.set(name, text),
    getCurrentDirectory: () => "/",
    getCanonicalFileName: (name) => name,
    useCaseSensitiveFileNames: () => true,
    getNewLine: () => "\n",
    fileExists: (name) => name === MAIN || fixedFiles.has(name),
    readFile: () => undefined,
  };
  const program = ts.createProgram([MAIN, GLOBALS], options, host, c.oldProgram);
  c.oldProgram = program;

  const errors: Diagnostic[] = ts
    .getPreEmitDiagnostics(program)
    .filter((d) => d.category === ts.DiagnosticCategory.Error && (!d.file || d.file.fileName === MAIN))
    // TS1375 "'await' is only allowed at the top level of a module": js-exec runs code in an
    // async function, so top-level await works (and import/export get our own error below).
    .filter((d) => d.code !== 1375)
    .map((d) => {
      const message = ts.flattenDiagnosticMessageText(d.messageText, "\n");
      if (!d.file || d.start === undefined) return { line: 1, message };
      const pos = d.file.getLineAndCharacterOfPosition(d.start);
      return { line: pos.line + 1, column: pos.character + 1, message };
    });
  errors.push(...moduleSyntaxErrors(ts, main));
  if (errors.length) return { errors };

  const emitted = program.emit(main);
  const js = output.get("/main.js");
  const map = output.get("/main.js.map");
  if (emitted.emitSkipped || js === undefined || map === undefined) throw new Error("TypeScript produced no output");
  return {
    // Every file is a module, so TS appends `export {};` and a source-map comment at the end.
    // Remove only those trailing lines, so player strings that look the same are untouched.
    js: js.replace(/\n\/\/# sourceMappingURL=[^\n]*\s*$/, "\n").replace(/\nexport \{\};\s*$/, "\n"),
    toTsLine: lineMapper((JSON.parse(map) as { mappings: string }).mappings),
  };
}

/** One-file programs can't import or export; say so clearly instead of failing at run time. */
function moduleSyntaxErrors(ts: typeof TS, file: TS.SourceFile): Diagnostic[] {
  const errors: Diagnostic[] = [];
  for (const statement of file.statements) {
    const isExport =
      ts.isExportDeclaration(statement) ||
      ts.isExportAssignment(statement) ||
      (ts.canHaveModifiers(statement) &&
        (ts.getModifiers(statement)?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword) ?? false));
    const isImport = ts.isImportDeclaration(statement) || ts.isImportEqualsDeclaration(statement);
    if (!isExport && !isImport) continue;
    const pos = file.getLineAndCharacterOfPosition(statement.getStart(file));
    errors.push({
      line: pos.line + 1,
      column: pos.character + 1,
      message: `${isExport ? "export" : "import"} isn't needed here: write your whole program in this one file.`,
    });
  }
  return errors;
}

async function run({ id, code, stdin, files, entryPath }: RunRequest): Promise<RunResult> {
  const compiler = await init();
  const t0 = performance.now();
  const compiled = compile(compiler, combineProjectSources(code, files, "typescript", entryPath));
  const compileMs = performance.now() - t0;
  if ("errors" in compiled) {
    return { id, stdout: "", stderr: "", compileErrors: compiled.errors, compileMs, runMs: 0 };
  }

  // Tell the host the program starts now, so the run timeout only measures the player's code.
  post({ id, phase: "running" });
  const t1 = performance.now();
  const result = await runJs(compiled.js, stdin);
  const tsLine = result.errorLine === undefined ? undefined : compiled.toTsLine(result.errorLine);
  const runtimeError =
    result.runtimeError && tsLine !== undefined ? `${result.runtimeError} (line ${tsLine})` : result.runtimeError;
  return {
    id,
    stdout: result.stdout,
    stderr: result.stderr,
    runtimeError,
    recycle: result.recycle,
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
      const compiler = await init();
      // Compile once so the first real run is fast (warms the parsed standard library).
      compile(compiler, "export {};");
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
