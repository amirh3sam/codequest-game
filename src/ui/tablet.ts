import { batteryExample } from "../content/drone-pilot";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";
import { presentTabletOpening } from "./tablet-opening";

type TabletHost = {
  lang: Lang;
  name: string;
  kind: "boy" | "girl";
  adventureId?: string;
  animate: boolean;
  focusCamera(): () => void;
  panel(title: string, subtitle: string, wide: boolean): HTMLElement;
  run(code: string): Promise<RunResult>;
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
  java: 'public class Main {\n    public static void main(String[] args) {\n        String message = "Hello, CodeQuest!";\n        System.out.println(message);\n    }\n}',
};

/** Practice stays ungraded; mission buttons enter the game's existing task flow. */
export function openTablet(host: TabletHost): () => void {
  const panel = host.panel("Developer tablet", "Your own coding space · T to open · Esc to put away", true);
  panel.classList.add("tablet-shell");
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
    consolePane = el("div", "studio-console"),
    missionsPane = el("div", "studio-missions"),
    guidePane = el("div", "studio-guide");
  const panes = [editorPane, examplesPane, consolePane, missionsPane, guidePane],
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
  for (const [i, label] of [FILES[host.lang], "Examples", "Console", "Missions", "Guide"].entries()) {
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
  const legacyKey = `codequest:tablet:v1:${host.lang}`;
  const key = host.adventureId ? `codequest:tablet:v2:${host.adventureId}` : legacyKey;
  try {
    code.value =
      localStorage.getItem(key) ??
      (host.adventureId?.startsWith("legacy-") ? localStorage.getItem(legacyKey) : null) ??
      HELLO[host.lang];
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
    feedback.textContent = `Running ${host.lang}…`;
    try {
      const result = await host.run(code.value);
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
      }
    }
  };
  const toolbar = el("div", "studio-toolbar");
  toolbar.append(run, el("span", "", "Ctrl / ⌘ + Enter to run"));
  codeGrid.append(lines, code);
  const inlineConsole = el("section", "studio-inline-console");
  inlineConsole.setAttribute("aria-label", "Run results");
  inlineConsole.append(el("div", "studio-output-title", "OUTPUT"), output);
  workspace.append(codeGrid, toolbar, inlineConsole, feedback);
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
    consoleOutput,
    button("Back to editor", () => {
      select(0);
      code.focus();
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
  if (host.story) missionsPane.append(button("Courier story · Help Kai", host.story, "button primary"));
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
  body.append(...panes);
  const bottom = el("div", "studio-status");
  bottom.append(status, el("span", "", "FREE PRACTICE · AUTO SAVE"));
  studio.append(title, tabs, body, bottom);
  panel.append(studio);
  select(0);
  return presentTabletOpening(panel, host.kind, host.name, host.focusCamera, host.animate);
}
