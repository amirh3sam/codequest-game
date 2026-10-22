import type { GameState } from "./state";

export const DRONE_TASK_ID = "variables-2";
export const BATTERY_CAPACITY = 12;

export function isDroneRepaired(state: GameState): boolean {
  return state.areas.variables.solved.includes(DRONE_TASK_ID);
}

/** Only one printed, bounded integer can drive the battery preview. */
export function readBatteryOutput(stdout: string): number | undefined {
  const text = stdout.trim();
  if (!/^(?:[0-9]|1[0-2])$/.test(text)) return undefined;
  return Number(text);
}
