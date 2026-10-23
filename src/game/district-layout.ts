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
  label: { x: 768, y: 475 },
};

export function districtLayout(area: AreaId = "variables"): DistrictLayout {
  return area === "conditions"
    ? LOGIC_LAYOUT
    : {
        spawn: village.spawn,
        bounds: village.walkBounds,
        lesson: village.lesson,
        tasks: village.tasks,
        boss: village.boss,
        label: { x: 768, y: 382 },
      };
}
