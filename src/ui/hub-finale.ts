import { HUB_STEPS, hubHint, hubStarter, hubTarget, usesHubLesson } from "../content/hub-finale";
import { executionError, normalizeOutput } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";

type FinaleHost = {
  lang: Lang;
  name: string;
  stage: 0 | 1 | 2 | 3;
  drafts: readonly (string | undefined)[];
  panel(title: string, subtitle: string, wide?: boolean): HTMLElement;
  run(code: string): Promise<RunResult>;
  draft(step: 0 | 1, code: string): void;
  restore(stage: 1 | 2): boolean;
  finalRepair(): void;
  close(): void;
  inspect(): void;
};

export function openHubFinale(host: FinaleHost): void {
  let stage = host.stage;
  const render = () => {
    const panel = host.panel(
      "Restore the data hub",
      stage === 3 ? "CITY SYSTEMS ONLINE" : `STAGE ${stage + 1} / 3 · ${HUB_STEPS[stage]}`,
      true,
    );
    panel.classList.add("hub-finale");
    const steps = el("ol", "finale-steps");
    for (const [index, name] of HUB_STEPS.entries()) {
      const item = el("li", index < stage ? "restored" : index === stage ? "current" : "");
      item.append(
        el("span", "finale-node", index < stage ? "✓" : String(index + 1)),
        el("strong", "", name),
        el("small", "", index < stage ? "ONLINE" : index === stage ? "YOUR NEXT REPAIR" : "WAITING"),
      );
      if (index === stage) item.setAttribute("aria-current", "step");
      steps.append(item);
    }
    panel.append(steps);
    if (stage >= 2) {
      panel.append(
        el(
          "h3",
          "",
          stage === 3 ? "Your code reconnected the district." : "Power is stable. Your operator signal is recognized.",
        ),
        el(
          "p",
          "lesson-body",
          stage === 3
            ? "All three floor signals at the hub are lit. The skyrail route to Logic Junction is unlocked."
            : "The Firewall has one final diagnostic: combine an updated numeric value with a message built from a name. Use what you learned in both repairs to pass its check.",
        ),
      );
      if (stage === 2)
        panel.append(
          el(
            "p",
            "lesson-feedback explained",
            "Both repair checkpoints are saved. Free Run stays available in the final editor. Incorrect final submissions use your usual hearts; boss hints cost gems.",
          ),
          button("Open final repair", host.finalRepair, "button primary"),
        );
      else panel.append(button("Watch the hub boot", host.inspect, "button primary"));
      panel.append(button("Back to the district", host.close));
      return;
    }
    const step: 0 | 1 = stage === 1 ? 1 : 0,
      target = hubTarget(step, host.name);
    const columns = el("div", "editor-columns"),
      briefing = el("div", "instructions"),
      workspace = el("div", "code-workspace");
    briefing.append(
      el("span", "eyebrow", step === 0 ? "KAI / POWER DIAGNOSTIC" : "MINA / OPERATOR SIGNAL"),
      el("h3", "", step === 0 ? "Balance the reserve" : "Tell the hub who's here"),
      el(
        "p",
        "task-prompt",
        step === 0
          ? "‘The hub has 5 power cells. Load 3 more, then use 2 for the antenna. Update the power variable and print the cells left. We need exactly 6.’"
          : `‘The relay is listening, ${host.name}. Build a signal from operatorName so the hub hears exactly: ${target}’`,
      ),
      el(
        "p",
        "lesson-body",
        step === 0
          ? "Each update uses the value left by the previous line. Work from top to bottom."
          : "Text in quotes is literal. A variable supplies the value it remembers. Joining them builds a personalized message.",
      ),
    );
    const diagram = el("div", "finale-preview"),
      readout = el("strong", "", "AWAITING SIGNAL"),
      caption = el("small", "", "Preview first, then restore this subsystem.");
    diagram.append(el("span", "eyebrow", HUB_STEPS[step]), readout, caption);
    const help = el("details", "beacon-example");
    help.append(el("summary", "", "Explain this repair"), el("p", "", hubHint(step)));
    briefing.append(diagram, help);
    const label = el("label", "editor-label", "Repair code"),
      code = el("textarea", "code-editor");
    code.id = "hub-repair-code";
    label.htmlFor = code.id;
    code.spellcheck = false;
    code.autocapitalize = "off";
    code.maxLength = 64000;
    code.value = host.drafts[step] ?? hubStarter(host.lang, step, host.name);
    const output = el("pre", "output", "Your output will appear here.");
    output.setAttribute("aria-label", "Repair output");
    const feedback = el("p", "feedback", `Print exactly: ${target}`);
    feedback.setAttribute("role", "status");
    let running = false,
      receipt: string | undefined;
    const restore = button(
      step === 0 ? "Restore power" : "Connect operator signal",
      () => {
        if (!panel.isConnected || running || receipt !== code.value) return;
        receipt = undefined;
        restore.disabled = true;
        const next = step === 0 ? 1 : 2;
        if (host.restore(next)) {
          stage = next;
          render();
        }
      },
      "button primary",
    );
    restore.disabled = true;
    const invalidate = () => {
      receipt = undefined;
      restore.disabled = true;
      diagram.classList.remove("online");
      readout.textContent = "AWAITING SIGNAL";
      caption.textContent = "Run the current code to preview this repair.";
    };
    const changed = () => {
      host.draft(step, code.value);
      invalidate();
      feedback.textContent = "Code changed. Run a fresh preview before restoring the subsystem.";
    };
    code.addEventListener("input", changed);
    const run = button("Run repair preview", () => {
      void execute();
    });
    const execute = async () => {
      if (running || !panel.isConnected) return;
      running = true;
      const submitted = code.value;
      host.draft(step, submitted);
      invalidate();
      code.disabled = true;
      run.disabled = true;
      feedback.textContent = "Testing the subsystem…";
      try {
        const result = await host.run(submitted);
        if (!panel.isConnected || code.value !== submitted) return;
        output.textContent = result.stdout || "(No output)";
        const error = executionError(result);
        if (error) feedback.textContent = `${error.message} Try again for free.`;
        else if (!usesHubLesson(step, submitted)) {
          feedback.textContent = `${step === 0 ? "Use the power variable, add 3, subtract 2 and print the result." : "Build signal from operatorName with string joining, then print it."} No hearts were spent.`;
        } else if (normalizeOutput(result.stdout) === target) {
          receipt = submitted;
          restore.disabled = false;
          readout.textContent = step === 0 ? "6 / 6 CELLS" : target;
          caption.textContent = "Valid signal. Restore this subsystem to save your checkpoint.";
          diagram.classList.add("online");
          feedback.textContent = "Preview passed. Your code is ready to apply to the city.";
        } else feedback.textContent = `Expected “${target}”. ${hubHint(step)} No hearts were spent.`;
      } catch {
        if (panel.isConnected)
          feedback.textContent = "The runner couldn't finish. Try again; this repair preview is free.";
      } finally {
        running = false;
        code.disabled = false;
        run.disabled = false;
      }
    };
    code.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void execute();
      }
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end");
        changed();
      }
    });
    const actions = el("div", "editor-actions");
    actions.append(run, restore);
    workspace.append(
      label,
      code,
      actions,
      el("span", "section-label", "OUTPUT"),
      output,
      feedback,
      el("small", "", "Free preparation · No hearts or gems spent · Checkpoints and drafts save with this adventure."),
    );
    columns.append(briefing, workspace);
    panel.append(columns);
  };
  render();
}
