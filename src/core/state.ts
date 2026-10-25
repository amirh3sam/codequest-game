import type { Lang } from "../runners/types";
import type { BeginnerProgress } from "./beginner";
import type { Discoveries } from "./discoveries";
import type { JourneyState } from "./journey";
import type { DistrictLights } from "./map-lighting";
import {
  AREA_IDS,
  type AreaId,
  costsHeart,
  type Difficulty,
  GEM_REWARD,
  type HintCost,
  loseHeart,
  MAX_HEARTS,
  type SubmissionFailure,
  TASKS_PER_AREA,
} from "./rules";
import type { DistrictTraining } from "./training";

export type Hero = Readonly<{ kind: "boy" | "girl"; name: string }>;
export type Position = Readonly<{ x: number; y: number }>;
export type GameExtras = Readonly<{ packetDashBest: number; signalStackBest?: number }>;

export type AreaState = Readonly<{
  solved: readonly string[];
  lessonsFound: boolean;
  gems: number;
  hearts: number;
  hintsBought: number;
  bossDefeated: boolean;
  finaleStage?: 0 | 1 | 2;
  drafts: Readonly<Record<string, string>>;
  lighting?: DistrictLights;
}>;

/** Matches the version-1 save shape in docs/ARCHITECTURE.md. */
export type GameState = Readonly<{
  version: 1;
  adventureId?: string;
  lang: Lang;
  hero: Hero;
  currentArea: AreaId;
  position?: Position;
  discoveries?: Discoveries;
  games?: GameExtras;
  training?: DistrictTraining;
  beginner?: BeginnerProgress;
  journey?: JourneyState;
  areas: Readonly<Record<AreaId, AreaState>>;
  updatedAt: string;
}>;

/** The subset of a content file needed by the rules, independent of UI and grading. */
export type AreaDefinition = Readonly<{
  id: AreaId;
  tasks: readonly Readonly<{ id: string; difficulty: Difficulty }>[];
  boss: Readonly<{ hints: readonly Readonly<{ cost: HintCost }>[] }>;
}>;

export type FailureTransition = Readonly<{ state: GameState; areaReset: boolean }>;

export function createAreaState(): AreaState {
  return {
    solved: [],
    lessonsFound: false,
    gems: 0,
    hearts: MAX_HEARTS,
    hintsBought: 0,
    bossDefeated: false,
    drafts: {},
  };
}

/** Callers supply the timestamp so reducers do not read the clock or browser APIs. */
export function createGame(lang: Lang, hero: Hero, updatedAt: string): GameState {
  return {
    version: 1,
    lang,
    hero: { ...hero },
    currentArea: AREA_IDS[0],
    areas: Object.fromEntries(AREA_IDS.map((id) => [id, createAreaState()])) as Record<AreaId, AreaState>,
    updatedAt,
  };
}

export function isAreaUnlocked(state: GameState, areaId: AreaId): boolean {
  const index = AREA_IDS.indexOf(areaId);
  return index >= 0 && AREA_IDS.slice(0, index).every((id) => state.areas[id].bossDefeated);
}

function updateCurrentArea(state: GameState, area: AreaState, updatedAt: string): GameState {
  return { ...state, areas: { ...state.areas, [state.currentArea]: area }, updatedAt };
}

function atEntrance(state: GameState): GameState {
  const next = { ...state };
  // Missing position tells the scene to use its configured entrance, not the previous map's coordinates.
  delete next.position;
  return next;
}

export function enterArea(state: GameState, areaId: AreaId, updatedAt: string, arrival?: Position): GameState {
  if (!isAreaUnlocked(state, areaId)) return state;
  if (arrival) return { ...state, currentArea: areaId, position: { ...arrival }, updatedAt };
  if (areaId === state.currentArea) return state;
  return atEntrance({ ...state, currentArea: areaId, updatedAt });
}

export function discoverLesson(state: GameState, updatedAt: string): GameState {
  const area = state.areas[state.currentArea];
  if (area.lessonsFound) return state;
  return updateCurrentArea(state, { ...area, lessonsFound: true }, updatedAt);
}

function hasValidTasks(area: AreaDefinition): boolean {
  // Reject incomplete or duplicate task lists rather than unlocking a boss on bad content.
  return (
    area.tasks.length === TASKS_PER_AREA &&
    area.tasks.every((task) => task.id.length > 0) &&
    new Set(area.tasks.map((task) => task.id)).size === TASKS_PER_AREA
  );
}

function canProgress(state: GameState, area: AreaDefinition): boolean {
  return (
    area.id === state.currentArea &&
    isAreaUnlocked(state, area.id) &&
    !state.areas[area.id].bossDefeated &&
    state.areas[area.id].hearts > 0 &&
    hasValidTasks(area)
  );
}

export function canSolveTask(state: GameState, area: AreaDefinition, taskId: string): boolean {
  if (!canProgress(state, area)) return false;
  const progress = state.areas[area.id];
  const index = area.tasks.findIndex((task) => task.id === taskId);
  return (
    index >= 0 &&
    !progress.solved.includes(taskId) &&
    area.tasks.slice(0, index).every((task) => progress.solved.includes(task.id))
  );
}

/** Called only after the grader accepts a submission; the reward comes from content, not the caller. */
export function solveTask(state: GameState, area: AreaDefinition, taskId: string, updatedAt: string): GameState {
  const task = area.tasks.find((entry) => entry.id === taskId);
  if (!task || !canSolveTask(state, area, taskId)) return state;
  const progress = state.areas[area.id];
  return updateCurrentArea(
    state,
    { ...progress, solved: [...progress.solved, taskId], gems: progress.gems + GEM_REWARD[task.difficulty] },
    updatedAt,
  );
}

export function canFightBoss(state: GameState, area: AreaDefinition): boolean {
  return canProgress(state, area) && area.tasks.every((task) => state.areas[area.id].solved.includes(task.id));
}

export function buyNextHint(state: GameState, area: AreaDefinition, updatedAt: string): GameState {
  if (!canFightBoss(state, area)) return state;
  const progress = state.areas[area.id];
  const hint = area.boss.hints[progress.hintsBought];
  if (!hint || progress.gems < hint.cost) return state;
  return updateCurrentArea(
    state,
    { ...progress, gems: progress.gems - hint.cost, hintsBought: progress.hintsBought + 1 },
    updatedAt,
  );
}

/** Called only after every boss check passes. Unlocks are derived from bossDefeated. */
export function defeatBoss(state: GameState, area: AreaDefinition, updatedAt: string): GameState {
  if (!canFightBoss(state, area)) return state;
  return updateCurrentArea(state, { ...state.areas[area.id], bossDefeated: true }, updatedAt);
}

export function resetArea(state: GameState, updatedAt: string): GameState {
  const area = state.areas[state.currentArea];
  // Completed areas remain completed; practice/replay is a separate, later feature.
  if (area.bossDefeated) return state;
  return atEntrance(
    updateCurrentArea(
      state,
      { ...createAreaState(), lessonsFound: area.lessonsFound, ...(area.lighting ? { lighting: area.lighting } : {}) },
      updatedAt,
    ),
  );
}

export function applySubmissionFailure(
  state: GameState,
  areaId: AreaId,
  reason: SubmissionFailure,
  updatedAt: string,
): FailureTransition {
  const area = state.areas[state.currentArea];
  // Submissions run asynchronously; a result from the previous map must not damage the current one.
  if (areaId !== state.currentArea || !costsHeart(reason) || area.bossDefeated) return { state, areaReset: false };
  const hearts = loseHeart(area.hearts);
  if (hearts === 0) return { state: resetArea(state, updatedAt), areaReset: true };
  return { state: updateCurrentArea(state, { ...area, hearts }, updatedAt), areaReset: false };
}
