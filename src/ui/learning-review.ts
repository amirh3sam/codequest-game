import { newReview, type ReviewRecord, type ReviewTopic, reviewLesson } from "../core/learning-review";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { beginnerHint } from "./debug-guidance";
import { button, el } from "./dom";
import "./learning-review.css";

export function openLearningReview(host: {
  lang: Lang;
  topic: ReviewTopic;
  progress?: ReviewRecord;
  panel(title: string): HTMLElement;
  save(progress: ReviewRecord): boolean;
  run(code: string): Promise<RunResult>;
  miss(): void;
  complete(): void;
  next(): void;
  nextLabel?(): string;
  hub(): void;
}): () => void {
  const progress = structuredClone(host.progress ?? newReview()),
    lesson = reviewLesson(host.topic, progress.variant, host.lang),
    panel = host.panel(lesson.title);
  panel.classList.add("review-panel");
  const scene = el("div", `review-scene review-${host.topic}`),
    sky = el("div", "review-sky"),
    building = el("div", "review-building"),
    fan = el("div", "review-fan"),
    cart = el("div", "review-cart"),
    lamps = el("div", "review-lamps"),
    signal = el("p", "review-signal", "Run your repair to see its real result.");
  building.append(
    el(
      "span",
      "",
      host.topic === "variables" ? "SUPPLY DEPOT" : host.topic === "conditions" ? "COOLING CONTROL" : "CITY FESTIVAL",
    ),
    fan,
  );
  cart.append(el("span", "", "PARCELS"), el("strong", "", "?"));
  for (let i = 0; i < 8; i++) lamps.append(el("i"));
  scene.append(sky, building, cart, lamps, signal);
  scene.setAttribute("aria-label", `${lesson.title}: visual result of your program`);
  const status = el("p", "zero-feedback"),
    results = el("div", "review-results"),
    output = el("pre", "zero-output"),
    code = el("textarea", "zero-code");
  status.setAttribute("role", "status");
  output.setAttribute("aria-label", "Review output");
  code.setAttribute("aria-label", "Review repair code");
  code.spellcheck = false;
  code.rows = host.topic === "loops" ? 6 : 3;
  code.maxLength = 16000;
  code.value = progress.draft ?? lesson.starter;
  const full = el("details", "zero-full-program"),
    source = el("pre", "zero-code-preview");
  full.append(el("summary", "", "See the full test programs"), source);
  const preview = () => {
    source.textContent = lesson
      .cases(code.value)
      .map((c) => `${host.lang === "python" ? "#" : "//"} ${c.label}\n${c.code}`)
      .join("\n\n");
  };
  preview();
  let alive = true,
    busy = false,
    complete = false,
    edited = progress.draft !== undefined,
    clue = 0;
  code.addEventListener("input", () => {
    edited = true;
    progress.draft = code.value;
    status.textContent = host.save(progress)
      ? "Draft saved with this adventure."
      : "Device saving unavailable. Download an adventure backup before leaving.";
    results.replaceChildren();
    scene.classList.remove("review-good", "review-bad", "review-cooling");
    signal.textContent = "Run your changed instruction to check it.";
    preview();
  });
  const hint = el("p", "zero-hint"),
    clues = button("Ask for a clue", () => {
      hint.textContent = lesson.clues[Math.min(clue++, 2)];
    });
  const next = button("Try a new example", host.next, "button primary");
  next.hidden = true;
  const run = button("Test my review repair", () => void execute(), "button primary");
  function show(actual: string, expected: string, label: string) {
    scene.classList.toggle("review-good", actual === expected);
    scene.classList.toggle("review-bad", actual !== expected);
    scene.classList.toggle("review-cooling", host.topic === "conditions" && actual === "COOL");
    signal.textContent = `${label}: your program printed ${actual || "(No output)"}. Goal: ${expected}.`;
    const count =
      host.topic === "variables"
        ? /^\d+$/.test(actual.trim())
          ? Number(actual)
          : Number.NaN
        : actual
            .trim()
            .split(/\s+/)
            .filter((n) => /^\d+$/.test(n)).length;
    (cart.querySelector("strong") as HTMLElement).textContent =
      Number.isFinite(count) && count >= 0 && count <= 99 ? String(count) : "?";
    for (const [i, lamp] of [...lamps.children].entries())
      lamp.classList.toggle("lit", host.topic === "loops" && i < count);
  }
  async function execute() {
    if (busy || complete || !alive) return;
    busy = true;
    run.disabled = code.disabled = clues.disabled = true;
    progress.draft = code.value;
    host.save(progress);
    results.replaceChildren();
    output.textContent = "Running your repair…";
    const tests = lesson.cases(code.value),
      actual: string[] = [];
    try {
      for (const [i, test] of tests.entries()) {
        status.textContent = `Checking ${i + 1}/${tests.length}: ${test.label}…`;
        const result = await host.run(test.code);
        if (!alive) return;
        const error = executionError(result);
        actual.push(result.stdout.trim());
        output.textContent = actual
          .map((value, n) => `Check ${n + 1}:\n${value || "(No output)"}`)
          .join("\n\n")
          .slice(0, 16000);
        if (error) {
          output.textContent += `\n${error.message}`;
          status.textContent = beginnerHint(error.message, host.lang);
          return;
        }
      }
      const failed = tests.findIndex((test, i) => actual[i] !== test.expected),
        selected = failed >= 0 ? failed : 0;
      for (const [i, test] of tests.entries()) {
        const row = el(
          "p",
          actual[i] === test.expected ? "gate-result-pass" : "gate-result-fail",
          `${test.label}: ${actual[i] || "(No output)"} · expected ${test.expected}`,
        );
        results.append(
          row,
          button(
            `Replay ${test.label}`,
            () => {
              show(actual[i], test.expected, test.label);
              scene.scrollIntoView({ block: "nearest", behavior: "instant" });
            },
            "button",
          ),
        );
      }
      show(actual[selected], tests[selected].expected, tests[selected].label);
      if (failed >= 0) {
        if (edited) host.miss();
        status.textContent =
          "Compare the result with the goal. The same repair must work for every input. Edit and retry freely.";
      } else {
        complete = true;
        host.complete();
        next.textContent = host.nextLabel?.() ?? "Try a new example";
        status.textContent =
          "Review complete! You used the idea in a new situation. Your next example will use different values.";
        next.hidden = false;
      }
    } catch {
      if (alive) status.textContent = "The run stopped. Save your draft and retry when ready.";
    } finally {
      if (alive) {
        busy = false;
        run.disabled = code.disabled = complete;
        clues.disabled = false;
      }
    }
  }
  panel.append(
    el(
      "span",
      "eyebrow",
      `${host.topic.toUpperCase()} · REVIEW ${progress.variant + 1}/3 · ${host.lang.toUpperCase()}`,
    ),
    scene,
    el("p", "zero-concept", lesson.goal),
    el(
      "p",
      "muted",
      "A short repair, unlimited retries and no hearts spent. The output comes from your actual program.",
    ),
    el(
      "label",
      "zero-editor-label",
      host.topic === "conditions" ? "Write the condition only" : "Edit the repair instruction",
    ),
    code,
    full,
    run,
    clues,
    hint,
    status,
    results,
    output,
    next,
    button("Review adventures", host.hub),
  );
  return () => {
    alive = false;
  };
}
