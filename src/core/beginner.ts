export const BEGINNER_STEPS = [
  "instructions",
  "name",
  "predict",
  "investigate",
  "charge",
  "rescue",
  "transfer",
] as const;
export type BeginnerStep = (typeof BEGINNER_STEPS)[number];
export type BeginnerCodeStep = "name" | "charge" | "rescue";
export type RobotCommand = "move" | "collect" | "deliver";
export type BeginnerProgress = {
  version: 1;
  status: "in-progress" | "paused" | "complete";
  step: number;
  completed: BeginnerStep[];
  robotName: string;
  drafts: Partial<Record<BeginnerCodeStep, string>>;
  plan: RobotCommand[];
};
export function createBeginnerProgress(): BeginnerProgress {
  return { version: 1, status: "in-progress", step: 0, completed: [], robotName: "Pixel", drafts: {}, plan: [] };
}
export function isRobotName(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9][a-zA-Z0-9 -]{0,15}$/.test(value);
}
export function isBeginnerProgress(value: unknown): value is BeginnerProgress {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as BeginnerProgress;
  return (
    p.version === 1 &&
    ["in-progress", "paused", "complete"].includes(p.status) &&
    Number.isInteger(p.step) &&
    p.step >= 0 &&
    p.step < BEGINNER_STEPS.length &&
    Array.isArray(p.completed) &&
    p.completed.length <= BEGINNER_STEPS.length &&
    p.completed.every((id, index) => id === BEGINNER_STEPS[index]) &&
    p.step <= p.completed.length &&
    (p.status === "complete") === (p.completed.length === BEGINNER_STEPS.length) &&
    isRobotName(p.robotName) &&
    !!p.drafts &&
    typeof p.drafts === "object" &&
    !Array.isArray(p.drafts) &&
    Object.entries(p.drafts).every(
      ([key, source]) =>
        ["name", "charge", "rescue"].includes(key) && typeof source === "string" && source.length <= 16000,
    ) &&
    Array.isArray(p.plan) &&
    p.plan.length <= 3 &&
    p.plan.every((command) => ["move", "collect", "deliver"].includes(command))
  );
}
export function completeBeginnerStep(progress: BeginnerProgress, id: BeginnerStep): BeginnerProgress {
  if (BEGINNER_STEPS[progress.completed.length] !== id) return progress;
  const completed = [...progress.completed, id];
  return { ...progress, completed, status: completed.length === BEGINNER_STEPS.length ? "complete" : "in-progress" };
}
export type RobotFrame = {
  station: "dock" | "supply" | "clinic";
  carrying: boolean;
  delivered: boolean;
  message: string;
};
export function runRobotPlan(plan: readonly RobotCommand[]): { frames: RobotFrame[]; success: boolean } {
  let station: RobotFrame["station"] = "dock",
    carrying = false,
    delivered = false;
  const frames: RobotFrame[] = [];
  for (const command of plan) {
    let message: string,
      failed = false;
    if (command === "move" && station === "dock") {
      station = "supply";
      message = "Moved to the supply station.";
    } else if (command === "collect" && station === "supply" && !carrying) {
      carrying = true;
      message = "Collected the repair kit.";
    } else if (command === "deliver" && carrying) {
      station = "clinic";
      carrying = false;
      delivered = true;
      message = "Delivered the repair kit to the clinic!";
    } else {
      failed = true;
      message =
        command === "collect"
          ? "The kit is at the supply station. Move there before collecting it."
          : command === "deliver"
            ? "The robot needs to collect the kit before delivering it."
            : "The robot is already at supplies. Collect the kit next.";
    }
    frames.push({ station, carrying, delivered, message });
    if (failed) return { frames, success: false };
  }
  return { frames, success: delivered };
}
