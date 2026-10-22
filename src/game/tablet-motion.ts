export const TABLET_SHOT_MS = 4700;
export type TabletPhase = "approach" | "raise" | "look" | "enter" | "ready";

const smooth = (value: number): number => {
  const t = Math.max(0, Math.min(1, value));
  return t * t * (3 - 2 * t);
};

/** Absolute time keeps arm, gaze and camera motion together at any frame rate. */
export function tabletMotion(elapsed: number) {
  const t = Math.max(0, elapsed);
  const phase: TabletPhase =
    t < 700 ? "approach" : t < 1900 ? "raise" : t < 3000 ? "look" : t < TABLET_SHOT_MS ? "enter" : "ready";
  return {
    phase,
    reveal: smooth((t - 220) / 430),
    approach: smooth(t / 1000),
    lift: smooth((t - 700) / 1200),
    gaze: smooth((t - 1100) / 1000),
    touch: Math.sin(smooth((t - 1900) / 1000) * Math.PI),
    enter: smooth((t - 3000) / 1700),
    screen: smooth((t - 1600) / 800),
  };
}
