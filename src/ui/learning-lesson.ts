import type { LessonProgress } from "../core/journey";
import { gameAudio } from "../game/audio";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { beginnerHint } from "./debug-guidance";
import { button, el } from "./dom";
import "./first-program.css";

export type LessonContent = {
  id: string;
  title: string;
  story: string;
  concept: string;
  goal: string;
  clues: readonly string[];
};
export type LessonContext = {
  id: string;
  work: HTMLElement;
  status: HTMLElement;
  progress: LessonProgress;
  save(): void;
  complete(): void;
  execute(codes: readonly string[], trigger: HTMLButtonElement, apply: (results: RunResult[]) => void): Promise<void>;
};
export function openLearningLesson(host: {
  lang: Lang;
  progress: LessonProgress;
  lessons: readonly LessonContent[];
  scene: HTMLElement;
  panel(): HTMLElement;
  save(progress: LessonProgress): boolean;
  run(code: string): Promise<RunResult>;
  cancel(): void;
  leave(): void;
  render(context: LessonContext): void;
  finished?(work: HTMLElement): void;
}): () => void {
  const panel = host.panel();
  panel.classList.add("zero-shell");
  panel.parentElement?.classList.add("zero-overlay");
  const count = el("span"),
    saved = el("span"),
    banner = el("div", "zero-banner");
  banner.append(el("span", "eyebrow", host.lang.toUpperCase()), count, saved);
  const nav = el("nav", "zero-steps"),
    layout = el("div", "zero-layout"),
    world = el("section", "zero-world"),
    work = el("section", "zero-work");
  nav.setAttribute("aria-label", "Learning chapter lessons");
  const story = el("p", "zero-goal"),
    concept = el("p", "zero-concept"),
    status = el("p", "zero-feedback");
  status.setAttribute("role", "status");
  world.append(host.scene, story, concept);
  layout.append(world, work);
  const footer = el("nav", "zero-footer"),
    back = button("Back", () => go(progress.step - 1)),
    next = button("Next lesson →", () => go(progress.step + 1), "button primary");
  footer.append(back, button("Save & explore city", host.leave), next);
  panel.append(banner, nav, layout, footer);
  let progress = structuredClone(host.progress),
    alive = true,
    busy = false,
    epoch = 0;
  const save = () => {
    if (alive)
      saved.textContent = host.save(structuredClone(progress))
        ? "Saved with your adventure · included in backups"
        : "Saving unavailable · download an adventure backup before leaving";
  };
  const sync = () => {
    count.textContent = `${progress.completed.length} / ${host.lessons.length} discoveries`;
    nav.replaceChildren(
      ...host.lessons.map((lesson, i) => {
        const tab = button(
          `${progress.completed.includes(lesson.id) ? "✓" : i + 1} ${lesson.title}`,
          () => go(i),
          "zero-step",
        );
        tab.disabled = busy || i > progress.completed.length;
        tab.setAttribute("aria-current", i === progress.step ? "step" : "false");
        return tab;
      }),
    );
    const current = nav.children[progress.step] as HTMLElement;
    nav.scrollLeft = Math.max(0, current.offsetLeft - (nav.clientWidth - current.clientWidth) / 2);
    back.disabled = busy || !progress.step;
    next.disabled = busy || !progress.completed.includes(host.lessons[progress.step].id);
    next.hidden = progress.step === host.lessons.length - 1;
  };
  function complete() {
    const id = host.lessons[progress.step].id;
    if (host.lessons[progress.completed.length]?.id === id) {
      progress.completed.push(id);
      progress.status = progress.completed.length === host.lessons.length ? "complete" : "in-progress";
      gameAudio.play(progress.status === "complete" ? "victory" : "beacon");
      save();
    }
    sync();
    if (progress.status === "complete" && !work.querySelector(".lesson-finished")) {
      const finish = el("div", "lesson-finished");
      work.append(finish);
      host.finished?.(finish);
    }
  }
  function go(index: number) {
    if (busy || index < 0 || index >= host.lessons.length || index > progress.completed.length) return;
    epoch++;
    progress.step = index;
    save();
    render();
  }
  function render() {
    const lesson = host.lessons[progress.step];
    panel.dataset.lesson = lesson.id;
    story.textContent = lesson.story;
    concept.textContent = lesson.concept;
    work.replaceChildren(el("h3", "", lesson.title), el("p", "zero-goal", lesson.goal));
    status.textContent = "Experiment freely. No countdown, hearts or gems spent.";
    host.render({ id: lesson.id, work, status, progress, save, complete, execute });
    const hint = el("p", "zero-hint");
    let clue = 0;
    work.append(
      status,
      button("Ask for a clue", () => {
        hint.textContent = lesson.clues[Math.min(clue++, lesson.clues.length - 1)];
      }),
      hint,
    );
    if (progress.status === "complete" && progress.step === host.lessons.length - 1) complete();
    sync();
  }
  async function execute(codes: readonly string[], trigger: HTMLButtonElement, apply: (results: RunResult[]) => void) {
    if (busy || !alive) return;
    busy = true;
    const token = epoch;
    const controls = [
      ...work.querySelectorAll<HTMLInputElement | HTMLButtonElement | HTMLTextAreaElement | HTMLSelectElement>(
        "button,input,textarea,select",
      ),
    ].map((node) => [node, node.disabled] as const);
    for (const [node] of controls) node.disabled = true;
    trigger.disabled = true;
    sync();
    let output = work.querySelector<HTMLElement>(".lesson-output");
    if (!output) {
      output = el("pre", "zero-output lesson-output");
      output.setAttribute("aria-label", "Learning output");
      work.insertBefore(output, status);
    }
    output.textContent = "Starting the language runtime…";
    const results: RunResult[] = [];
    try {
      for (const [i, code] of codes.entries()) {
        status.textContent = `Running check ${i + 1} / ${codes.length}…`;
        const result = await host.run(code);
        if (!alive || token !== epoch) return;
        results.push(result);
        const error = executionError(result);
        output.textContent = results
          .map((r, n) => `Check ${n + 1}:\n${r.stdout || "(No output)"}${r.stderr ? `\n${r.stderr}` : ""}`)
          .join("\n\n")
          .slice(0, 16000);
        if (error) {
          output.textContent += `\n${error.message}`;
          status.textContent = `${beginnerHint(error.message, host.lang)} Edit and retry; no hearts were spent.`;
          return;
        }
      }
      apply(results);
    } catch {
      if (alive && token === epoch) status.textContent = "The runtime couldn't finish. Retry or save and return later.";
    } finally {
      if (alive && token === epoch) {
        busy = false;
        for (const [node, disabled] of controls) node.disabled = disabled;
        sync();
      }
    }
  }
  render();
  return () => {
    alive = false;
    epoch++;
    if (busy) host.cancel();
  };
}
