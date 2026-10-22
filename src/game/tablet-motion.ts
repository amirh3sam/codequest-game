export const TABLET_SHOT_MS = 3000;
export type TabletPhase = "approach" | "first-person" | "look" | "enter" | "ready";

const smooth = (value: number): number => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** City zoom, first-person look down, then entry into the wrist screen. */
export function tabletMotion(elapsed: number) {
  const t = Math.max(0, elapsed);
  const phase: TabletPhase =
    t < 600 ? "approach" : t < 1000 ? "first-person" : t < 1900 ? "look" : t < TABLET_SHOT_MS ? "enter" : "ready";
  return {
    phase,
    reveal: smooth((t - 500) / 250),
    lift: smooth((t - 550) / 600),
    gaze: smooth((t - 650) / 800),
    touch: Math.sin(smooth((t - 1100) / 650) * Math.PI),
    enter: smooth((t - 1900) / 1100),
    screen: smooth((t - 650) / 450),
  };
}
