import * as monaco from "monaco-editor";
import EditorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import TypeScriptWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";
import "monaco-editor/esm/vs/basic-languages/java/java.contribution";
import "monaco-editor/esm/vs/basic-languages/python/python.contribution";
import "monaco-editor/min/vs/editor/editor.main.css";
import type { Lang } from "../runners/types";
import { JAVA_SNIPPETS } from "./java-snippets";

const workerScope = self as typeof self & {
  MonacoEnvironment?: { getWorker(workerId: string, label: string): Worker };
};
workerScope.MonacoEnvironment = {
  getWorker(_workerId, label) {
    return label === "typescript" || label === "javascript" ? new TypeScriptWorker() : new EditorWorker();
  },
};

monaco.languages.registerCompletionItemProvider("java", {
  provideCompletionItems(model, position) {
    const word = model.getWordUntilPosition(position);
    const range = {
      startLineNumber: position.lineNumber,
      endLineNumber: position.lineNumber,
      startColumn: word.startColumn,
      endColumn: word.endColumn,
    };
    return {
      suggestions: JAVA_SNIPPETS.map(({ label, detail, insertText }, index) => ({
        label,
        detail,
        insertText,
        range,
        sortText: String(index).padStart(2, "0"),
        kind: monaco.languages.CompletionItemKind.Snippet,
        insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
      })),
    };
  },
});

const LANGUAGE_ID: Record<Lang, string> = {
  javascript: "javascript",
  typescript: "typescript",
  python: "python",
  java: "java",
};

export type ProjectEditor = {
  value(): string;
  setValue(value: string): void;
  setModel(path: string, value: string): void;
  setReadOnly(readOnly: boolean): void;
  focus(): void;
  dispose(): void;
};

export function createProjectEditor(
  container: HTMLElement,
  lang: Lang,
  scope: string,
  path: string,
  value: string,
  onChange: (value: string) => void,
  onRun: () => void,
): ProjectEditor {
  const models = new Map<string, monaco.editor.ITextModel>();
  const makeModel = (filePath: string, contents: string) => {
    const uri = monaco.Uri.from({ scheme: "file", path: `/codequest/${encodeURIComponent(scope)}/${filePath}` });
    const existing = monaco.editor.getModel(uri);
    const model = existing ?? monaco.editor.createModel(contents, languageFor(filePath, lang), uri);
    if (existing && existing.getValue() !== contents) existing.setValue(contents);
    models.set(filePath, model);
    return model;
  };
  const editor = monaco.editor.create(container, {
    model: makeModel(path, value),
    theme: "vs-dark",
    automaticLayout: true,
    ariaLabel: `Practice code editor, ${path}`,
    fontFamily: "Consolas, 'Cascadia Code', monospace",
    fontSize: 14,
    lineHeight: 23,
    tabSize: 4,
    insertSpaces: true,
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    roundedSelection: false,
    renderLineHighlight: "line",
    wordWrap: "off",
    padding: { top: 14, bottom: 14 },
    bracketPairColorization: { enabled: true },
  });
  monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
    target: monaco.languages.typescript.ScriptTarget.ES2020,
    module: monaco.languages.typescript.ModuleKind.ESNext,
    moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
    allowImportingTsExtensions: true,
    noEmit: true,
    strict: true,
  });
  monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
  editor.onDidChangeModelContent(() => onChange(editor.getValue()));
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, onRun);
  editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => undefined);

  return {
    value: () => editor.getValue(),
    setValue: (contents) => editor.setValue(contents),
    setModel(filePath, contents) {
      const model = models.get(filePath) ?? makeModel(filePath, contents);
      if (model.getValue() !== contents) model.setValue(contents);
      editor.setModel(model);
      editor.updateOptions({ ariaLabel: `Practice code editor, ${filePath}` });
    },
    setReadOnly: (readOnly) => editor.updateOptions({ readOnly }),
    focus: () => editor.focus(),
    dispose() {
      editor.dispose();
      models.clear();
    },
  };
}

function languageFor(path: string, fallback: Lang): string {
  if (path.endsWith(".js") || path.endsWith(".mjs")) return "javascript";
  if (path.endsWith(".ts") || path.endsWith(".tsx")) return "typescript";
  if (path.endsWith(".py")) return "python";
  if (path.endsWith(".java")) return "java";
  if (path.endsWith(".json")) return "json";
  if (path.endsWith(".css")) return "css";
  if (path.endsWith(".html")) return "html";
  if (path.endsWith(".md")) return "markdown";
  return LANGUAGE_ID[fallback];
}
