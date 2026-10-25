import { type CompanionState, deliveryExample, deliveryStops } from "../core/companion";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { beginnerHint } from "./debug-guidance";
import { button, el } from "./dom";
import "./first-program.css";
import "./companion.css";

export function openCompanion(host: {
  lang: Lang;
  name: string;
  companion: CompanionState;
  district: string;
  panel(): HTMLElement;
  run(code: string): Promise<RunResult>;
  save(c: CompanionState): boolean;
  deploy(stops: number[]): void;
  miss?(): void;
}): () => void {
  const panel = host.panel(),
    c = structuredClone(host.companion);
  panel.classList.add("companion-panel");
  let alive = true,
    busy = false,
    verified: number[] | null = null;
  panel.append(
    el(
      "p",
      "zero-concept",
      `${host.name} is your city partner. A loop repeats an instruction; a list stores the delivery order. Print three different terminal numbers from 1 to 8, one per line. Your real output becomes the route.`,
    ),
  );
  const status = el("p", "feedback"),
    summary = el("p", "zero-goal", `${c.trips} completed routes · Current district: ${host.district}`);
  if (c.trip && c.trip.next < 3)
    summary.textContent += ` · Saved route ${c.trip.stops.join(" → ")}: ${c.trip.next}/3 delivered. Return to its district to resume.`;
  const code = el("textarea", "zero-code");
  code.setAttribute("aria-label", "Delivery program");
  code.spellcheck = false;
  code.value = c.draft || deliveryExample(host.lang);
  code.maxLength = 16000;
  const persist = () => {
    c.draft = code.value;
    status.textContent = host.save(c)
      ? "Draft saved with adventure and disk backups."
      : "Saving unavailable. Download an adventure backup.";
  };
  const deploy = button(
    "Deploy route in city",
    () => {
      if (verified) host.deploy(verified);
    },
    "button primary",
  );
  deploy.disabled = true;
  const output = el("pre", "zero-output");
  output.setAttribute("aria-label", "Delivery output");
  const run = button("Test delivery program", () => void execute(), "button primary");
  async function execute() {
    if (busy) return;
    busy = true;
    verified = null;
    deploy.disabled = true;
    code.disabled = run.disabled = true;
    for (const b of examples.querySelectorAll<HTMLButtonElement>("button")) b.disabled = true;
    persist();
    output.textContent = "Running your program…";
    try {
      const result = await host.run(code.value);
      if (!alive) return;
      const error = executionError(result);
      output.textContent = [result.stdout, result.stderr, error?.message].filter(Boolean).join("\n") || "(No output)";
      output.dataset.state = error ? "error" : "ready";
      if (error) {
        status.textContent = beginnerHint(error.message, host.lang);
        return;
      }
      verified = deliveryStops(result.stdout);
      if (!verified) host.miss?.();
      status.textContent = verified
        ? `Verified route: ${verified.join(" → ")}. Deploy to watch ${host.name} navigate around city objects. This does not solve coding tasks.`
        : "Print exactly three different numbers from 1 to 8. Try the loop example, then change its start/end or use a delivery list.";
      deploy.disabled = !verified;
    } catch {
      if (alive) status.textContent = "Run interrupted. Retry when ready.";
    } finally {
      if (alive) {
        busy = false;
        code.disabled = run.disabled = false;
        for (const b of examples.querySelectorAll<HTMLButtonElement>("button")) b.disabled = false;
      }
    }
  }
  code.addEventListener("input", () => {
    verified = null;
    deploy.disabled = true;
    persist();
  });
  const examples = el("div", "actions");
  for (const list of [false, true])
    examples.append(
      button(list ? "Load delivery list" : "Load loop example", () => {
        if (busy) return;
        code.value = deliveryExample(host.lang, list);
        code.dispatchEvent(new Event("input"));
      }),
    );
  const enabled = el("input");
  enabled.type = "checkbox";
  enabled.checked = c.enabled;
  const label = el("label", "setting-row");
  label.append(enabled, el("span", "", `Show ${host.name} in the city`));
  enabled.addEventListener("change", () => {
    c.enabled = enabled.checked;
    persist();
  });
  const actions = el("div", "actions");
  actions.append(run, deploy);
  panel.append(
    summary,
    label,
    examples,
    code,
    actions,
    status,
    output,
    el(
      "p",
      "muted",
      "The robot waits while menus are open. Delivery checkpoints survive refresh. Save a backup to carry them to another browser.",
    ),
  );
  return () => {
    alive = false;
  };
}
