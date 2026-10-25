import { GATE_CHECKS, GATE_LESSONS, type GateInput, gateExpected, gateProgram } from "../content/smart-gate";
import type { LessonProgress } from "../core/journey";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";
import { openLearningLesson } from "./learning-lesson";
import "./smart-gate.css";

export function openSmartGate(host: {
  lang: Lang;
  progress: LessonProgress;
  robotName: string;
  panel(): HTMLElement;
  save(progress: LessonProgress): boolean;
  run(code: string): Promise<RunResult>;
  cancel(): void;
  leave(): void;
  hub(): void;
}): () => void {
  const scene = el("div", "zero-scene gate-scene"),
    data = el("p", "gate-input"),
    summary = el("p", "gate-summary");
  summary.setAttribute("role", "status");
  const arch = el("div", "gate-arch");
  arch.append(
    el("span", "gate-sign", "CLINIC / SMART GATE"),
    el("span", "gate-door gate-door-left"),
    el("span", "gate-door gate-door-right"),
  );
  const robot = el("div", "gate-robot");
  robot.setAttribute("aria-hidden", "true");
  robot.append(el("span"), el("i"));
  scene.append(data, el("div", "gate-track"), arch, robot, summary);
  const show = (input: GateInput, signal?: string, expected?: string) => {
    data.textContent = `${input.delivery ? host.robotName : "Visitor"}\nisDelivery: ${input.delivery}\nbattery: ${input.battery}`;
    scene.classList.toggle("gate-open", signal === "OPEN");
    scene.classList.toggle("gate-unsafe", signal !== undefined && expected !== undefined && signal !== expected);
    summary.textContent = signal
      ? `${input.label}: your code printed ${signal}. ${expected ? `Goal: ${expected}.` : ""}`
      : "Run a program to send a real gate signal.";
  };
  return openLearningLesson({
    ...host,
    lessons: GATE_LESSONS,
    scene,
    render({ id, work, status, progress, save, complete, execute }) {
      const base = { delivery: true, battery: id === "predict" || id === "branches" ? 2 : 6, label: "Delivery robot" };
      show(base);
      if (id === "branches") {
        const trace = el("ol", "zero-trace"),
          text = el("p", "zero-trace-value");
        for (const line of ["Check: 2 >= 4 → false", "Skip: the OPEN branch", "Run else: print CLOSED"])
          trace.append(el("li", "", line));
        let line = -1;
        const answer = button("The else branch", () => {
          status.textContent = "Correct. The false condition selected else; only CLOSED was printed.";
          complete();
        });
        answer.disabled = true;
        const step = button(
          "Step through the decision",
          () => {
            line++;
            for (const [i, node] of [...trace.children].entries()) node.classList.toggle("current", i === line);
            text.textContent = [
              "The condition compares the stored energy with 4.",
              "False means the OPEN branch is skipped.",
              "The else branch ran, so the real example printed CLOSED.",
            ][line];
            if (line === 2) {
              step.disabled = true;
              answer.disabled = false;
              show(base, "CLOSED", "CLOSED");
            }
          },
          "button primary",
        );
        work.append(trace, step, text, answer);
        return;
      }
      const editable = id === "modify" || id === "challenge";
      const input = el("textarea", "zero-code");
      input.setAttribute("aria-label", "Gate condition");
      input.rows = 2;
      input.maxLength = 16000;
      input.spellcheck = false;
      input.value = progress.drafts[id] ?? (id === "modify" ? "battery > 4" : "battery >= 4");
      const full = el("details", "zero-full-program"),
        preview = el("pre", "zero-code-preview");
      full.append(el("summary", "", "See the whole gate program"), preview);
      const update = () => {
        preview.textContent = gateProgram(host.lang, editable ? input.value : "battery >= 4", base);
      };
      update();
      const table = el("div", "gate-results");
      if (editable) {
        const label = el("label", "zero-editor-label", "Write the condition only");
        label.append(input);
        work.append(
          label,
          el(
            "p",
            "zero-note",
            host.lang === "python"
              ? "Use and to require both conditions. The surrounding if/else and print calls are supplied."
              : "Use && to require both conditions. The surrounding if/else and print calls are supplied.",
          ),
        );
        input.addEventListener("input", () => {
          progress.drafts[id] = input.value;
          save();
          table.replaceChildren();
          update();
          show(base);
        });
      }
      work.append(full);
      if (!editable) full.open = true;
      let picked: string | undefined;
      const choices = el("div", "zero-answers");
      const run = button(
        editable ? "Test gate condition" : "Run gate example",
        () => {
          const inputs = editable
            ? id === "challenge"
              ? GATE_CHECKS
              : GATE_CHECKS.filter((test) => test.delivery)
            : [base];
          const condition = editable ? input.value : "battery >= 4";
          void execute(
            inputs.map((test) => gateProgram(host.lang, condition, test)),
            run,
            (results) => {
              const signals = results.map((result) => result.stdout.trim());
              table.replaceChildren();
              let passed = true;
              inputs.forEach((test, i) => {
                const expected = gateExpected(test, id === "challenge"),
                  actual = signals[i];
                if (actual !== expected) passed = false;
                const result = el(
                  "p",
                  actual === expected ? "gate-result-pass" : "gate-result-fail",
                  `${test.label}: ${actual || "(No signal)"} · expected ${expected}`,
                );
                const view = button(`Show ${test.label}`, () => show(test, actual, expected), "studio-small-action");
                table.append(result, view);
              });
              const firstFailure = inputs.findIndex((test, i) => signals[i] !== gateExpected(test, id === "challenge"));
              const selected = firstFailure >= 0 ? firstFailure : inputs.length - 1;
              show(inputs[selected], signals[selected], gateExpected(inputs[selected], id === "challenge"));
              if (id === "predict") {
                status.textContent = `${picked === signals[0] ? "You predicted it!" : `You chose ${picked}; the program printed ${signals[0]}.`} 2 >= 4 is false, so else runs.`;
                if (passed) complete();
              } else {
                status.textContent = passed
                  ? id === "challenge"
                    ? "Gate secured! Your condition handled all five visitors, including exactly 4 cells and missing badges."
                    : "All checks passed. Follow the value into the next decision."
                  : "Compare actual and expected signals above. One condition must work for every visitor. You can edit and retry freely.";
                if (passed) complete();
              }
            },
          );
        },
        "button primary",
      );
      if (id === "predict") {
        run.disabled = true;
        for (const signal of ["OPEN", "CLOSED"])
          choices.append(
            button(`Predict ${signal}`, () => {
              picked = signal;
              run.disabled = false;
              status.textContent = `Prediction: ${signal}. Run to check.`;
            }),
          );
        work.append(choices);
      }
      work.append(run, table);
    },
    finished(work) {
      work.append(
        el(
          "article",
          "zero-achievement",
          "Gatekeeper earned! You used if/else, included the boundary with >= and combined two conditions. Your policy checks are saved with this adventure.",
        ),
        button("Continue my learning adventure", host.hub, "button primary"),
        button("Explore the city", host.leave),
      );
    },
  });
}
