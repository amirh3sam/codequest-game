import village from "../content/village.json" with { type: "json" };
import { type AreaId, STUDY_AREA_IDS, type StoryAreaId } from "../core/rules";
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

const STORY_LAYOUTS: Readonly<Record<Exclude<StoryAreaId, "variables" | "conditions">, DistrictLayout>> = {
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
  const studyIndex = STUDY_AREA_IDS.indexOf(area as (typeof STUDY_AREA_IDS)[number]);
  if (studyIndex >= 0) {
    const shift = (studyIndex % 4) * 17;
    const rise = Math.floor(studyIndex / 4) * 12;
    return {
      spawn: { x: 175, y: 630 },
      bounds: { left: 77, right: 1459, top: 179, bottom: 691 },
      lesson: { x: 225, y: 460 },
      tasks: [
        { x: 335 + shift, y: 610 - rise },
        { x: 510 + shift, y: 510 + rise },
        { x: 330 + shift, y: 330 + rise },
        { x: 560 + shift, y: 245 + rise },
        { x: 1010 - shift, y: 245 + rise },
        { x: 1200 - shift, y: 420 + rise },
        { x: 1050 - shift, y: 605 - rise },
        { x: 770 + shift, y: 620 - rise },
      ],
      boss: { x: 1320, y: 265 },
      arcade: { x: 225, y: 295 },
      label: { x: 770, y: 200 },
    };
  }
  if (area === "conditions") return LOGIC_LAYOUT;
  if (area !== "variables") return STORY_LAYOUTS[area as Exclude<StoryAreaId, "variables" | "conditions">];
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

/** A clear landing spot beside each district boss, away from the map edge. */
export function portalPosition(area: AreaId): Position {
  const layout = districtLayout(area);
  const x = layout.boss.x + 86 <= layout.bounds.right - 45 ? layout.boss.x + 86 : layout.boss.x - 86;
  return { x, y: layout.boss.y + 43 };
}

export function portalArrivalPosition(area: AreaId): Position {
  const point = portalPosition(area);
  return { x: point.x, y: point.y + 66 };
}
