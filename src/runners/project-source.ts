type SourceLanguage = "javascript" | "typescript" | "python";

/**
 * Bundle local helper modules into the isolated single-program runtime.
 * Supported beginner patterns are named/default class imports in JS/TS and
 * `from module import Name` in Python. Imports are removed only when the
 * referenced source file exists in this project.
 */
export function combineProjectSources(
  entry: string,
  files: Record<string, string> | undefined,
  language: SourceLanguage,
  entryPath = `main${language === "javascript" ? ".js" : language === "typescript" ? ".ts" : ".py"}`,
): string {
  const extension = language === "javascript" ? ".js" : language === "typescript" ? ".ts" : ".py";
  const modules = Object.entries(files ?? {})
    .filter(([path]) => path.endsWith(extension))
    .sort(([a], [b]) => a.localeCompare(b));
  if (!modules.length) return entry;
  const paths = modules.map(([path]) => normalizeModulePath(path.slice(0, -extension.length)));
  const included = modules.map(([path, source]) => {
    const basePath = normalizeModulePath(path.slice(0, -extension.length));
    return language === "python"
      ? removePythonImports(source, basePath, paths)
      : removeJavaScriptImports(removeExports(source), basePath, paths);
  });
  const mainPath = normalizeModulePath(entryPath.slice(0, -extension.length));
  const main =
    language === "python"
      ? removePythonImports(entry, mainPath, paths)
      : removeJavaScriptImports(removeExports(entry), mainPath, paths);
  return [...included, main].join("\n\n");
}

function removeExports(source: string): string {
  return source
    .replace(/^\s*export\s+default\s+(?=(?:class|function)\s+\w)/gm, "")
    .replace(/^\s*export\s+(?=(?:class|function|const|let|var|interface|type|enum)\b)/gm, "")
    .replace(/^\s*export\s*\{[^\n]*\};?\s*$/gm, "");
}

function removeJavaScriptImports(source: string, importer: string, paths: string[]): string {
  return source.replace(
    /^\s*import\s+(?:[^\n;]+?\s+from\s+)?["']([^"']+)["']\s*;?\s*$/gm,
    (statement, specifier: string) => (hasModule(specifier, importer, paths) ? "" : statement),
  );
}

function removePythonImports(source: string, importer: string, paths: string[]): string {
  return source.replace(/^\s*from\s+([\w.]+)\s+import\s+[^\n]+\s*$/gm, (statement, module: string) =>
    hasPythonModule(module, importer, paths) ? "" : statement,
  );
}

function hasModule(specifier: string, importer: string, paths: string[]): boolean {
  if (!specifier.startsWith(".")) return false;
  const base = specifier.replace(/\.(?:js|ts|mjs|tsx|jsx)$/, "");
  const resolved = normalizeModulePath(`${importer.split("/").slice(0, -1).join("/")}/${base}`);
  return paths.includes(resolved);
}

function hasPythonModule(module: string, importer: string, paths: string[]): boolean {
  const requested = normalizeModulePath(module.replaceAll(".", "/"));
  const sibling = normalizeModulePath(`${importer.split("/").slice(0, -1).join("/")}/${requested}`);
  return paths.includes(sibling) || paths.includes(requested);
}

function normalizeModulePath(path: string): string {
  const parts: string[] = [];
  for (const part of path.replaceAll("\\", "/").split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") parts.pop();
    else parts.push(part.toLowerCase());
  }
  return parts.join("/");
}
