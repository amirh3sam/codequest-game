import type { GameState } from "./state";
export const SERVICES = ["workshop", "tram", "network"] as const;
export type CityService = (typeof SERVICES)[number];
export function isRestored(value: unknown): value is CityService[] {
  return (
    Array.isArray(value) &&
    value.length <= 3 &&
    new Set(value).size === value.length &&
    value.every((id) => SERVICES.includes(id))
  );
}
export function serviceRequirement(state: GameState, id: CityService): string | null {
  if (state.journey?.restored?.includes(id)) return null;
  if (id === "workshop")
    return state.journey?.gate?.status === "complete" ? null : "Earn Gatekeeper by completing The Smart Gate.";
  if (id === "tram")
    return (state.journey?.companion?.trips ?? 0) >= 1 ? null : "Complete one physical robot delivery route.";
  return state.journey?.restored?.includes("workshop") &&
    state.journey.restored.includes("tram") &&
    state.journey.creations?.some((c) => c.won)
    ? null
    : "Reopen the workshop, restore the tram and beat one of your saved arcade creations.";
}
export function restoreService(state: GameState, id: CityService): CityService[] | null {
  if (serviceRequirement(state, id) || state.journey?.restored?.includes(id)) return null;
  return [...(state.journey?.restored ?? []), id];
}
export function cityReaction(state: GameState): string {
  const r = state.journey?.restored ?? [];
  if (r.includes("network"))
    return "The data exchange is alive again. Your gate, robot routes and game helped us reconnect the district. Look for the green network windows at the workshop.";
  if (r.includes("tram"))
    return "I saw your robot deliver those parts! The tram can run again. Its ticket desk opens your unlocked destinations.";
  if (r.includes("workshop"))
    return "Your gate code got the workshop open. You have a place to build projects and games now.";
  return "The workshop needs a safe gate and the tram needs delivery parts. Your learning adventures can bring this city back to life.";
}
