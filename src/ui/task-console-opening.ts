import { button, el } from "./dom";

/** A short mission-console boot sequence, distinct from the developer wrist tablet. */
export function presentTaskConsoleOpening(
  panel: HTMLElement,
  task: Readonly<{ id: string; title: string; prompt: string }>,
  developer: string,
): () => void {
  const overlay = panel.parentElement;
  let timer = 0;
  let disposed = false;
  let ready = false;
  const reveal = () => {
    if (disposed || ready) return;
    ready = true;
    window.clearTimeout(timer);
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
  opening.setAttribute("role", "dialog");
  opening.setAttribute("aria-modal", "true");
  opening.setAttribute("aria-label", `Connecting to ${task.title}`);
  const frame = el("div", "task-console-frame");
  const topbar = el("div", "task-console-topbar");
  topbar.append(
    el("span", "task-console-lights", "● ● ●"),
    el("span", "", `CITY NODE / ${task.id.toUpperCase()}`),
    el("span", "task-console-live", "LIVE LINK"),
  );
  const screen = el("div", "task-console-screen");
  screen.append(
    el("span", "eyebrow", `${developer.toUpperCase()} / MISSION TERMINAL`),
    el("h2", "", task.title),
    el("p", "task-console-prompt", task.prompt),
    el("p", "task-console-command", `> opening task workspace ${task.id}`),
    el("div", "task-console-progress"),
  );
  const controls = el("div", "task-console-controls");
  controls.append(el("span", "", "CONNECTING TO THE CITY CODE CONSOLE"));
  const skip = button("Open task now", reveal, "button primary");
  controls.append(skip);
  frame.append(topbar, screen, controls);
  opening.append(frame);
  overlay?.append(opening);
  skip.focus();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) reveal();
  else timer = window.setTimeout(reveal, 1350);

  return () => {
    if (disposed) return;
    disposed = true;
    window.clearTimeout(timer);
    opening.remove();
    panel.inert = false;
    panel.removeAttribute("aria-hidden");
    overlay?.classList.remove("task-console-overlay");
  };
}
