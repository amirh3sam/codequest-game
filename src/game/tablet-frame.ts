import type { tabletMotion } from "./tablet-motion";

export type DeveloperKind = "boy" | "girl";
export const TABLET_ART = {
  url: "/assets/tablet/wrist-tablet-2d.png",
  width: 1536,
  height: 1024,
  screen: { x: 420, y: 280, width: 648, height: 316 },
};

/** Keep the screen centered while lifting, then fill any viewport on entry. */
export function tabletFrame(width: number, height: number, motion: ReturnType<typeof tabletMotion>) {
  const screen = TABLET_ART.screen;
  const fit = Math.min(width / TABLET_ART.width, height / TABLET_ART.height) * 1.1;
  const cover = Math.max(width / screen.width, height / screen.height) * 1.02;
  const restingScale = fit * (0.93 + motion.lift * 0.07);
  const pivotY = screen.y + screen.height / 2;
  const restingY = Math.max(height * 0.52, height - (TABLET_ART.height - pivotY) * restingScale + 24);
  return {
    scale: restingScale + (cover - restingScale) * motion.enter,
    angle: (-0.15 * (1 - motion.lift) - 0.04 * motion.gaze + 0.01 * motion.touch) * (1 - motion.enter),
    x: width / 2,
    y: (restingY + height * 0.5 * (1 - motion.lift)) * (1 - motion.enter) + (height / 2) * motion.enter,
    pivotX: screen.x + screen.width / 2,
    pivotY,
  };
}
