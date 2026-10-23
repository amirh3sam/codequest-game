export type WorkspaceFiles = Record<string, string>;
export type WorkspaceData = { version: 1; files: WorkspaceFiles; folders: string[] };

export interface LocalFileHandle {
  readonly kind: "file";
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
}

export interface LocalDirectoryHandle {
  readonly kind: "directory";
  readonly name: string;
  entries(): AsyncIterableIterator<[string, LocalFileHandle | LocalDirectoryHandle]>;
  getDirectoryHandle(name: string, options?: { create?: boolean }): Promise<LocalDirectoryHandle>;
  getFileHandle(name: string, options?: { create?: boolean }): Promise<LocalFileHandle>;
}

type FolderPickerWindow = Window & {
  showDirectoryPicker?: (options?: { mode?: "readwrite" }) => Promise<LocalDirectoryHandle>;
};

const MAX_FILES = 120;
const MAX_FILE_BYTES = 512_000;
const TEXT_FILE =
  /\.(?:c|cc|cpp|cs|css|go|h|html|java|js|json|jsx|kt|md|mjs|php|py|rb|rs|sh|sql|swift|ts|tsx|txt|xml|yaml|yml)$/i;
const SKIP_DIRECTORY = new Set([".git", ".next", ".venv", "build", "dist", "node_modules", "vendor"]);

export function createWorkspace(mainFile: string, starter: string): WorkspaceData {
  const baseName = mainFile.split("/").at(-1) ?? mainFile;
  const extension = baseName.includes(".") ? baseName.slice(baseName.lastIndexOf(".")) : ".txt";
  const files: WorkspaceFiles = {
    [mainFile]: starter,
    "README.md": `# CodeQuest project\n\nA small ${extension.slice(1)} project for ${new Date().getFullYear()}.\n\nEdit files in the Explorer. Run the active file to see its output.\n`,
    [`src/helpers${extension}`]: "// Add reusable code here.\n",
    "notes/ideas.md": "# Project ideas\n\n- What should this program do next?\n",
  };
  if (mainFile.endsWith("/Main.java")) {
    files["src/Player.java"] =
      'class Player {\n    private final String name;\n\n    Player(String name) {\n        this.name = name;\n    }\n\n    String greeting() {\n        return "Hello, " + name + "!";\n    }\n}\n';
  }
  return {
    version: 1,
    folders: ["src", "notes"],
    files,
  };
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
