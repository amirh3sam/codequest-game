import type { RobotFrame } from "../core/beginner";
import { el } from "./dom";
import type { TrainingArtwork } from "./training-visual";

export function firstProgramScene(art: TrainingArtwork, name: string) {
  const node = el("div", "zero-scene");
  node.setAttribute("aria-label", "Robot rescue scene");
  const backdrop = el("canvas", "zero-backdrop");
  backdrop.width = 900;
  backdrop.height = 300;
  backdrop.setAttribute("aria-hidden", "true");
  backdrop.getContext("2d")?.drawImage(art.city, 0, 0, 900, 300);
  const dock = el("div", "zero-dock", "ROBOT LAB");
  const supply = el("div", "zero-building zero-supply"),
    clinic = el("div", "zero-building zero-clinic");
  supply.append(el("span", "zero-building-icon", "▣"), el("strong", "", "SUPPLIES"), el("span", "zero-door"));
  const clinicState = el("small", "", "KIT NEEDED");
  clinic.append(
    el("span", "zero-building-icon", "+"),
    el("strong", "", "CITY CLINIC"),
    clinicState,
    el("span", "zero-door"),
  );
  const robot = el("div", "zero-robot");
  robot.setAttribute("aria-hidden", "true");
  robot.append(
    el("span", "zero-antenna"),
    el("span", "zero-robot-head"),
    el("span", "zero-robot-body"),
    el("span", "zero-wheel zero-wheel-left"),
    el("span", "zero-wheel zero-wheel-right"),
    el("span", "zero-kit", "+"),
  );
  const robotLabel = el("span", "zero-robot-label", name);
  robot.append(robotLabel);
  const telemetry = el("div", "zero-telemetry"),
    batteryText = el("strong"),
    meter = el("div", "zero-battery"),
    fill = el("span");
  meter.setAttribute("role", "meter");
  meter.setAttribute("aria-label", "Robot energy cells");
  meter.setAttribute("aria-valuemin", "0");
  meter.setAttribute("aria-valuemax", "12");
  meter.append(fill);
  telemetry.append(el("small", "", "LIVE ROBOT ENERGY"), batteryText, meter);
  const summary = el("p", "zero-scene-summary", "Your robot is waiting at the lab.");
  summary.setAttribute("role", "status");
  const road = el("div", "zero-road");
  road.setAttribute("aria-hidden", "true");
  node.append(backdrop, el("div", "zero-skyline"), road, dock, supply, clinic, robot, telemetry, summary);
  let state = {
    name,
    battery: 2 as number | null,
    station: "dock" as RobotFrame["station"],
    carrying: false,
    delivered: false,
    other: false,
  };
  const timers = new Set<number>();
  let alive = true;
  const update = (patch: Partial<typeof state>, message?: string) => {
    if (!alive) return;
    state = { ...state, ...patch };
    robotLabel.textContent = state.name;
    robot.style.setProperty("--robot-x", state.station === "dock" ? "14%" : state.station === "supply" ? "49%" : "83%");
    node.classList.toggle("zero-delivered", state.delivered);
    robot.classList.toggle("carrying", state.carrying);
    robot.classList.toggle("other", state.other);
    clinicState.textContent = state.delivered ? "KIT DELIVERED" : "KIT NEEDED";
    batteryText.textContent = state.battery === null ? "Check your output" : `${state.battery} / 12 cells`;
    if (state.battery === null) meter.removeAttribute("aria-valuenow");
    else meter.setAttribute("aria-valuenow", String(state.battery));
    fill.style.width = `${((state.battery ?? 0) / 12) * 100}%`;
    if (message) summary.textContent = message;
  };
  const cancel = () => {
    for (const timer of timers) clearTimeout(timer);
    timers.clear();
  };
  return {
    node,
    update,
    stop: cancel,
    play(frames: readonly RobotFrame[], done: () => void) {
      cancel();
      update({ station: "dock", carrying: false, delivered: false });
      const speed = matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
      frames.forEach((frame, index) => {
        const timer = window.setTimeout(
          () => {
            timers.delete(timer);
            if (!alive) return;
            update(frame, frame.message);
            if (index === frames.length - 1) done();
          },
          speed * (index + 1),
        );
        timers.add(timer);
      });
    },
    dispose() {
      alive = false;
      cancel();
    },
  };
}
