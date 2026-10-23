import village from "../content/village.json" with { type: "json" };
import type { AreaId } from "../core/rules";
import type { Position } from "../core/state";
import type { Bounds } from "./collision";

export type DistrictLayout = Readonly<{
  spawn: Position;
  bounds: Bounds;
  lesson: Position;
  tasks: readonly Position[];
  boss: Position;
  arcade: Position;
  label: Position;
}>;
export const LOGIC_LAYOUT: DistrictLayout = {
  spawn: { x: 220, y: 550 },
  bounds: { left: 190, right: 1340, top: 210, bottom: 580 },
  lesson: { x: 220, y: 450 },
  tasks: [
    { x: 370, y: 550 },
    { x: 500, y: 430 },
    { x: 310, y: 310 },
    { x: 560, y: 245 },
    { x: 980, y: 245 },
    { x: 1220, y: 370 },
    { x: 1100, y: 550 },
    { x: 800, y: 545 },
  ],
  boss: { x: 1320, y: 275 },
  arcade: { x: 760, y: 300 },
  label: { x: 768, y: 475 },
};

const STORY_LAYOUTS: Readonly<Record<Exclude<AreaId, "variables" | "conditions">, DistrictLayout>> = {
  loops: {
    spawn: { x: 160, y: 645 },
    bounds: { left: 77, right: 1459, top: 179, bottom: 691 },
    lesson: { x: 250, y: 426 },
    tasks: [
      { x: 365, y: 625 },
      { x: 520, y: 535 },
      { x: 680, y: 625 },
      { x: 830, y: 535 },
      { x: 990, y: 625 },
      { x: 1140, y: 535 },
      { x: 950, y: 390 },
      { x: 650, y: 390 },
    ],
    boss: { x: 1320, y: 300 },
    arcade: { x: 235, y: 315 },
    label: { x: 760, y: 285 },
  },
  arrays: {
    spawn: { x: 165, y: 640 },
    bounds: { left: 77, right: 1459, top: 179, bottom: 691 },
    lesson: { x: 260, y: 435 },
    tasks: [
      { x: 390, y: 615 },
      { x: 550, y: 615 },
      { x: 710, y: 615 },
      { x: 870, y: 615 },
      { x: 1030, y: 615 },
      { x: 1190, y: 615 },
      { x: 1110, y: 420 },
      { x: 720, y: 390 },
    ],
    boss: { x: 1325, y: 300 },
    arcade: { x: 235, y: 310 },
    label: { x: 770, y: 275 },
  },
  functions: {
    spawn: { x: 160, y: 640 },
    bounds: { left: 77, right: 1459, top: 179, bottom: 691 },
    lesson: { x: 255, y: 435 },
    tasks: [
      { x: 360, y: 610 },
      { x: 510, y: 500 },
      { x: 665, y: 610 },
      { x: 820, y: 500 },
      { x: 975, y: 610 },
      { x: 1130, y: 500 },
      { x: 900, y: 370 },
      { x: 570, y: 365 },
    ],
    boss: { x: 1320, y: 290 },
    arcade: { x: 230, y: 300 },
    label: { x: 765, y: 285 },
  },
  objects: {
    spawn: { x: 165, y: 645 },
    bounds: { left: 77, right: 1459, top: 179, bottom: 691 },
    lesson: { x: 265, y: 430 },
    tasks: [
      { x: 375, y: 615 },
      { x: 520, y: 520 },
      { x: 670, y: 615 },
      { x: 820, y: 520 },
      { x: 970, y: 615 },
      { x: 1120, y: 520 },
      { x: 960, y: 370 },
      { x: 620, y: 365 },
    ],
    boss: { x: 1320, y: 285 },
    arcade: { x: 235, y: 300 },
    label: { x: 760, y: 275 },
  },
  abstraction: {
    spawn: { x: 160, y: 645 },
    bounds: { left: 77, right: 1459, top: 179, bottom: 691 },
    lesson: { x: 255, y: 430 },
    tasks: [
      { x: 370, y: 610 },
      { x: 520, y: 510 },
      { x: 675, y: 610 },
      { x: 830, y: 510 },
      { x: 985, y: 610 },
      { x: 1140, y: 510 },
      { x: 930, y: 365 },
      { x: 580, y: 365 },
    ],
    boss: { x: 1320, y: 285 },
    arcade: { x: 235, y: 300 },
    label: { x: 760, y: 275 },
  },
};

export function districtLayout(area: AreaId = "variables"): DistrictLayout {
  if (area === "conditions") return LOGIC_LAYOUT;
  if (area !== "variables") return STORY_LAYOUTS[area];
  return {
    spawn: village.spawn,
    bounds: village.walkBounds,
    lesson: village.lesson,
    tasks: village.tasks,
    boss: village.boss,
    arcade: village.arcade,
    label: { x: 768, y: 382 },
  };
}
