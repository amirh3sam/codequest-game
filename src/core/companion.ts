import { wrapBeginnerProgram } from "../content/first-program";
import type { Lang } from "../runners/types";
import { AREA_IDS, type AreaId } from "./rules";

export type DeliveryTrip = { id: string; area: AreaId; stops: number[]; next: number };
export type CompanionState = { enabled: boolean; draft: string; trips: number; trip?: DeliveryTrip };
export function deliveryStops(stdout: string): number[] | null {
  const lines = stdout.trim().split(/\s+/);
  if (lines.length !== 3 || lines.some((line) => !/^[1-8]$/.test(line))) return null;
  const stops = lines.map(Number);
  return new Set(stops).size === 3 ? stops : null;
}
export function deliveryExample(lang: Lang, list = false): string {
  const body =
    lang === "python"
      ? list
        ? "deliveries = [2, 1, 3]\nfor terminal in deliveries:\n    print(terminal)"
        : "for terminal in range(1, 4):\n    print(terminal)"
      : lang === "java"
        ? list
          ? "int[] deliveries = {2, 1, 3};\nfor (int terminal : deliveries) {\n    System.out.println(terminal);\n}"
          : "for (int terminal = 1; terminal <= 3; terminal++) {\n    System.out.println(terminal);\n}"
        : list
          ? "const deliveries = [2, 1, 3];\nfor (const terminal of deliveries) {\n    console.log(terminal);\n}"
          : "for (let terminal = 1; terminal <= 3; terminal++) {\n    console.log(terminal);\n}";
  return wrapBeginnerProgram(lang, body);
}
export function isCompanion(value: unknown): value is CompanionState {
  if (!value || typeof value !== "object") return false;
  const c = value as CompanionState;
  if (
    typeof c.enabled !== "boolean" ||
    typeof c.draft !== "string" ||
    c.draft.length > 16000 ||
    !Number.isInteger(c.trips) ||
    c.trips < 0 ||
    c.trips > 9999
  )
    return false;
  if (c.trip === undefined) return true;
  const t = c.trip;
  return (
    !!t &&
    typeof t === "object" &&
    typeof t.id === "string" &&
    /^[\w-]{1,80}$/.test(t.id) &&
    AREA_IDS.includes(t.area) &&
    Array.isArray(t.stops) &&
    t.stops.length === 3 &&
    t.stops.every((n) => Number.isInteger(n) && n >= 1 && n <= 8) &&
    new Set(t.stops).size === 3 &&
    Number.isInteger(t.next) &&
    t.next >= 0 &&
    t.next <= 3
  );
}
/** Accept each physical arrival once, even when a callback is repeated or an old trip finishes late. */
export function checkpoint(c: CompanionState, id: string, next: number): CompanionState {
  if (!c.trip || c.trip.id !== id || next !== c.trip.next + 1 || next > 3) return c;
  return { ...c, trip: { ...c.trip, next }, trips: Math.min(9999, c.trips + Number(next === 3)) };
}
