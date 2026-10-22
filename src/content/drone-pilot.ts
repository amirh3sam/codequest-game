import type { Lang } from "../runners/types";
import content from "./data/drone-pilot.json" with { type: "json" };

export const dronePilot = content;

export function batteryExample(lang: Lang, start: number, charge: number): string {
  return content.code[lang].replaceAll("__START__", String(start)).replaceAll("__CHARGE__", String(charge));
}
