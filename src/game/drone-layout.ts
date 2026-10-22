import { dronePilot } from "../content/drone-pilot";
import type { Solid } from "./collision";

/** A real passage: side rails remain solid after its two gates retract. */
export function courierSolids(open: boolean): Solid[] {
  const { courier, gate, northGate } = dronePilot.world;
  const solids: Solid[] = [
    { id: "courier-kai", x: courier.x - 12, y: courier.y - 12, width: 24, height: 14 },
    { id: "courier-west-rail", x: 704, y: 250, width: 8, height: 96 },
    { id: "courier-east-rail", x: 824, y: 250, width: 8, height: 96 },
  ];
  if (!open)
    for (const [index, point] of [gate, northGate].entries())
      solids.push({ id: `courier-gate-${index}`, x: 712, y: point.y - 6, width: 112, height: 12 });
  return solids;
}
