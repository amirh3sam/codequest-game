import { dailyChallengeFor } from "../content/daily-challenge";
import { batteryExample } from "../content/drone-pilot";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";
import {
  chooseLocalFolder,
  createLocalFolder,
  createWorkspace,
  deleteWorkspaceEntry,
  type LocalDirectoryHandle,
  readWorkspace,
  removeLocalEntry,
  renameLocalEntry,
  renameWorkspaceEntry,
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
    dailyPane = el("div", "studio-daily");
  const panes = [editorPane, examplesPane, consolePane, missionsPane, guidePane, dailyPane],
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
  for (const [i, label] of ["Code", "Examples", "Console", "Missions", "Guide", "Daily Quest"].entries()) {
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
  const workspaceKey = `codequest:workspace:v1:${host.adventureId ?? `guest-${host.lang}`}`;
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
  const renderEditorTabs = () => {
    editorHeader.replaceChildren(
      ...openFiles.map((path) => {
        const basename = path.split("/").at(-1) ?? path;
        const tab = button(
          basename,
          () => openFile(path),
          `studio-open-file-tab${activePath === path ? " active" : ""}`,
        );
        tab.title = path;
        return tab;
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
      const targetPath = activePath;
      const contents = code.value;
      window.clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => {
        void writeLocalFile(connectedFolder as LocalDirectoryHandle, targetPath, contents)
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
      const projectSources = Object.fromEntries(
        Object.entries(project.files).filter(([path]) => path.endsWith(extension) && path !== entryPath),
      );
      const result = await host.run(project.files[entryPath] ?? code.value, projectSources, entryPath);
      if (!panel.isConnected) return;
      const error = executionError(result);
      output.textContent = [result.stdout || "(No output)", result.stderr, error?.message].filter(Boolean).join("\n");
      consoleOutput.textContent = output.textContent;
      feedback.textContent = error
        ? "Check the console and try again. Practice never costs hearts."
        : "Run complete · No hearts or gems spent";
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
  toolbar.append(run, el("span", "", "Ctrl / ⌘ + Enter to run"), connect);
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
        project.files[filePath] = "";
        if (connectedFolder)
          void writeLocalFile(connectedFolder, filePath, "").catch(() => {
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
  workspace.append(editorHeader, codeGrid, toolbar, inlineConsole, feedback);
  editorPane.append(fileTree, workspace);
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
  body.append(...panes);
  const bottom = el("div", "studio-status");
  bottom.append(status, el("span", "", "FREE PRACTICE · AUTO SAVE"));
  studio.append(title, tabs, body, bottom);
  panel.append(studio);
  select(0);
  const close = presentTabletOpening(panel, host.kind, host.name, host.focusCamera, host.animate);
  return () => {
    window.clearTimeout(saveTimer);
    if (connectedFolder) void writeLocalFile(connectedFolder, activePath, code.value);
    const closingEditor = monacoEditor;
    monacoEditor = null;
    window.setTimeout(() => closingEditor?.dispose(), 250);
    close();
  };
}
