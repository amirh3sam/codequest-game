import { isDroneRepaired } from "./drone-mission";
import type { GameState } from "./state";

export type BeaconChoice = "garden" | "arcade";
export type Discoveries = Readonly<{ beacon?: BeaconChoice }>;

export function isBeaconChoice(value: unknown): value is BeaconChoice {
  return value === "garden" || value === "arcade";
}

export function canLightBeacon(state: GameState): boolean {
  return state.currentArea === "variables" && (isDroneRepaired(state) || state.discoveries?.beacon !== undefined);
}

/** Apply only after a successful code preview. Discoveries never change graded progress or currency. */
export function lightBeacon(state: GameState, choice: BeaconChoice, updatedAt: string): GameState {
  if (!isBeaconChoice(choice) || !canLightBeacon(state) || state.discoveries?.beacon === choice) return state;
  return { ...state, discoveries: { ...state.discoveries, beacon: choice }, updatedAt };
}
