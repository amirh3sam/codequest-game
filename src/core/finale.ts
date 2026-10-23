import { type AreaDefinition, canFightBoss, type GameState } from "./state";

export function hubStage(state: GameState): 0 | 1 | 2 | 3 {
  return state.areas.variables.bossDefeated ? 3 : (state.areas.variables.finaleStage ?? 0);
}

/** Free checkpoint, called only after validating a real worker preview. */
export function restoreHubSubsystem(
  state: GameState,
  area: AreaDefinition,
  stage: 1 | 2,
  updatedAt: string,
): GameState {
  if (
    area.id !== "variables" ||
    state.currentArea !== "variables" ||
    !canFightBoss(state, area) ||
    (stage !== 1 && stage !== 2) ||
    hubStage(state) + 1 !== stage
  )
    return state;
  return {
    ...state,
    updatedAt,
    areas: { ...state.areas, variables: { ...state.areas.variables, finaleStage: stage } },
  };
}
