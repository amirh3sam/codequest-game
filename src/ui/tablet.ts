import { batteryExample } from "../content/drone-pilot";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";

type TabletHost = {
  lang: Lang;
  name: string;
  hero: HTMLCanvasElement;
  panel(title: string, subtitle: string, wide: boolean): HTMLElement;
  run(code: string): Promise<RunResult>;
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
  java: 'public class Main {\n    public static void main(String[] args) {\n        String message = "Hello, CodeQuest!";\n        System.out.println(message);\n    }\n}',
};

/** A personal, ungraded workspace. No mission or reward APIs are available here. */
export function openTablet(host: TabletHost): void {
  const panel = host.panel("Developer tablet", "Your own coding space · T to open · Esc to put away", true);
  panel.classList.add("tablet-shell");
  const scene = el("div", "tablet-reveal");
  scene.setAttribute("aria-hidden", "true");
  host.hero.classList.add("tablet-hero");
  scene.append(host.hero, el("span", "tablet-in-hand"));
  panel.append(scene);
  const studio = el("div", "tablet-studio");
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
    consolePane = el("div", "studio-console");
  const panes = [editorPane, examplesPane, consolePane],
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
  for (const [i, label] of [FILES[host.lang], "Examples", "Console"].entries()) {
    const tab = button(label, () => select(i), "studio-tab");
    tab.id = `tablet-tab-${i}`;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", `tablet-pane-${i}`);
    tab.addEventListener("keydown", (event) => {
      const next =
        event.key === "ArrowRight"
          ? (i + 1) % 3
          : event.key === "ArrowLeft"
            ? (i + 2) % 3
            : event.key === "Home"
              ? 0
              : event.key === "End"
                ? 2
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
  fileTree.append(
    el("span", "eyebrow", "EXPLORER"),
    el("strong", "", "YOUR PLAYGROUND"),
    el("span", "studio-file", `{ } ${FILES[host.lang]}`),
    el("p", "", "Experiment here. Your missions, hearts and gems stay safe."),
  );
  const workspace = el("div", "studio-workspace"),
    codeGrid = el("div", "studio-code-grid");
  const lines = el("pre", "studio-lines"),
    code = el("textarea", "studio-code");
  lines.setAttribute("aria-hidden", "true");
  code.setAttribute("aria-label", "Practice code");
  code.spellcheck = false;
  code.autocapitalize = "off";
  code.maxLength = 64000;
  const key = `codequest:tablet:v1:${host.lang}`;
  try {
    code.value = localStorage.getItem(key) ?? HELLO[host.lang];
  } catch {
    code.value = HELLO[host.lang];
  }
  const status = el("span", "studio-save", "Draft stays on this device");
  const changed = () => {
    lines.textContent = Array.from({ length: code.value.split("\n").length }, (_, i) => i + 1).join("\n");
    try {
      localStorage.setItem(key, code.value);
      status.textContent = "Draft saved on this device";
    } catch {
      status.textContent = "Draft available for this session";
    }
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
    feedback.textContent = `Running ${host.lang}…`;
    try {
      const result = await host.run(code.value);
      if (!panel.isConnected) return;
      const error = executionError(result);
      output.textContent = [result.stdout || "(No output)", result.stderr, error?.message].filter(Boolean).join("\n");
      feedback.textContent = error
        ? "Check the console and try again. Practice never costs hearts."
        : "Run complete · No hearts or gems spent";
      select(2);
    } catch {
      if (panel.isConnected) feedback.textContent = "Couldn't run this program. Try again; no progress changed.";
    } finally {
      if (panel.isConnected) {
        running = false;
        run.disabled = false;
        code.disabled = false;
      }
    }
  };
  const toolbar = el("div", "studio-toolbar");
  toolbar.append(run, el("span", "", "Ctrl / ⌘ + Enter to run"));
  codeGrid.append(lines, code);
  workspace.append(codeGrid);
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
        code.focus();
      }),
    );
    examplesPane.append(card);
  }
  consolePane.append(
    el("span", "eyebrow", "BROWSER CONSOLE"),
    output,
    button("Back to editor", () => {
      select(0);
      code.focus();
    }),
  );
  body.append(...panes);
  const bottom = el("div", "studio-status");
  bottom.append(status, el("span", "", "FREE PRACTICE · AUTO SAVE"));
  studio.append(title, tabs, body, toolbar, feedback, bottom);
  panel.append(studio);
  select(0);
}
