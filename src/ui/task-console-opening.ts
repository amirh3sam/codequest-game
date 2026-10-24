import type { Lang } from "../runners/types";
import { button, el } from "./dom";

/** A short mission-console boot sequence, distinct from the developer wrist tablet. */
export function presentTaskConsoleOpening(
  panel: HTMLElement,
  task: Readonly<{ id: string; title: string; prompt: string }>,
  developer: string,
  context: { lang: Lang; district: string },
): () => void {
  const overlay = panel.parentElement;
  const timers: number[] = [];
  let disposed = false;
  let ready = false;
  const reveal = () => {
    if (disposed || ready) return;
    ready = true;
    for (const timer of timers) window.clearTimeout(timer);
    document.removeEventListener("keydown", shortcut);
    opening.remove();
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    panel.classList.remove("task-console-waiting");
    panel.dataset.taskConsoleStage = "ready";
    panel.querySelector<HTMLTextAreaElement>(".code-editor")?.focus();
  };

  panel.classList.add("task-console-waiting");
  panel.inert = true;
  panel.setAttribute("aria-hidden", "true");
  panel.dataset.taskConsoleStage = "connecting";
  overlay?.classList.add("task-console-overlay");

  const opening = el("section", "task-console-opening");
  opening.dataset.phase = "power";
  opening.dataset.language = context.lang;
  opening.setAttribute("role", "dialog");
  opening.setAttribute("aria-modal", "true");
  opening.setAttribute("aria-label", `Connecting to ${task.title}`);
  const rig = el("div", "task-console-rig");
  const frame = el("div", "task-console-frame");
  const hardware = el("div", "task-monitor-hardware");
  hardware.setAttribute("aria-hidden", "true");
  hardware.append(el("span", "task-monitor-camera"), el("span", "task-monitor-vents"));
  const topbar = el("div", "task-console-topbar");
  topbar.append(
    el("span", "task-console-lights", "● CITY OS"),
    el("span", "task-monitor-node", task.id.toUpperCase()),
    el("span", "task-console-live", context.lang.toUpperCase()),
  );
  const screen = el("div", "task-console-screen");
  const brief = el("div", "task-monitor-brief");
  brief.append(
    el("span", "eyebrow", `${developer.toUpperCase()} / MISSION TERMINAL`),
    el("h2", "", task.title),
    el("p", "task-console-prompt", task.prompt),
    el("span", "task-monitor-district", context.district),
  );
  const preview = el("div", "task-monitor-preview");
  preview.setAttribute("aria-hidden", "true");
  const filename = { java: "Main.java", javascript: "mission.js", typescript: "mission.ts", python: "mission.py" }[
    context.lang
  ];
  preview.append(el("div", "task-monitor-file", `‹/›  ${filename}`));
  const lines = el("div", "task-monitor-code");
  for (let n = 0; n < 5; n++) {
    const line = el("div", "task-monitor-code-line");
    line.append(el("span", "", String(n + 1)), el("i"), el("b"));
    lines.append(line);
  }
  const output = el("div", "task-monitor-output");
  output.append(el("span", "", "OUTPUT"), el("p", "", "> Waiting for your program"));
  preview.append(lines, output);
  screen.append(brief, preview);
  const boot = el("div", "task-monitor-boot");
  const status = el("p", "task-console-command", "> Powering the terminal display");
  status.setAttribute("role", "status");
  const progress = el("div", "task-console-progress");
  progress.setAttribute("role", "progressbar");
  progress.setAttribute("aria-label", "Preparing mission display");
  progress.setAttribute("aria-valuemin", "0");
  progress.setAttribute("aria-valuemax", "100");
  progress.setAttribute("aria-valuenow", "10");
  progress.style.setProperty("--boot-progress", "10%");
  const stages = el("div", "task-monitor-stages");
  for (const label of ["01 / DISPLAY", "02 / CITY NODE", "03 / MISSION"]) stages.append(el("span", "", label));
  stages.children[0]?.setAttribute("data-active", "true");
  boot.append(status, progress, stages);
  const chin = el("div", "task-monitor-chin");
  chin.append(el("span", "", "CQ / CITY TERMINAL"), el("span", "task-monitor-power", "●"));
  const controls = el("div", "task-console-controls");
  controls.append(el("span", "", "ENTER · OPEN WORKSPACE     ESC · RETURN TO CITY"));
  const skip = button("Open task now", reveal, "button primary");
  controls.append(skip);
  frame.append(hardware, topbar, screen, boot, chin);
  const stand = el("div", "task-monitor-stand");
  const keyboard = el("div", "task-monitor-keyboard");
  stand.setAttribute("aria-hidden", "true");
  keyboard.setAttribute("aria-hidden", "true");
  for (let n = 0; n < 38; n++) keyboard.append(el("i", "task-monitor-key"));
  rig.append(frame, stand, keyboard, controls);
  opening.append(rig);
  overlay?.append(opening);
  skip.focus();

  const shortcut = (event: KeyboardEvent) => {
    if (event.code !== "Enter" || event.repeat) return;
    event.preventDefault();
    reveal();
  };
  document.addEventListener("keydown", shortcut);
  const phase = (name: string, text: string, amount: number, index: number) => {
    if (disposed || ready) return;
    opening.dataset.phase = name;
    status.textContent = `> ${text}`;
    progress.style.setProperty("--boot-progress", `${amount}%`);
    progress.setAttribute("aria-valuenow", String(amount));
    for (const [n, step] of [...stages.children].entries()) step.setAttribute("data-active", String(n <= index));
  };

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) reveal();
  else {
    timers.push(window.setTimeout(() => phase("link", "Opening your district terminal", 42, 1), 650));
    timers.push(window.setTimeout(() => phase("mission", "Preparing your mission workspace", 78, 2), 1400));
    timers.push(window.setTimeout(() => phase("ready", "Mission ready — make something work", 100, 2), 2250));
    timers.push(window.setTimeout(reveal, 2800));
  }

  return () => {
    if (disposed) return;
    disposed = true;
    for (const timer of timers) window.clearTimeout(timer);
    document.removeEventListener("keydown", shortcut);
    opening.remove();
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    panel.classList.remove("task-console-waiting");
    overlay?.classList.remove("task-console-overlay");
  };
}
