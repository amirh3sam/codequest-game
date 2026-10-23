import { batteryExample, dronePilot } from "../content/drone-pilot";
import { readBatteryOutput } from "../core/drone-mission";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";

export function batteryCard(
  initial = 3,
  accepted = false,
): { node: HTMLElement; setValue(value: number, done?: boolean): void } {
  const node = el("div", "battery-card");
  const sketch = el("div", "drone-sketch");
  sketch.setAttribute("aria-hidden", "true");
  for (let i = 0; i < 4; i++) sketch.append(el("span", `drone-rotor rotor-${i}`));
  sketch.append(el("span", "drone-shell"), el("span", "drone-lens"), el("span", "drone-parcel"));
  const info = el("div", "battery-info");
  info.append(el("span", "eyebrow", "COURIER DRONE · BATTERY"));
  const number = el("strong", "battery-value");
  const meter = el("div", "battery-meter"),
    fill = el("span", "battery-fill");
  meter.setAttribute("role", "meter");
  meter.setAttribute("aria-label", "Drone battery");
  meter.setAttribute("aria-valuemin", "0");
  meter.setAttribute("aria-valuemax", "12");
  meter.append(fill);
  const caption = el("small");
  info.append(number, meter, caption);
  node.append(sketch, info);
  const setValue = (value: number, done = accepted) => {
    number.textContent = `${value} / 12 cells`;
    meter.setAttribute("aria-valuenow", String(value));
    fill.style.width = `${(value / 12) * 100}%`;
    node.classList.toggle("charged", value === 12);
    caption.textContent = done
      ? "Repair accepted. The courier lane is open."
      : value === 12
        ? "Enough charge to launch. Submit to repair."
        : `${12 - value} more cells needed to launch.`;
  };
  setValue(initial);
  return { node, setValue };
}

export type DroneLessonHost = {
  lang: Lang;
  courierName: string;
  panel(title: string, subtitle: string, wide?: boolean): HTMLElement;
  run(code: string): Promise<RunResult>;
  preview(value: number): void;
  build(): void;
  close(): void;
  delivered: boolean;
  canLaunch: boolean;
  launch(): void;
};

/** The lesson runs real programs, but never submits or mutates game progress. */
export function openDroneLesson(host: DroneLessonHost): void {
  let prediction: number | undefined;
  const predict = (transfer = false) => {
    const panel = host.panel(
      transfer ? "Try a different battery" : "Predict before you run",
      "Free practice · no hearts or gems spent",
      true,
    );
    panel.classList.add("drone-lesson");
    panel.append(
      el("span", "lesson-step", transfer ? "PRACTICE · TRANSFER YOUR SKILL" : "1 / 3 · PREDICT & UNDERSTAND"),
    );
    panel.append(el("p", "lesson-body", transfer ? dronePilot.transfer : dronePilot.predict));
    const code = batteryExample(host.lang, transfer ? 4 : 3, transfer ? 3 : 2);
    const layout = el("div", "drone-learning-layout"),
      work = el("div");
    work.append(el("pre", "code-example", code), el("p", "", "What number will this program print?"));
    const choices = el("div", "prediction-choices");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", "Predict the battery value");
    const feedback = el("p", "lesson-feedback");
    feedback.setAttribute("role", "status");
    const card = batteryCard(transfer ? 4 : 3);
    const next = button(
      transfer ? "Return to the city" : "Try changing the charge",
      transfer ? host.close : modify,
      "button primary",
    );
    next.hidden = true;
    const run = button("Run example", () => {
      void check();
    });
    run.disabled = true;
    const pickButtons: HTMLButtonElement[] = [];
    for (const value of transfer ? [4, 7, 12] : [3, 5, 2]) {
      const pick = button(
        `${value} cells`,
        () => {
          prediction = value;
          for (const node of pickButtons) node.setAttribute("aria-pressed", String(node === pick));
          run.disabled = false;
        },
        "button prediction-choice",
      );
      pick.setAttribute("aria-pressed", "false");
      choices.append(pick);
      pickButtons.push(pick);
    }
    const check = async () => {
      run.disabled = true;
      for (const pick of pickButtons) pick.disabled = true;
      feedback.textContent = "Running the example in your chosen language…";
      try {
        const result = await host.run(code);
        if (!panel.isConnected) return;
        const error = executionError(result),
          value = readBatteryOutput(result.stdout);
        if (error || value === undefined) {
          feedback.textContent = error?.message ?? "Print one whole battery value from 0 to 12.";
          return;
        }
        card.setValue(value);
        host.preview(value);
        feedback.textContent = `${prediction === value ? "You predicted it!" : `You predicted ${prediction}; the program printed ${value}.`} ${transfer ? "4 + 3 = 7. Changing the starting value changes the result." : dronePilot.investigate}`;
        feedback.classList.add("explained");
        next.hidden = false;
      } catch {
        if (panel.isConnected) feedback.textContent = "The example couldn't run. Try again; no progress was changed.";
      } finally {
        if (panel.isConnected) {
          run.disabled = false;
          for (const pick of pickButtons) pick.disabled = false;
        }
      }
    };
    work.append(choices, run, feedback);
    layout.append(work, card.node);
    panel.append(layout, next);
  };
  const modify = () => {
    const panel = host.panel("Find the missing charge", "Free practice · the real drone stays on its pad", true);
    panel.classList.add("drone-lesson");
    panel.append(el("span", "lesson-step", "2 / 3 · CHANGE & EXPERIMENT"), el("p", "lesson-body", dronePilot.modify));
    const layout = el("div", "drone-learning-layout"),
      work = el("div");
    const label = el("label", "editor-label", "Charge to add"),
      amount = el("input", "charge-input");
    amount.type = "number";
    amount.min = "0";
    amount.max = "9";
    amount.step = "1";
    amount.value = "2";
    amount.id = "practice-charge";
    label.htmlFor = amount.id;
    const code = el("pre", "code-example", batteryExample(host.lang, 3, 2));
    amount.addEventListener("input", () => {
      const n = Number(amount.value);
      code.textContent =
        Number.isInteger(n) && n >= 0 && n <= 9
          ? batteryExample(host.lang, 3, n)
          : "Choose a whole number from 0 to 9.";
    });
    const feedback = el("p", "lesson-feedback");
    feedback.setAttribute("role", "status");
    const card = batteryCard();
    const build = button("Build the repair", host.build, "button primary");
    build.hidden = true;
    const run = button("Preview charge", () => {
      void preview();
    });
    const preview = async () => {
      const n = Number(amount.value);
      if (amount.value === "" || !Number.isInteger(n) || n < 0 || n > 9) {
        feedback.textContent = "Choose a whole number from 0 to 9.";
        return;
      }
      run.disabled = true;
      amount.disabled = true;
      build.hidden = true;
      feedback.textContent = "Running your charge preview…";
      try {
        const result = await host.run(batteryExample(host.lang, 3, n));
        if (!panel.isConnected) return;
        const error = executionError(result),
          value = readBatteryOutput(result.stdout);
        if (error || value === undefined) {
          feedback.textContent = error?.message ?? "Print one whole battery value from 0 to 12.";
          return;
        }
        card.setValue(value);
        host.preview(value);
        feedback.textContent = `3 + ${n} = ${value}. ${value === 12 ? "The charge fits! Now write the repair yourself. Preview has not launched the drone or awarded gems." : `The drone needs ${12 - value} more cells. Change the amount and try again.`}`;
        build.hidden = value !== 12;
      } catch {
        if (panel.isConnected) feedback.textContent = "Couldn't preview the charge. No hearts or gems were spent.";
      } finally {
        if (panel.isConnected) {
          run.disabled = false;
          amount.disabled = false;
        }
      }
    };
    work.append(label, amount, code, run, feedback);
    layout.append(work, card.node);
    panel.append(layout, build);
  };
  if (host.delivered) {
    const panel = host.panel(
      `${host.courierName} - Delivery restored`,
      host.canLaunch ? "Your repair is accepted. Watch it change the city." : "The courier lane is open",
      true,
    );
    panel.classList.add("drone-lesson");
    panel.append(
      batteryCard(12, true).node,
      el(
        "p",
        "lesson-body",
        host.canLaunch
          ? "The charger accepted your repair. The battery is full and the courier lane is open. Launch the drone to deliver the replacement part."
          : dronePilot.delivered,
      ),
    );
    if (host.canLaunch) panel.append(button("Watch the delivery", host.launch, "button primary"));
    panel.append(
      button("Try a different battery", () => predict(true)),
      button("Explore the courier lane", host.close),
    );
  } else predict();
}
