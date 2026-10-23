import { dailyChallengeFor } from "../content/daily-challenge";
import { batteryExample } from "../content/drone-pilot";
import {
  createProjectQuestWorkspace,
  PROJECT_QUESTS,
  projectQuestWorkspaceKey,
  readProjectQuestProgress,
  saveProjectQuestProgress,
} from "../content/project-quests";
import {
  isStudyLevelUnlocked,
  readCompletedStudyTasks,
  readStudyProgress,
  readStudyTaskProgress,
  STUDY_CURRICULUM,
  STUDY_TASKS_PER_TOPIC,
  STUDY_TOTAL_TASKS,
  saveStudyBossProgress,
  saveStudyTaskProgress,
  studyBossFor,
  studyTaskFor,
} from "../content/study-curriculum";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { beginnerHint, diagnosticLine, focusEditorLine } from "./debug-guidance";
import { button, el } from "./dom";
import { JAVA_SHORTCUTS } from "./java-snippets";
import {
  chooseLocalFolder,
  createLocalFolder,
  createWorkspace,
  deleteWorkspaceEntry,
  javaClassTemplate,
  type LocalDirectoryHandle,
  parseWorkspaceShare,
  readWorkspace,
  removeLocalEntry,
  renameLocalEntry,
  renameWorkspaceEntry,
  serializeWorkspaceShare,
  type WorkspaceData,
  writeLocalFile,
  writeWorkspace,
} from "./local-workspace";
import type { ProjectEditor } from "./monaco-studio";
import { presentTabletOpening } from "./tablet-opening";

type TabletHost = {
  lang: Lang;
  name: string;
  kind: "boy" | "girl";
  courierName: string;
  adventureId?: string;
  initialStudyTopicId?: string;
  studyLevelOffset?: number;
  studyPrerequisiteComplete: boolean;
  animate: boolean;
  focusCamera(): () => void;
  panel(title: string, subtitle: string, wide: boolean): HTMLElement;
  run(code: string, files?: Record<string, string>, entryPath?: string): Promise<RunResult>;
  district: string;
  gems: number;
  hearts: number;
  missions: { title: string; prompt: string; status: "complete" | "available" | "locked"; open(): void }[];
  guide: { heading: string; body: string; code?: string }[];
  story?: () => void;
  discovery?: { title: string; status: string; open(): void };
  finale?: { title: string; status: string; open(): void };
};
const FILES: Record<Lang, string> = {
  javascript: "practice.js",
  typescript: "practice.ts",
  python: "practice.py",
  java: "Main.java",
};
const HELLO: Record<Lang, string> = {
  javascript: 'const message = "Hello, CodeQuest!";\nconsole.log(message);',
  typescript: 'const message: string = "Hello, CodeQuest!";\nconsole.log(message);',
  python: 'message = "Hello, CodeQuest!"\nprint(message)',
  java: 'public class Main {\n    public static void main(String[] args) {\n        // Player is a separate class. This starter prints Hello, CodeQuest! when you change its name.\n        Player player = new Player("Ada");\n        System.out.println(player.greeting());\n    }\n}',
};
const DEBUG_GREETING: Record<Lang, string> = {
  javascript: 'const message = "Ready";\nconsole.log(mesage);',
  typescript: 'const message: string = "Ready";\nconsole.log(mesage);',
  python: 'message = "Ready"\nprint(mesage)',
  java: 'public class Main {\n    public static void main(String[] args) {\n        String message = "Ready";\n        System.out.println(mesage);\n    }\n}',
};

/** Practice stays ungraded; mission buttons enter the game's existing task flow. */
export function openTablet(host: TabletHost): () => void {
  const panel = host.panel("Developer tablet", "Your own coding space · T to open · Esc to put away", true);
  panel.classList.add("tablet-shell");
  const studio = el("div", "tablet-studio");
  studio.dataset.language = host.lang;
  const title = el("div", "studio-title");
  title.append(
    el("span", "studio-led"),
    el("span", "", `CODEQUEST STUDIO / ${host.lang.toUpperCase()}`),
    el("small", "", `${host.name}'s workspace`),
  );
  const tabs = el("div", "studio-tabs");
  tabs.setAttribute("role", "tablist");
  tabs.setAttribute("aria-label", "Tablet workspace");
  const body = el("div", "studio-body");
  const editorPane = el("div", "studio-editor-pane"),
    examplesPane = el("div", "studio-examples"),
    consolePane = el("div", "studio-console"),
    missionsPane = el("div", "studio-missions"),
    guidePane = el("div", "studio-guide"),
    dailyPane = el("div", "studio-daily"),
    projectsPane = el("div", "studio-projects"),
    studyPane = el("div", "studio-study");
  const panes = [editorPane, examplesPane, consolePane, missionsPane, guidePane, dailyPane, studyPane, projectsPane],
    tabButtons: HTMLButtonElement[] = [];
  const select = (index: number, focus = false) => {
    for (const [i, pane] of panes.entries()) {
      pane.hidden = i !== index;
      const tab = tabButtons[i];
      tab?.setAttribute("aria-selected", String(i === index));
      if (tab) tab.tabIndex = i === index ? 0 : -1;
    }
    if (focus) tabButtons[index]?.focus();
  };
  for (const [i, label] of [
    "Code",
    "Examples",
    "Console",
    "Missions",
    "Guide",
    "Daily Quest",
    "Study Path",
    "Projects",
  ].entries()) {
    const tab = button(label, () => select(i), "studio-tab");
    tab.id = `tablet-tab-${i}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `tablet-pane-${i}`);
    tab.addEventListener("keydown", (event) => {
      const next =
        event.key === "ArrowRight"
          ? (i + 1) % panes.length
          : event.key === "ArrowLeft"
            ? (i + panes.length - 1) % panes.length
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? panes.length - 1
                : undefined;
      if (next !== undefined) {
        event.preventDefault();
        select(next, true);
      }
    });
    tabButtons.push(tab);
    tabs.append(tab);
    const pane = panes[i];
    if (pane) {
      pane.id = `tablet-pane-${i}`;
      pane.setAttribute("role", "tabpanel");
      pane.setAttribute("aria-labelledby", tab.id);
    }
  }
  const fileTree = el("aside", "studio-explorer");
  const explorerDivider = el("div", "studio-resizer");
  explorerDivider.setAttribute("role", "separator");
  explorerDivider.setAttribute("aria-label", "Resize file explorer");
  explorerDivider.tabIndex = 0;
  const explorerWidthKey = "codequest:explorer-width:v1";
  const explorerHeightKey = "codequest:explorer-height:v1";
  const readPanelSize = (key: string, fallback: number, min: number, max: number): number => {
    try {
      const value = Number(localStorage.getItem(key));
      return Number.isFinite(value) && value >= min && value <= max ? value : fallback;
    } catch {
      return fallback;
    }
  };
  const setExplorerSize = (width: number, height: number) => {
    editorPane.style.setProperty("--explorer-width", `${width}px`);
    editorPane.style.setProperty("--explorer-height", `${height}px`);
    explorerDivider.setAttribute(
      "aria-valuenow",
      String(Math.round(matchMedia("(max-width: 700px)").matches ? height : width)),
    );
  };
  let explorerWidth = readPanelSize(explorerWidthKey, 185, 150, 420);
  let explorerHeight = readPanelSize(explorerHeightKey, 145, 96, 280);
  setExplorerSize(explorerWidth, explorerHeight);
  const mobileExplorer = () => {
    const mobile = matchMedia("(max-width: 700px)").matches;
    explorerDivider.setAttribute("aria-orientation", mobile ? "horizontal" : "vertical");
    explorerDivider.setAttribute("aria-valuemin", mobile ? "96" : "150");
    explorerDivider.setAttribute("aria-valuemax", mobile ? "280" : "420");
    setExplorerSize(explorerWidth, explorerHeight);
  };
  window.addEventListener("resize", mobileExplorer);
  mobileExplorer();
  explorerDivider.addEventListener("pointerdown", (event) => {
    if (event.button !== 0 && event.pointerType !== "touch") return;
    event.preventDefault();
    explorerDivider.setPointerCapture(event.pointerId);
    const mobile = matchMedia("(max-width: 700px)").matches;
    const start = mobile ? event.clientY : event.clientX;
    const initial = mobile ? explorerHeight : explorerWidth;
    const min = mobile ? 96 : 150;
    const max = mobile ? 280 : 420;
    const onMove = (move: PointerEvent) => {
      const next = Math.round(Math.min(max, Math.max(min, initial + (mobile ? move.clientY : move.clientX) - start)));
      if (mobile) explorerHeight = next;
      else explorerWidth = next;
      setExplorerSize(explorerWidth, explorerHeight);
    };
    const onUp = () => {
      explorerDivider.removeEventListener("pointermove", onMove);
      explorerDivider.removeEventListener("pointerup", onUp);
      explorerDivider.removeEventListener("pointercancel", onUp);
      try {
        localStorage.setItem(
          mobile ? explorerHeightKey : explorerWidthKey,
          String(mobile ? explorerHeight : explorerWidth),
        );
      } catch {
        // Resizing still works for this session when storage is unavailable.
      }
    };
    explorerDivider.addEventListener("pointermove", onMove);
    explorerDivider.addEventListener("pointerup", onUp);
    explorerDivider.addEventListener("pointercancel", onUp);
  });
  explorerDivider.addEventListener("keydown", (event) => {
    const mobile = matchMedia("(max-width: 700px)").matches;
    const direction = mobile
      ? event.key === "ArrowDown"
        ? 1
        : event.key === "ArrowUp"
          ? -1
          : 0
      : event.key === "ArrowRight"
        ? 1
        : event.key === "ArrowLeft"
          ? -1
          : 0;
    if (!direction) return;
    event.preventDefault();
    if (mobile) explorerHeight = Math.min(280, Math.max(96, explorerHeight + direction * (event.shiftKey ? 32 : 12)));
    else explorerWidth = Math.min(420, Math.max(150, explorerWidth + direction * (event.shiftKey ? 32 : 12)));
    setExplorerSize(explorerWidth, explorerHeight);
    try {
      localStorage.setItem(
        mobile ? explorerHeightKey : explorerWidthKey,
        String(mobile ? explorerHeight : explorerWidth),
      );
    } catch {
      // Keyboard resizing still works for this session when storage is unavailable.
    }
  });
  const workspace = el("div", "studio-workspace"),
    codeGrid = el("div", "studio-code-grid");
  const lines = el("pre", "studio-lines"),
    code = el("textarea", "studio-code studio-code-sync"),
    monacoHost = el("div", "studio-monaco-host");
  lines.setAttribute("aria-hidden", "true");
  code.setAttribute("aria-label", "Practice code");
  code.spellcheck = false;
  code.autocapitalize = "off";
  code.maxLength = 64000;
  const legacyKey = `codequest:tablet:v1:${host.lang}`;
  const key = host.adventureId ? `codequest:tablet:v2:${host.adventureId}` : legacyKey;
  const personalWorkspaceKey = `codequest:workspace:v1:${host.adventureId ?? `guest-${host.lang}`}`;
  let workspaceKey = personalWorkspaceKey;
  const initialCode = (() => {
    try {
      return (
        localStorage.getItem(key) ??
        (host.adventureId?.startsWith("legacy-") ? localStorage.getItem(legacyKey) : null) ??
        HELLO[host.lang]
      );
    } catch {
      return HELLO[host.lang];
    }
  })();
  const mainPath = host.lang === "java" ? "src/Main.java" : `src/${FILES[host.lang]}`;
  let project: WorkspaceData = readWorkspace(workspaceKey, createWorkspace(mainPath, initialCode));
  if (!project.files[mainPath]) project.files[mainPath] = initialCode;
  let entryPath = project.entryPath ?? mainPath;
  if (!project.files[entryPath]) entryPath = mainPath;
  project.entryPath = entryPath;
  let activePath = entryPath;
  let selectedFolder = project.folders.includes("src") ? "src" : "";
  const expandedFolders = new Set(project.folders);
  let connectedFolder: LocalDirectoryHandle | null = null;
  let personalFolder: LocalDirectoryHandle | null = null;
  let activeProjectQuest: (typeof PROJECT_QUESTS)[number] | null = null;
  let questStep = 0;
  let saveTimer = 0;
  const editorHeader = el("div", "studio-editor-header");
  const openFiles = [entryPath];
  let monacoEditor: ProjectEditor | null = null;
  const focusCode = () => (monacoEditor ? monacoEditor.focus() : code.focus());
  const fileActions = el("div", "studio-file-actions");
  const folderTarget = el("span", "studio-folder-target");
  const parentPath = (path: string) => path.split("/").slice(0, -1).join("/");
  const entryActions = (path: string, kind: "file" | "folder") => {
    const actions = el("div", "studio-entry-actions");
    const rename = button("Rename", () => promptRename(path, kind), "studio-entry-action");
    rename.setAttribute("aria-label", `Rename ${path}`);
    const remove = button("Delete", () => deleteEntry(path, kind), "studio-entry-action danger");
    remove.setAttribute("aria-label", `Delete ${path}`);
    actions.append(rename, remove);
    return actions;
  };
  const promptRename = (path: string, kind: "file" | "folder") => {
    const form = el("form", "studio-create-form");
    const input = el("input", "studio-create-input");
    input.value = path.split("/").at(-1) ?? path;
    input.setAttribute("aria-label", `Rename ${path}`);
    const submit = button("Save name", () => {}, "studio-small-action");
    submit.type = "submit";
    form.append(
      input,
      submit,
      button("Cancel", () => form.remove(), "studio-small-action"),
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      project.files[activePath] = code.value;
      const newPath = renameWorkspaceEntry(project, path, input.value.trim(), kind);
      if (!newPath) {
        status.textContent = "That name is invalid or already in use.";
        return;
      }
      if (newPath === path) {
        form.remove();
        return;
      }
      const remap = (candidate: string) =>
        kind === "folder" && candidate.startsWith(`${path}/`)
          ? `${newPath}${candidate.slice(path.length)}`
          : candidate === path
            ? newPath
            : candidate;
      for (let index = 0; index < openFiles.length; index++) openFiles[index] = remap(openFiles[index] ?? "");
      activePath = remap(activePath);
      entryPath = project.entryPath ?? activePath;
      project.entryPath = entryPath;
      monacoEditor?.setModel(activePath, project.files[activePath] ?? code.value);
      code.setAttribute("aria-label", `Code editor: ${activePath}`);
      if (connectedFolder)
        void renameLocalEntry(connectedFolder, path, newPath, kind).catch(() => {
          if (panel.isConnected)
            status.textContent = "Renamed in CodeQuest, but the connected folder could not be updated.";
        });
      form.remove();
      renderEditorTabs();
      renderTree();
      persistProject();
    });
    fileTree.append(form);
    input.focus();
    input.select();
  };
  const deleteEntry = (path: string, kind: "file" | "folder") => {
    const deleted = (candidate: string) =>
      candidate === path || (kind === "folder" && candidate.startsWith(`${path}/`));
    const survivors = Object.keys(project.files).filter((candidate) => !deleted(candidate));
    if (!survivors.length) {
      status.textContent = "Keep at least one project file.";
      return;
    }
    if (!window.confirm(`Delete ${kind} “${path}” and its contents? This cannot be undone.`)) return;
    project.files[activePath] = code.value;
    deleteWorkspaceEntry(project, path, kind);
    for (let index = openFiles.length - 1; index >= 0; index--) {
      if (deleted(openFiles[index] ?? "")) openFiles.splice(index, 1);
    }
    if (deleted(activePath)) {
      activePath = openFiles.at(-1) ?? survivors[0] ?? "";
      if (!openFiles.includes(activePath)) openFiles.push(activePath);
      code.value = project.files[activePath] ?? "";
      monacoEditor?.setModel(activePath, code.value);
      code.setAttribute("aria-label", `Code editor: ${activePath}`);
    }
    entryPath = project.entryPath ?? activePath;
    project.entryPath = entryPath;
    if (connectedFolder)
      void removeLocalEntry(connectedFolder, path, kind).catch(() => {
        if (panel.isConnected)
          status.textContent = "Deleted in CodeQuest, but the connected folder could not be updated.";
      });
    renderEditorTabs();
    renderTree();
    persistProject();
  };
  const closeFileTab = (path: string) => {
    const index = openFiles.indexOf(path);
    if (index < 0) return;
    if (activePath === path) project.files[path] = code.value;
    let nextPath = activePath;
    if (activePath === path) {
      const remaining = openFiles.filter((candidate) => candidate !== path);
      nextPath =
        remaining[Math.min(index, remaining.length - 1)] ??
        Object.keys(project.files).find((candidate) => candidate !== path) ??
        "";
      if (!nextPath) {
        status.textContent = "Keep one file open. Create another file before closing this tab.";
        return;
      }
    }
    openFiles.splice(index, 1);
    if (activePath === path) {
      if (!openFiles.includes(nextPath)) openFiles.push(nextPath);
      activePath = nextPath;
      code.value = project.files[activePath] ?? "";
      monacoEditor?.setModel(activePath, code.value);
      code.setAttribute("aria-label", `Code editor: ${activePath}`);
    }
    renderEditorTabs();
    persistProject();
  };
  const renderEditorTabs = () => {
    editorHeader.replaceChildren(
      ...openFiles.map((path) => {
        const basename = path.split("/").at(-1) ?? path;
        const group = el("div", `studio-file-tab-group${activePath === path ? " active" : ""}`);
        const tab = button(
          basename,
          () => openFile(path),
          `studio-open-file-tab${activePath === path ? " active" : ""}`,
        );
        tab.title = path;
        const close = button("×", () => closeFileTab(path), "studio-close-file-tab");
        close.setAttribute("aria-label", `Close ${path}`);
        close.title = `Close ${path}`;
        group.append(tab, close);
        return group;
      }),
    );
  };
  const renderTree = () => {
    folderTarget.textContent = selectedFolder ? `${selectedFolder}/` : "Project root";
    fileTree.replaceChildren(
      el("div", "studio-explorer-heading", "EXPLORER"),
      button(
        "⌄ CODEQUEST PROJECT",
        () => {
          selectedFolder = "";
          renderTree();
        },
        `studio-tree-root${selectedFolder === "" ? " selected" : ""}`,
      ),
      fileActions,
    );
    const tree = el("div", "studio-file-tree");
    const allFolders = new Set(project.folders);
    for (const path of Object.keys(project.files)) {
      const parts = path.split("/");
      for (let i = 1; i < parts.length; i++) allFolders.add(parts.slice(0, i).join("/"));
    }
    const children = (folder: string, depth: number): HTMLElement[] => {
      const folders = [...allFolders].filter((path) => parentPath(path) === folder).sort((a, b) => a.localeCompare(b));
      const files = Object.keys(project.files)
        .filter((path) => parentPath(path) === folder)
        .sort((a, b) => a.localeCompare(b));
      return [
        ...folders.map((path) => {
          const expanded = expandedFolders.has(path);
          const folder = el("div", `studio-tree-folder${selectedFolder === path ? " selected" : ""}`);
          const summary = button(
            `📁  ${path.split("/").at(-1)}`,
            () => {
              selectedFolder = path;
              renderTree();
            },
            "studio-folder",
          );
          summary.style.setProperty("--tree-depth", String(depth));
          summary.title = `Select ${path} as the new item location`;
          summary.setAttribute("aria-label", `Select ${path} as the new item location`);
          const row = el("div", "studio-entry-row");
          const toggle = button(
            expanded ? "▾" : "▸",
            () => {
              if (expanded) expandedFolders.delete(path);
              else expandedFolders.add(path);
              renderTree();
            },
            "studio-folder-toggle",
          );
          toggle.setAttribute("aria-label", `${expanded ? "Collapse" : "Expand"} ${path}`);
          toggle.setAttribute("aria-expanded", String(expanded));
          row.append(toggle, summary, entryActions(path, "folder"));
          folder.append(row);
          if (expanded) {
            const nested = el("div", "studio-folder-children");
            nested.setAttribute("role", "group");
            nested.append(...children(path, depth + 1));
            folder.append(nested);
          }
          return folder;
        }),
        ...files.map((path) => {
          const icon = path.endsWith(".java") ? "J" : path.endsWith(".py") ? "Py" : path.endsWith(".ts") ? "TS" : "JS";
          const item = button(
            `${icon}  ${path.split("/").at(-1)}`,
            () => openFile(path),
            `studio-file${activePath === path ? " active" : ""}`,
          );
          item.style.setProperty("--tree-depth", String(depth));
          item.title = path;
          const row = el("div", "studio-entry-row");
          row.append(item, entryActions(path, "file"));
          return row;
        }),
      ];
    };
    tree.append(...children("", 0));
    fileTree.append(
      tree,
      el(
        "p",
        "studio-explorer-note",
        "Local class imports use files in this project. Java compiles every .java file together.",
      ),
    );
  };
  const persistProject = () => {
    project.files[activePath] = code.value;
    if (!writeWorkspace(workspaceKey, project))
      status.textContent = "Browser storage is full; connect or download your project.";
    if (connectedFolder) {
      const targetFolder = connectedFolder;
      const targetPath = activePath;
      const contents = code.value;
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        void writeLocalFile(targetFolder, targetPath, contents)
          .then(() => {
            if (panel.isConnected) status.textContent = `Saved to computer · ${targetPath}`;
          })
          .catch(() => {
            if (panel.isConnected) status.textContent = "Could not save to the connected folder.";
          });
      }, 450);
    }
    renderTree();
  };
  const openFile = (path: string) => {
    project.files[activePath] = code.value;
    if (project.files[path] === undefined) return;
    activePath = path;
    if (!openFiles.includes(path)) openFiles.push(path);
    let folder = parentPath(path);
    while (folder) {
      expandedFolders.add(folder);
      folder = parentPath(folder);
    }
    code.value = project.files[path] ?? "";
    monacoEditor?.setModel(path, code.value);
    code.setAttribute("aria-label", `Code editor: ${path}`);
    lines.textContent = Array.from({ length: code.value.split("\n").length }, (_, i) => i + 1).join("\n");
    renderEditorTabs();
    renderTree();
    focusCode();
  };
  code.value = project.files[activePath] ?? initialCode;
  const status = el("span", "studio-save", "Draft stays on this device");
  const changed = () => {
    lines.textContent = Array.from({ length: code.value.split("\n").length }, (_, i) => i + 1).join("\n");
    if (monacoEditor && monacoEditor.value() !== code.value) monacoEditor.setValue(code.value);
    status.textContent = connectedFolder ? "Saving to your folder…" : "Project saved on this device";
    persistProject();
  };
  changed();
  code.addEventListener("input", changed);
  code.addEventListener("scroll", () => {
    lines.scrollTop = code.scrollTop;
  });
  code.addEventListener("keydown", (event) => {
    if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();
      code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end");
      changed();
    }
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void execute();
    }
  });
  const output = el("pre", "studio-output", "Run a program to see its output here.");
  output.setAttribute("aria-label", "Practice output");
  const consoleOutput = el("pre", "studio-output", output.textContent ?? "");
  consoleOutput.setAttribute("aria-label", "Console output");
  const feedback = el("p", "studio-feedback");
  const debugHelp = el("div", "debug-guidance");
  feedback.setAttribute("role", "status");
  let running = false;
  const run = button(
    "Run practice code",
    () => {
      void execute();
    },
    "button primary",
  );
  const execute = async () => {
    if (running || !panel.isConnected) return;
    running = true;
    run.disabled = true;
    code.disabled = true;
    monacoEditor?.setReadOnly(true);
    feedback.textContent = `Running ${host.lang}…`;
    try {
      project.files[activePath] = code.value;
      const extension = { javascript: ".js", typescript: ".ts", python: ".py", java: ".java" }[host.lang];
      const runPath = host.lang === "java" ? activePath : entryPath;
      const projectSources = Object.fromEntries(
        Object.entries(project.files).filter(([path]) => path.endsWith(extension) && path !== runPath),
      );
      const result = await host.run(project.files[runPath] ?? code.value, projectSources, runPath);
      if (!panel.isConnected) return;
      const error = executionError(result);
      const lineOffset =
        host.lang === "java"
          ? 0
          : Object.entries(projectSources)
              .sort(([a], [b]) => a.localeCompare(b))
              .reduce((offset, [, source]) => offset + (source.match(/\n/g)?.length ?? 0) + 2, 0);
      const rawLine = error ? diagnosticLine(error.message) : undefined;
      const sourceLine = rawLine && rawLine > lineOffset ? rawLine - lineOffset : rawLine;
      const errorMessage =
        error?.message && rawLine && sourceLine !== rawLine
          ? error.message.replace(new RegExp(`\\bLine ${rawLine}:|\\(line ${rawLine}\\)`, "i"), (match) =>
              match.startsWith("(") ? `(line ${sourceLine})` : `Line ${sourceLine}:`,
            )
          : error?.message;
      output.textContent = [result.stdout || "(No output)", result.stderr, errorMessage].filter(Boolean).join("\n");
      consoleOutput.textContent = output.textContent;
      debugHelp.replaceChildren();
      if (error) {
        const line = sourceLine;
        debugHelp.append(
          el("strong", "", line ? `Try line ${line}` : "Debugging hint"),
          el("p", "", beginnerHint(errorMessage ?? error.message, host.lang)),
        );
        if (line)
          debugHelp.append(button(`Go to line ${line}`, () => focusEditorLine(code, line), "studio-small-action"));
      }
      feedback.textContent = error
        ? "Check the console and try again. Practice never costs hearts."
        : "Run complete · No hearts or gems spent";
      if (!error && activeProjectQuest) {
        const quest = activeProjectQuest;
        const expected = quest.steps[questStep]?.expectedOutput;
        if (expected && result.stdout.trim() === expected) {
          questStep = Math.min(quest.steps.length, questStep + 1);
          saveProjectQuestProgress(host.adventureId ?? `guest-${host.lang}`, quest.id, questStep);
          renderProjectQuest();
          feedback.textContent =
            questStep === quest.steps.length
              ? "Project complete! Your multi-file quest is saved."
              : "Milestone complete! The next project step is ready.";
        } else if (expected) {
          feedback.textContent = `The project ran. Compare the output with the current quest goal: ${expected}`;
        }
      }
      select(0);
    } catch {
      if (panel.isConnected) feedback.textContent = "Couldn't run this program. Try again; no progress changed.";
    } finally {
      if (panel.isConnected) {
        running = false;
        run.disabled = false;
        code.disabled = false;
        monacoEditor?.setReadOnly(false);
      }
    }
  };
  status.textContent = "Loading VS Code editor…";
  void import("./monaco-studio")
    .then(({ createProjectEditor }) => {
      if (!panel.isConnected) return;
      monacoHost.replaceChildren();
      monacoEditor = createProjectEditor(
        monacoHost,
        host.lang,
        host.adventureId ?? `guest-${host.lang}`,
        activePath,
        code.value,
        (value) => {
          if (code.value !== value) {
            code.value = value;
            changed();
          }
        },
        () => void execute(),
      );
      codeGrid.classList.add("has-monaco");
      status.textContent = "VS Code editor ready · project auto-saved";
    })
    .catch(() => {
      monacoHost.hidden = true;
      code.classList.remove("studio-code-sync");
      code.classList.add("studio-code-fallback");
      status.textContent = "Using the built-in editor; Monaco could not load.";
    });
  const toolbar = el("div", "studio-toolbar");
  const addFile = button("+ File", () => createEntry("file"), "studio-small-action");
  const addFolder = button("+ Folder", () => createEntry("folder"), "studio-small-action");
  const connect = button(
    "Open local folder",
    () => {
      void chooseLocalFolder()
        .then(({ handle, workspace: localProject }) => {
          connectedFolder = handle;
          project = localProject;
          openFiles.splice(0, openFiles.length, mainPath);
          if (!Object.keys(project.files).length) project = createWorkspace(mainPath, code.value);
          if (!project.files[mainPath]) project.files[mainPath] = HELLO[host.lang];
          entryPath = project.files[project.entryPath ?? ""] !== undefined ? (project.entryPath ?? mainPath) : mainPath;
          project.entryPath = entryPath;
          activePath = entryPath;
          code.value = project.files[activePath] ?? "";
          openFiles.splice(0, openFiles.length, activePath);
          monacoEditor?.setModel(activePath, code.value);
          renderEditorTabs();
          changed();
          status.textContent = `Connected to ${handle.name}`;
        })
        .catch((error: unknown) => {
          if (panel.isConnected)
            status.textContent = error instanceof Error ? error.message : "Folder access was cancelled.";
        });
    },
    "studio-small-action",
  );
  const share = button(
    "Export project",
    () => {
      try {
        const blob = new Blob([serializeWorkspaceShare(project, host.lang)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${host.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "player"}-${host.lang}.codequest.json`;
        link.click();
        window.setTimeout(() => URL.revokeObjectURL(url), 1000);
        status.textContent = "Project backup downloaded. Share the .codequest.json file with a friend.";
      } catch {
        status.textContent = "Could not export this project.";
      }
    },
    "studio-small-action",
  );
  const importInput = el("input", "studio-import-input");
  importInput.type = "file";
  importInput.accept = ".json,.codequest.json,application/json";
  importInput.setAttribute("aria-label", "Choose a CodeQuest project to import");
  const importProject = button("Import project", () => importInput.click(), "studio-small-action");
  importInput.addEventListener("change", () => {
    const file = importInput.files?.[0];
    if (!file) return;
    void file
      .text()
      .then((source) => {
        if (activeProjectQuest) throw new Error("Return to My project before importing a shared project.");
        const imported = parseWorkspaceShare(source, host.lang);
        connectedFolder = null;
        project = imported;
        entryPath = imported.entryPath ?? Object.keys(imported.files)[0] ?? mainPath;
        activePath = entryPath;
        openFiles.splice(0, openFiles.length, activePath);
        selectedFolder = parentPath(activePath);
        code.value = project.files[activePath] ?? "";
        monacoEditor?.setModel(activePath, code.value);
        renderEditorTabs();
        changed();
        status.textContent = `Imported ${file.name} · saved as your ${host.lang} project`;
      })
      .catch((error: unknown) => {
        status.textContent = error instanceof Error ? error.message : "Could not import this project.";
      })
      .finally(() => {
        importInput.value = "";
      });
  });
  toolbar.append(run, el("span", "", "Ctrl / ⌘ + Enter to run"), connect, share, importProject, importInput);
  const javaShortcutHint =
    host.lang === "java"
      ? el("p", "studio-java-shortcuts", `Java snippets: ${JAVA_SHORTCUTS} · Press Ctrl+Space for suggestions`)
      : null;
  const renderProjectQuest = () => {
    projectsPane.replaceChildren();
    projectsPane.append(
      el("span", "eyebrow", "MULTI-FILE PROJECTS"),
      el("h3", "", "Build something that works together"),
    );
    for (const quest of PROJECT_QUESTS) {
      const card = el("article", "studio-project-card");
      const progress = readProjectQuestProgress(host.adventureId ?? `guest-${host.lang}`, quest.id);
      card.append(
        el("h4", "", quest.title),
        el("p", "", quest.description),
        el("p", "studio-project-progress", `${progress} / ${quest.steps.length} project milestones`),
      );
      if (activeProjectQuest?.id === quest.id) {
        questStep = readProjectQuestProgress(host.adventureId ?? `guest-${host.lang}`, quest.id);
        const step = quest.steps[questStep];
        card.append(
          el(
            "strong",
            "",
            step ? `${questStep + 1}. ${step.title}` : "Project complete! You built a working multi-file feature.",
          ),
          ...(step ? [el("p", "", step.prompt), el("p", "studio-project-hint", `Hint: ${step.hint}`)] : []),
          button(
            "Open project files",
            () => {
              select(0);
              focusCode();
            },
            "button primary",
          ),
          button("Return to My project", () => leaveProjectQuest(), "studio-small-action"),
        );
      } else {
        card.append(
          button(
            progress ? "Resume project quest" : "Start project quest",
            () => launchProjectQuest(quest),
            "button primary",
          ),
        );
      }
      projectsPane.append(card);
    }
  };
  const launchProjectQuest = (quest: (typeof PROJECT_QUESTS)[number]) => {
    persistProject();
    if (connectedFolder) {
      personalFolder = connectedFolder;
      connectedFolder = null;
    }
    activeProjectQuest = quest;
    const adventureKey = host.adventureId ?? `guest-${host.lang}`;
    workspaceKey = projectQuestWorkspaceKey(adventureKey, quest.id);
    project = readWorkspace(workspaceKey, createProjectQuestWorkspace(quest, host.lang));
    entryPath = quest.entryPath[host.lang];
    if (!project.files[entryPath]) project = createProjectQuestWorkspace(quest, host.lang);
    project.entryPath = entryPath;
    activePath = entryPath;
    questStep = readProjectQuestProgress(adventureKey, quest.id);
    openFiles.splice(0, openFiles.length, activePath);
    selectedFolder = "src";
    expandedFolders.add("src");
    code.value = project.files[activePath] ?? "";
    monacoEditor?.setModel(activePath, code.value);
    code.setAttribute("aria-label", `Code editor: ${activePath}`);
    renderEditorTabs();
    renderTree();
    changed();
    renderProjectQuest();
    select(7);
  };
  const leaveProjectQuest = () => {
    if (!activeProjectQuest) return;
    persistProject();
    activeProjectQuest = null;
    workspaceKey = personalWorkspaceKey;
    project = readWorkspace(workspaceKey, createWorkspace(mainPath, initialCode));
    entryPath = project.entryPath ?? mainPath;
    if (!project.files[entryPath]) entryPath = mainPath;
    activePath = entryPath;
    openFiles.splice(0, openFiles.length, activePath);
    selectedFolder = parentPath(activePath);
    if (personalFolder) {
      connectedFolder = personalFolder;
      personalFolder = null;
    }
    code.value = project.files[activePath] ?? initialCode;
    monacoEditor?.setModel(activePath, code.value);
    code.setAttribute("aria-label", `Code editor: ${activePath}`);
    renderEditorTabs();
    renderTree();
    changed();
    renderProjectQuest();
    select(0);
  };
  renderProjectQuest();
  const createEntry = (kind: "file" | "folder") => {
    const form = el("form", "studio-create-form");
    const input = el("input", "studio-create-input");
    input.placeholder = kind === "file" ? "Player" : "models";
    input.setAttribute("aria-label", kind === "file" ? "New file name" : "New folder name");
    const submit = button("Create", () => {}, "studio-small-action");
    submit.type = "submit";
    form.append(
      input,
      submit,
      button("Cancel", () => form.remove(), "studio-small-action"),
    );
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const name = input.value.trim();
      if (!/^[\w.-]+$/.test(name) || name === "." || name === "..") {
        status.textContent = "Use a simple name without a slash.";
        return;
      }
      const raw = [selectedFolder, name].filter(Boolean).join("/");
      if (kind === "folder") {
        project.folders = [...new Set([...project.folders, raw])];
        selectedFolder = raw;
        let folder = raw;
        while (folder) {
          expandedFolders.add(folder);
          folder = parentPath(folder);
        }
        if (connectedFolder)
          void createLocalFolder(connectedFolder, raw).catch(() => {
            status.textContent = "Could not create that folder on your computer.";
          });
      } else {
        const extension = { javascript: ".js", typescript: ".ts", python: ".py", java: ".java" }[host.lang];
        const filePath = name.includes(".") ? raw : `${raw}${extension}`;
        if (project.files[filePath] !== undefined) {
          status.textContent = "That file already exists.";
          return;
        }
        project.folders = [
          ...new Set([
            ...project.folders,
            ...filePath
              .split("/")
              .slice(0, -1)
              .map((_, index, parents) => parents.slice(0, index + 1).join("/")),
          ]),
        ];
        project.files[filePath] = host.lang === "java" && filePath.endsWith(".java") ? javaClassTemplate(filePath) : "";
        if (connectedFolder)
          void writeLocalFile(connectedFolder, filePath, project.files[filePath] ?? "").catch(() => {
            status.textContent = "Could not create that file on your computer.";
          });
        openFile(filePath);
      }
      form.remove();
      persistProject();
    });
    fileTree.append(form);
    input.focus();
  };
  fileActions.append(folderTarget, addFile, addFolder);
  renderTree();
  renderEditorTabs();
  codeGrid.append(lines, monacoHost, code);
  const inlineConsole = el("section", "studio-inline-console");
  inlineConsole.setAttribute("aria-label", "Run results");
  inlineConsole.append(el("div", "studio-output-title", "OUTPUT"), output);
  workspace.append(editorHeader, codeGrid, toolbar);
  if (javaShortcutHint) workspace.append(javaShortcutHint);
  workspace.append(inlineConsole, feedback, debugHelp);
  editorPane.append(fileTree, explorerDivider, workspace);
  examplesPane.append(
    el("h3", "", "Start with something small"),
    el("p", "", "Examples use your selected language. Inserting one replaces the current practice draft."),
  );
  for (const [label, example] of [
    ["Say hello", HELLO[host.lang]],
    ["Change a battery value", batteryExample(host.lang, 4, 3)],
  ]) {
    if (!label || !example) continue;
    const card = el("article", "studio-example");
    card.append(
      el("h4", "", label),
      el("pre", "code-example", example),
      button(`Insert ${label.toLowerCase()} example`, () => {
        code.value = example;
        changed();
        select(0);
        focusCode();
      }),
    );
    examplesPane.append(card);
  }
  const debug = el("article", "studio-example studio-challenge");
  debug.append(
    el("span", "eyebrow", "DEBUG / NO PENALTY"),
    el("h4", "", "Repair the greeting"),
    el("p", "", "One variable name is misspelled. Load the challenge, fix it, then run your code to see the greeting."),
    el("pre", "code-example", DEBUG_GREETING[host.lang]),
    button("Load debugging challenge", () => {
      code.value = DEBUG_GREETING[host.lang];
      changed();
      select(0);
      focusCode();
    }),
  );
  examplesPane.append(debug);
  const prediction = el("article", "studio-example studio-challenge prediction-challenge"),
    predicted = el("input"),
    predictionFeedback = el("p", "studio-feedback");
  predicted.type = "text";
  predicted.inputMode = "numeric";
  predicted.maxLength = 6;
  predicted.placeholder = "Your predicted output";
  predicted.setAttribute("aria-label", "Predict the battery program output");
  const checkPrediction = button("Check prediction", () => {
    predictionFeedback.textContent =
      predicted.value.trim() === "7"
        ? "Correct! 4 + 3 prints 7. Now run the example and compare."
        : "Not yet. Trace the starting value and the amount added, or run the example to investigate.";
    predictionFeedback.className = `studio-feedback${predicted.value.trim() === "7" ? " success" : ""}`;
  });
  prediction.append(
    el("span", "eyebrow", "PREDICT / THEN RUN"),
    el("h4", "", "Where does the battery land?"),
    el("p", "", "The battery starts at 4 cells and receives 3 more. Predict the printed value before running it."),
    el("pre", "code-example", batteryExample(host.lang, 4, 3)),
    predicted,
    checkPrediction,
    predictionFeedback,
    button("Load prediction example", () => {
      code.value = batteryExample(host.lang, 4, 3);
      changed();
      select(0);
      focusCode();
    }),
  );
  examplesPane.append(prediction);
  consolePane.append(
    el("span", "eyebrow", "BROWSER CONSOLE"),
    consoleOutput,
    button("Back to editor", () => {
      select(0);
      focusCode();
    }),
  );
  missionsPane.append(
    el("span", "eyebrow", host.district.toUpperCase()),
    el("h3", "", `${host.name}'s mission log`),
    el(
      "p",
      "",
      `${host.hearts} hearts · ${host.gems} gems · ${host.missions.filter((mission) => mission.status === "complete").length}/8 complete`,
    ),
  );
  if (host.story) missionsPane.append(button(`Courier story - Help ${host.courierName}`, host.story, "button primary"));
  if (host.discovery) {
    const discovery = el("article", "studio-mission beacon-log");
    discovery.append(
      el("span", "eyebrow", "OPTIONAL DISCOVERY"),
      el("h4", "", host.discovery.title),
      el("p", "", host.discovery.status),
      button("Visit community beacon", host.discovery.open),
    );
    missionsPane.append(discovery);
  }
  if (host.finale) {
    const card = el("article", "studio-mission finale-log");
    card.append(
      el("span", "eyebrow", "DATA HUB RESTORATION"),
      el("h4", "", host.finale.title),
      el("p", "", host.finale.status),
      button("Open hub diagnostics", host.finale.open),
    );
    missionsPane.append(card);
  }
  for (const [i, mission] of host.missions.entries()) {
    const card = el("article", "studio-mission");
    card.append(
      el(
        "span",
        `mission-status ${mission.status}`,
        mission.status === "complete" ? "COMPLETE" : mission.status === "available" ? "READY TO REPAIR" : "LOCKED",
      ),
      el("h4", "", `${i + 1}. ${mission.title}`),
      el("p", "", mission.prompt),
    );
    if (mission.status === "available") card.append(button(`Work on ${mission.title}`, mission.open));
    missionsPane.append(card);
  }
  guidePane.append(
    el("span", "eyebrow", `${host.district.toUpperCase()} / GUIDE`),
    el("h3", "", "Understand the idea, then try it"),
  );
  for (const lesson of host.guide) {
    const card = el("article", "studio-lesson");
    card.append(el("h4", "", lesson.heading), el("p", "", lesson.body));
    if (lesson.code) card.append(el("pre", "code-example", lesson.code));
    guidePane.append(card);
  }
  const challengeDate = new Date().toISOString().slice(0, 10),
    challenge = dailyChallengeFor(challengeDate, host.lang),
    adventureKey = host.adventureId ?? `guest-${host.lang}`,
    completionKey = `codequest:daily:v1:${adventureKey}:${challengeDate}`,
    dailyDraftKey = `codequest:daily-draft:v1:${adventureKey}:${challengeDate}`,
    dailyCode = el("textarea", "daily-code"),
    dailyOutput = el("pre", "studio-output daily-output", "Run your solution to check today's challenge."),
    dailyFeedback = el("p", "studio-feedback daily-feedback");
  dailyCode.setAttribute("aria-label", "Daily challenge code");
  dailyOutput.setAttribute("aria-label", "Daily challenge output");
  dailyCode.spellcheck = false;
  dailyCode.autocapitalize = "off";
  dailyCode.maxLength = 64000;
  try {
    dailyCode.value = localStorage.getItem(dailyDraftKey) ?? challenge.starter;
    dailyFeedback.textContent =
      localStorage.getItem(completionKey) === "complete"
        ? "Already solved today · Your coding progress is safe."
        : "Daily practice is free. Run code as many times as you like.";
  } catch {
    dailyCode.value = challenge.starter;
    dailyFeedback.textContent = "Daily practice is free. This draft stays in the current session.";
  }
  dailyCode.addEventListener("input", () => {
    try {
      localStorage.setItem(dailyDraftKey, dailyCode.value);
    } catch {
      dailyFeedback.textContent = "Draft storage is full. You can keep practicing in this session.";
    }
  });
  const dailyHint = el("details", "daily-hint");
  dailyHint.append(el("summary", "", "Show a hint"), el("p", "", challenge.hint));
  const solution = el("details", "daily-solution");
  solution.append(el("summary", "", "Show one working solution"), el("pre", "code-example", challenge.solution));
  const dailyRun = button(
    "Run daily challenge",
    () => {
      if (runningDaily || !dailyPane.isConnected) return;
      void runDaily();
    },
    "button primary",
  );
  let runningDaily = false;
  const runDaily = async () => {
    runningDaily = true;
    dailyRun.disabled = true;
    dailyCode.disabled = true;
    dailyFeedback.textContent = "Running your daily challenge…";
    try {
      const result = await host.run(dailyCode.value),
        error = executionError(result);
      dailyOutput.textContent = [result.stdout || "(No output)", result.stderr, error?.message]
        .filter(Boolean)
        .join("\n");
      if (error) dailyFeedback.textContent = "Fix the error and run it again. This challenge never costs hearts.";
      else if (result.stdout.trim() === challenge.expected) {
        try {
          localStorage.setItem(completionKey, "complete");
        } catch {
          // A solved challenge still counts for this session if browser storage is full.
        }
        dailyFeedback.textContent = `Solved! ${challenge.skill} practice complete. No hearts or gems were spent.`;
      } else dailyFeedback.textContent = "Not quite yet. Compare the output with the goal, use a hint, and try again.";
    } catch {
      dailyFeedback.textContent = "The runtime could not run this challenge. Try again; no progress changed.";
    } finally {
      runningDaily = false;
      dailyRun.disabled = false;
      dailyCode.disabled = false;
    }
  };
  dailyPane.append(
    el("span", "eyebrow", `DAILY QUEST / ${challengeDate} UTC`),
    el("h3", "", challenge.title),
    el("p", "daily-skill", challenge.skill),
    el("p", "", challenge.prompt),
    dailyHint,
    dailyCode,
    dailyRun,
    el("span", "studio-output-title", "OUTPUT"),
    dailyOutput,
    dailyFeedback,
    solution,
  );
  let activeStudyId =
    STUDY_CURRICULUM.find(({ id }) => id === host.initialStudyTopicId)?.id ?? STUDY_CURRICULUM[0]?.id ?? "";
  const studyAdventureKey = host.adventureId ?? `guest-${host.lang}`;
  const renderStudyPath = () => {
    const completedTopics = readStudyProgress(studyAdventureKey);
    const totalTasks = readCompletedStudyTasks(studyAdventureKey);
    const topic = STUDY_CURRICULUM.find(({ id }) => id === activeStudyId) ?? STUDY_CURRICULUM[0];
    studyPane.replaceChildren();
    studyPane.append(
      el("span", "eyebrow", "YOUR CODING COURSE"),
      el("h3", "", "Study Path"),
      el(
        "p",
        "study-overview",
        `${totalTasks} / ${STUDY_TOTAL_TASKS} category tasks complete · ${completedTopics.length} / ${STUDY_CURRICULUM.length} bosses defeated · saves with this adventure`,
      ),
    );
    const layout = el("div", "study-layout");
    const navigation = el("nav", "study-topic-nav");
    const detail = el("section", "study-topic-detail");
    navigation.setAttribute("aria-label", "Study topics");
    for (const [index, item] of STUDY_CURRICULUM.entries()) {
      const isComplete = completedTopics.includes(item.id);
      const topicProgress = readStudyTaskProgress(studyAdventureKey, item.id);
      const isUnlocked = isStudyLevelUnlocked(studyAdventureKey, item.id, host.studyPrerequisiteComplete);
      const progressLabel = isComplete ? "✓" : topicProgress >= STUDY_TASKS_PER_TOPIC ? "BOSS" : `${topicProgress}/8`;
      const topicButton = button(
        `${progressLabel}  ${String((host.studyLevelOffset ?? 0) + index + 1).padStart(2, "0")}. ${item.title}`,
        () => {
          activeStudyId = item.id;
          renderStudyPath();
        },
        "study-topic-button" +
          (item.id === topic?.id ? " active" : "") +
          (isComplete ? " complete" : topicProgress > 0 ? " in-progress" : ""),
      );
      topicButton.disabled = !isUnlocked;
      if (!isUnlocked)
        topicButton.title =
          index === 0
            ? "Complete Abstraction Cloud to unlock this level."
            : "Defeat the previous category boss to unlock this level.";
      topicButton.setAttribute("aria-current", String(item.id === topic?.id));
      navigation.append(topicButton);
    }
    if (topic) {
      const taskProgress = readStudyTaskProgress(studyAdventureKey, topic.id);
      const isComplete = completedTopics.includes(topic.id);
      const topicIndex = STUDY_CURRICULUM.indexOf(topic);
      const isUnlocked = isStudyLevelUnlocked(studyAdventureKey, topic.id, host.studyPrerequisiteComplete);
      const levelNumber = (host.studyLevelOffset ?? 0) + topicIndex + 1;
      const topicNumber = String(levelNumber).padStart(2, "0");
      detail.append(
        el("span", "eyebrow", `LEVEL ${topicNumber} / ${(host.studyLevelOffset ?? 0) + STUDY_CURRICULUM.length}`),
        el("h4", "", topic.title),
        el("p", "", topic.lesson),
        el("p", "study-try-it", topic.tryIt),
        el("aside", "study-key-idea", topic.idea),
      );
      if (!isUnlocked) {
        detail.append(
          el("strong", "study-level-locked", "Level locked"),
          el(
            "p",
            "",
            topicIndex === 0
              ? "Complete the Abstraction Cloud boss to unlock level 8."
              : `Defeat the boss in level ${(host.studyLevelOffset ?? 0) + topicIndex} to unlock this category.`,
          ),
        );
      } else if (isComplete) {
        detail.append(
          el("strong", "study-level-complete", "Level cleared · 8/8 tasks + boss"),
          el(
            "p",
            "",
            "Your eight coding tasks and boss challenge are saved for this adventure. Choose another category or revisit this level.",
          ),
        );
        const portals = el("section", "study-portals");
        portals.append(
          el("span", "eyebrow", "LEVEL PORTALS"),
          el("p", "", "The boss opened these doors. Teleport to any unlocked category level."),
        );
        const portalDoors = el("div", "study-portal-doors");
        for (const [portalIndex, portalTopic] of STUDY_CURRICULUM.entries()) {
          if (!isStudyLevelUnlocked(studyAdventureKey, portalTopic.id, host.studyPrerequisiteComplete)) continue;
          const portalLevel = String((host.studyLevelOffset ?? 0) + portalIndex + 1).padStart(2, "0");
          portalDoors.append(
            button(
              `↗ Teleport · ${portalLevel} · ${portalTopic.title}`,
              () => {
                activeStudyId = portalTopic.id;
                renderStudyPath();
              },
              "study-portal-door",
            ),
          );
        }
        portals.append(portalDoors);
        detail.append(portals);
      } else {
        const isBossChallenge = taskProgress >= STUDY_TASKS_PER_TOPIC;
        const levelIndex = isBossChallenge ? STUDY_TASKS_PER_TOPIC : taskProgress;
        const task = isBossChallenge ? studyBossFor(topic, host.lang) : studyTaskFor(topic, host.lang, levelIndex);
        const draftIndex = isBossChallenge ? "boss" : String(levelIndex);
        const studyDraftKey = `codequest:study-draft:v2:${studyAdventureKey}:${host.lang}:${topic.id}:${draftIndex}`;
        const taskPrompt = el("p", "study-try-it", task.prompt);
        const editorLabel = el(
          "label",
          "editor-label",
          `${host.lang} code · ${isBossChallenge ? "face the level boss" : "make the requested change"}`,
        );
        const sample = el("textarea", "study-example-editor");
        const predictionLabel = el("label", "editor-label", "Your predicted output");
        const prediction = el("input", "study-prediction");
        const resultOutput = el("pre", "studio-output study-result-output", "Run your code to check this challenge.");
        const resultFeedback = el("p", "studio-feedback study-task-feedback");
        const runTaskButton = button(
          isBossChallenge ? "Run and challenge boss" : "Run and check task",
          () => void runStudyTask(),
          "button primary",
        );
        const nextTaskButton = button(
          isBossChallenge ? "Open level portals" : "Next task",
          () => renderStudyPath(),
          "button primary",
        );
        sample.rows = 7;
        sample.spellcheck = false;
        sample.autocapitalize = "off";
        sample.id = `study-example-${topic.id}`;
        sample.setAttribute(
          "aria-label",
          isBossChallenge ? `${topic.title} boss code` : `${topic.title} ${host.lang} task ${levelIndex + 1} code`,
        );
        editorLabel.htmlFor = sample.id;
        prediction.type = "text";
        prediction.autocomplete = "off";
        prediction.id = `study-prediction-${topic.id}`;
        prediction.setAttribute(
          "aria-label",
          isBossChallenge
            ? `Boss predicted output for ${topic.title}`
            : `Predicted output for ${topic.title} task ${levelIndex + 1}`,
        );
        predictionLabel.htmlFor = prediction.id;
        nextTaskButton.hidden = true;
        if (!isBossChallenge && levelIndex === STUDY_TASKS_PER_TOPIC - 1)
          nextTaskButton.textContent = "Challenge level boss";
        try {
          sample.value = localStorage.getItem(studyDraftKey) ?? task.starter;
        } catch {
          sample.value = task.starter;
        }
        sample.addEventListener("input", () => {
          try {
            localStorage.setItem(studyDraftKey, sample.value);
          } catch {
            resultFeedback.textContent = "This example stays available for the current session.";
          }
        });
        resultFeedback.setAttribute("role", "status");
        const runStudyTask = async () => {
          runTaskButton.disabled = true;
          sample.disabled = true;
          prediction.disabled = true;
          resultFeedback.textContent = `Running ${host.lang} · no hearts or gems are used.`;
          try {
            const result = await host.run(sample.value);
            const error = executionError(result);
            resultOutput.textContent = [result.stdout || "(No output)", result.stderr, error?.message]
              .filter(Boolean)
              .join("\n");
            if (error) {
              resultFeedback.textContent = `${beginnerHint(error.message, host.lang)} Practice is free; fix it and try again.`;
            } else if (result.stdout.trim() === task.output && prediction.value.trim() === task.output) {
              if (isBossChallenge) {
                if (!saveStudyBossProgress(studyAdventureKey, topic.id)) {
                  resultFeedback.textContent =
                    "Correct! Browser storage is unavailable, so the boss result could not be saved.";
                } else {
                  const levelButton = studyPane.querySelector<HTMLButtonElement>(".study-topic-button.active");
                  const overview = studyPane.querySelector<HTMLElement>(".study-overview");
                  if (levelButton) {
                    levelButton.classList.remove("in-progress");
                    levelButton.classList.add("complete");
                    levelButton.textContent = `✓  ${topicNumber}. ${topic.title}`;
                  }
                  if (overview) {
                    overview.textContent = `${readCompletedStudyTasks(studyAdventureKey)} / ${STUDY_TOTAL_TASKS} category tasks complete · ${readStudyProgress(studyAdventureKey).length} / ${STUDY_CURRICULUM.length} bosses defeated · saves with this adventure`;
                  }
                  resultFeedback.textContent = "Boss defeated! Your level is complete.";
                  nextTaskButton.hidden = false;
                }
              } else if (!saveStudyTaskProgress(studyAdventureKey, topic.id, levelIndex + 1)) {
                resultFeedback.textContent =
                  "Correct! Browser storage is unavailable, so the checkpoint could not be saved.";
              } else {
                const currentLevelProgress = readStudyTaskProgress(studyAdventureKey, topic.id);
                const levelButton = studyPane.querySelector<HTMLButtonElement>(".study-topic-button.active");
                const overview = studyPane.querySelector<HTMLElement>(".study-overview");
                if (levelButton) {
                  levelButton.classList.add("in-progress");
                  levelButton.textContent = `${currentLevelProgress >= STUDY_TASKS_PER_TOPIC ? "BOSS" : `${currentLevelProgress}/8`}  ${topicNumber}. ${topic.title}`;
                }
                if (overview) {
                  overview.textContent = `${readCompletedStudyTasks(studyAdventureKey)} / ${STUDY_TOTAL_TASKS} category tasks complete · ${readStudyProgress(studyAdventureKey).length} / ${STUDY_CURRICULUM.length} bosses defeated · saves with this adventure`;
                }
                resultFeedback.textContent = `Task ${levelIndex + 1}/8 complete. Your code and prediction match.`;
                nextTaskButton.hidden = false;
              }
            } else if (result.stdout.trim() === task.output) {
              resultFeedback.textContent =
                "Your code produced the right result. Your prediction was different; review it and run again.";
            } else {
              resultFeedback.textContent =
                "It ran successfully. Check your code change and predicted output, then try again.";
            }
          } catch {
            resultFeedback.textContent =
              "The runner could not start. Try again; no progress or game resources were spent.";
          } finally {
            runTaskButton.disabled = false;
            sample.disabled = false;
            prediction.disabled = false;
          }
        };
        detail.append(
          el(
            "span",
            "eyebrow",
            isBossChallenge ? "LEVEL BOSS" : `TASK ${levelIndex + 1} / 8 · ${taskProgress} complete`,
          ),
          taskPrompt,
          editorLabel,
          sample,
          predictionLabel,
          prediction,
          runTaskButton,
          nextTaskButton,
          el("span", "studio-output-title", "OUTPUT"),
          resultOutput,
          resultFeedback,
        );
      }
    }
    layout.append(navigation, detail);
    studyPane.append(layout);
  };
  renderStudyPath();
  body.append(...panes);
  const bottom = el("div", "studio-status");
  bottom.append(status, el("span", "", "FREE PRACTICE · AUTO SAVE"));
  studio.append(title, tabs, body, bottom);
  panel.append(studio);
  select(host.initialStudyTopicId ? 6 : 0);
  const close = presentTabletOpening(panel, host.kind, host.name, host.focusCamera, host.animate);
  return () => {
    window.clearTimeout(saveTimer);
    window.removeEventListener("resize", mobileExplorer);
    if (connectedFolder) void writeLocalFile(connectedFolder, activePath, code.value);
    const closingEditor = monacoEditor;
    monacoEditor = null;
    window.setTimeout(() => closingEditor?.dispose(), 250);
    close();
  };
}
