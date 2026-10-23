import type { Lang } from "../runners/types";

export type WorkspaceFiles = Record<string, string>;
export type WorkspaceData = { version: 1; entryPath?: string; files: WorkspaceFiles; folders: string[] };

export interface LocalFileHandle {
  readonly kind: "file";
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string | Blob): Promise<void>; close(): Promise<void> }>;
}

export interface LocalDirectoryHandle {
  readonly kind: "directory";
  readonly name: string;
  entries(): AsyncIterableIterator<[string, LocalFileHandle | LocalDirectoryHandle]>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<LocalDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LocalFileHandle>;
  removeEntry(name: string, options?: { recursive?: boolean }): Promise<void>;
}

type FolderPickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: "readwrite" }) => Promise<LocalDirectoryHandle>;
};

const MAX_FILES = 120;
const MAX_FILE_BYTES = 512_000;
const MAX_PROJECT_SHARE_CHARS = 2_000_000;
const TEXT_FILE =
  /\.(?:c|cc|cpp|cs|css|go|h|html|java|js|json|jsx|kt|md|mjs|php|py|rb|rs|sh|sql|swift|ts|tsx|txt|xml|yaml|yml)$/i;
const SKIP_DIRECTORY = new Set([".git", ".next", ".venv", "build", "dist", "node_modules", "vendor"]);

export function createWorkspace(mainFile: string, starter: string): WorkspaceData {
  const baseName = mainFile.split("/").at(-1) ?? mainFile;
  const extension = baseName.includes(".") ? baseName.slice(baseName.lastIndexOf(".")) : ".txt";
  const files: WorkspaceFiles = {
    [mainFile]: starter,
    "README.md": `# CodeQuest project\n\nA small ${extension.slice(1)} project for ${new Date().getFullYear()}.\n\nEdit files in the Explorer. Run the project entry with its local source files.\n`,
    [`src/helpers${extension}`]: `${extension === ".py" ? "#" : "//"} Add reusable code here.\n`,
    "notes/ideas.md": "# Project ideas\n\n- What should this program do next?\n",
  };
  if (mainFile.endsWith("/Main.java")) {
    files["src/Player.java"] =
      'class Player {\n    private final String name;\n\n    Player(String name) {\n        this.name = name;\n    }\n\n    String greeting() {\n        return "Hello, " + name + "!";\n    }\n}\n';
  }
  return {
    version: 1,
    entryPath: mainFile,
    folders: ["src", "notes"],
    files,
  };
}

export function javaClassTemplate(path: string): string {
  const parts = path.split("/");
  const filename = parts.pop() ?? "Class.java";
  const sourceRoot = parts[0] === "src" ? parts.slice(1) : parts;
  const packageName = sourceRoot.map(javaIdentifier).join(".");
  const className = javaIdentifier(filename.replace(/\.java$/i, "")) || "NewClass";
  return `${packageName ? `package ${packageName};\n\n` : ""}import java.util.*;\n\npublic class ${className} {\n}\n`;
}

function javaIdentifier(value: string): string {
  const identifier = value.replace(/[^\w$]/g, "_").replace(/^\d/, "_$&");
  const reserved = new Set([
    "abstract",
    "assert",
    "boolean",
    "break",
    "byte",
    "case",
    "catch",
    "char",
    "class",
    "const",
    "continue",
    "default",
    "do",
    "double",
    "else",
    "enum",
    "exports",
    "extends",
    "final",
    "finally",
    "float",
    "for",
    "goto",
    "if",
    "implements",
    "import",
    "instanceof",
    "int",
    "interface",
    "long",
    "module",
    "native",
    "new",
    "open",
    "opens",
    "package",
    "private",
    "protected",
    "provides",
    "public",
    "record",
    "requires",
    "return",
    "sealed",
    "short",
    "static",
    "strictfp",
    "super",
    "switch",
    "synchronized",
    "this",
    "throw",
    "throws",
    "to",
    "transient",
    "transitive",
    "try",
    "uses",
    "var",
    "void",
    "volatile",
    "while",
    "with",
    "yield",
    "true",
    "false",
    "null",
    "_",
  ]);
  return /^[A-Za-z_$][\w$]*$/.test(identifier) ? `${identifier}${reserved.has(identifier) ? "_" : ""}` : "NewClass";
}

export function readWorkspace(key: string, fallback: WorkspaceData): WorkspaceData {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "null");
    if (
      !value ||
      typeof value !== "object" ||
      (value as WorkspaceData).version !== 1 ||
      !Array.isArray((value as WorkspaceData).folders) ||
      !isWorkspaceFiles((value as WorkspaceData).files)
    )
      return fallback;
    const workspace = value as WorkspaceData;
    return {
      version: 1,
      entryPath:
        typeof workspace.entryPath === "string" &&
        isSafePath(workspace.entryPath) &&
        workspace.files[workspace.entryPath] !== undefined
          ? workspace.entryPath
          : Object.keys(workspace.files)[0],
      folders: [...new Set(workspace.folders.filter(isSafePath))],
      files: Object.fromEntries(Object.entries(workspace.files).filter(([path]) => isSafePath(path))),
    };
  } catch {
    return fallback;
  }
}

export function writeWorkspace(key: string, workspace: WorkspaceData): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(workspace));
    return true;
  } catch {
    return false;
  }
}

export function serializeWorkspaceShare(workspace: WorkspaceData, language: Lang): string {
  return JSON.stringify({
    format: "codequest-project",
    version: 1,
    language,
    exportedAt: new Date().toISOString(),
    workspace,
  });
}

export function parseWorkspaceShare(source: string, language: Lang): WorkspaceData {
  if (source.length > MAX_PROJECT_SHARE_CHARS) throw new Error("This project file is too large to import.");
  let data: unknown;
  try {
    data = JSON.parse(source);
  } catch {
    throw new Error("This isn't a valid CodeQuest project file.");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("This isn't a CodeQuest project file.");
  const share = data as { format?: unknown; version?: unknown; language?: unknown; workspace?: unknown };
  if (share.format !== "codequest-project" || share.version !== 1 || share.language !== language)
    throw new Error("This project is for a different coding language or an unsupported version.");
  if (
    !share.workspace ||
    typeof share.workspace !== "object" ||
    Array.isArray(share.workspace) ||
    !Array.isArray((share.workspace as WorkspaceData).folders) ||
    !isWorkspaceFiles((share.workspace as WorkspaceData).files)
  )
    throw new Error("This project file doesn't contain a valid workspace.");
  const workspace = share.workspace as WorkspaceData;
  const files = Object.fromEntries(Object.entries(workspace.files).filter(([path]) => isSafePath(path)));
  const folders = [...new Set(workspace.folders.filter(isSafePath))];
  if (Object.keys(files).length === 0) throw new Error("This project has no safe source files to open.");
  const entryPath =
    typeof workspace.entryPath === "string" &&
    isSafePath(workspace.entryPath) &&
    files[workspace.entryPath] !== undefined
      ? workspace.entryPath
      : Object.keys(files)[0];
  return { version: 1, entryPath, files, folders };
}

export async function chooseLocalFolder(): Promise<{ handle: LocalDirectoryHandle; workspace: WorkspaceData }> {
  const pick = (window as FolderPickerWindow).showDirectoryPicker;
  if (!pick)
    throw new Error("Direct folder access is unavailable in this browser. The browser workspace still saves locally.");
  const handle = await pick.call(window, { mode: "readwrite" });
  const files: WorkspaceFiles = {};
  const folders: string[] = [];
  await scanDirectory(handle, "", files, folders);
  return { handle, workspace: { version: 1, files, folders } };
}

export function renameWorkspaceEntry(
  workspace: WorkspaceData,
  path: string,
  name: string,
  kind: "file" | "folder",
): string | null {
  if (!/^[\w.-]+$/.test(name) || name === "." || name === "..") return null;
  const isFolder = (candidate: string) => workspace.folders.includes(candidate);
  if (kind === "file" ? workspace.files[path] === undefined : !isFolder(path)) return null;
  const nextPath = [path.split("/").slice(0, -1).join("/"), name].filter(Boolean).join("/");
  if (nextPath === path || !isSafePath(nextPath)) return nextPath === path ? path : null;
  const affected = (candidate: string) =>
    kind === "folder" ? candidate === path || candidate.startsWith(`${path}/`) : candidate === path;
  if (
    Object.keys(workspace.files).some((candidate) => !affected(candidate) && candidate === nextPath) ||
    workspace.folders.some((candidate) => !affected(candidate) && candidate === nextPath)
  )
    return null;
  const renamed = (candidate: string) => `${nextPath}${candidate.slice(path.length)}`;
  if (kind === "file") {
    workspace.files[renamed(path)] = workspace.files[path] ?? "";
    delete workspace.files[path];
  } else {
    workspace.folders = workspace.folders.map((candidate) => (affected(candidate) ? renamed(candidate) : candidate));
    for (const [candidate, contents] of Object.entries(workspace.files)) {
      if (affected(candidate)) {
        workspace.files[renamed(candidate)] = contents;
        delete workspace.files[candidate];
      }
    }
  }
  if (workspace.entryPath && affected(workspace.entryPath)) workspace.entryPath = renamed(workspace.entryPath);
  return nextPath;
}

export function deleteWorkspaceEntry(workspace: WorkspaceData, path: string, kind: "file" | "folder"): boolean {
  const affected = (candidate: string) =>
    kind === "folder" ? candidate === path || candidate.startsWith(`${path}/`) : candidate === path;
  if (kind === "file" ? workspace.files[path] === undefined : !workspace.folders.includes(path)) return false;
  for (const candidate of Object.keys(workspace.files)) if (affected(candidate)) delete workspace.files[candidate];
  workspace.folders = workspace.folders.filter((candidate) => !affected(candidate));
  if (workspace.entryPath && affected(workspace.entryPath)) workspace.entryPath = undefined;
  return true;
}

export async function createLocalFolder(handle: LocalDirectoryHandle, path: string): Promise<void> {
  await directoryForPath(handle, path.split("/").filter(Boolean), true);
}

export async function writeLocalFile(handle: LocalDirectoryHandle, path: string, contents: string): Promise<void> {
  const segments = path.split("/").filter(Boolean),
    filename = segments.pop();
  if (!filename || !isSafePath(path)) throw new Error("That file path is not allowed.");
  const directory = await directoryForPath(handle, segments, true),
    file = await directory.getFileHandle(filename, { create: true }),
    writable = await file.createWritable();
  await writable.write(contents);
  await writable.close();
}

export async function removeLocalEntry(
  handle: LocalDirectoryHandle,
  path: string,
  kind: "file" | "folder",
): Promise<void> {
  const segments = path.split("/").filter(Boolean),
    name = segments.pop();
  if (!name || !isSafePath(path)) throw new Error("That local path is not allowed.");
  const parent = await directoryForPath(handle, segments, false);
  await parent.removeEntry(name, kind === "folder" ? { recursive: true } : undefined);
}

export async function renameLocalEntry(
  handle: LocalDirectoryHandle,
  path: string,
  nextPath: string,
  kind: "file" | "folder",
): Promise<void> {
  const sourceParts = path.split("/").filter(Boolean),
    sourceName = sourceParts.pop(),
    targetParts = nextPath.split("/").filter(Boolean),
    targetName = targetParts.pop();
  if (!sourceName || !targetName || !isSafePath(path) || !isSafePath(nextPath))
    throw new Error("That local path is not allowed.");
  const sourceParent = await directoryForPath(handle, sourceParts, false);
  const targetParent = await directoryForPath(handle, targetParts, true);
  if (kind === "file") {
    const source = await sourceParent.getFileHandle(sourceName),
      target = await targetParent.getFileHandle(targetName, { create: true }),
      writable = await target.createWritable();
    await writable.write(await source.getFile());
    await writable.close();
  } else {
    const source = await sourceParent.getDirectoryHandle(sourceName),
      target = await targetParent.getDirectoryHandle(targetName, { create: true });
    await copyDirectory(source, target);
  }
  await sourceParent.removeEntry(sourceName, kind === "folder" ? { recursive: true } : undefined);
}

async function copyDirectory(source: LocalDirectoryHandle, target: LocalDirectoryHandle): Promise<void> {
  for await (const [name, entry] of source.entries()) {
    if (entry.kind === "directory") {
      await copyDirectory(entry, await target.getDirectoryHandle(name, { create: true }));
    } else {
      const writable = await target.getFileHandle(name, { create: true }).then((file) => file.createWritable());
      await writable.write(await entry.getFile());
      await writable.close();
    }
  }
}

function isWorkspaceFiles(value: unknown): value is WorkspaceFiles {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    Object.entries(value).length <= MAX_FILES &&
    Object.entries(value).every(([, contents]) => typeof contents === "string")
  );
}

function isSafePath(path: string): boolean {
  return (
    path.length > 0 &&
    path.length <= 240 &&
    !path.startsWith("/") &&
    !path.includes("\\") &&
    !path.split("/").some((part) => !part || part === "." || part === "..")
  );
}

async function scanDirectory(
  directory: LocalDirectoryHandle,
  prefix: string,
  files: WorkspaceFiles,
  folders: string[],
): Promise<void> {
  for await (const [name, entry] of directory.entries()) {
    if (name.startsWith(".") || (entry.kind === "directory" && SKIP_DIRECTORY.has(name))) continue;
    const path = prefix ? `${prefix}/${name}` : name;
    if (!isSafePath(path)) continue;
    if (entry.kind === "directory") {
      if (folders.length >= MAX_FILES) return;
      folders.push(path);
      await scanDirectory(entry, path, files, folders);
    } else if (TEXT_FILE.test(name) && Object.keys(files).length < MAX_FILES) {
      const file = await entry.getFile();
      if (file.size <= MAX_FILE_BYTES) files[path] = await file.text();
    }
  }
}

async function directoryForPath(
  root: LocalDirectoryHandle,
  segments: string[],
  create: boolean,
): Promise<LocalDirectoryHandle> {
  let current = root;
  for (const segment of segments) {
    if (!segment || segment === "." || segment === "..") throw new Error("That folder path is not allowed.");
    current = await current.getDirectoryHandle(segment, { create });
  }
  return current;
}
