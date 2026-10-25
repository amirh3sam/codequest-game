import type { GameState } from "./state";
export const REWARD_IDS = [
  "hoodie-mint",
  "hoodie-amber",
  "hoodie-violet",
  "robot-rose",
  "robot-gold",
  "antenna-dish",
  "antenna-double",
  "decor-plant",
  "decor-lamp",
  "decor-trophy",
] as const;
export type RewardId = (typeof REWARD_IDS)[number];
export type RoomState = {
  hoodie: "default" | "mint" | "amber" | "violet";
  robot: "cyan" | "rose" | "gold";
  antenna: "standard" | "dish" | "double";
  wall: "navy" | "plum" | "forest";
  decor: ("plant" | "lamp" | "trophy")[];
};
export const defaultRoom = (): RoomState => ({
  hoodie: "default",
  robot: "cyan",
  antenna: "standard",
  wall: "navy",
  decor: [],
});
export function isRoom(value: unknown): value is RoomState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const r = value as RoomState;
  return (
    ["default", "mint", "amber", "violet"].includes(r.hoodie) &&
    ["cyan", "rose", "gold"].includes(r.robot) &&
    ["standard", "dish", "double"].includes(r.antenna) &&
    ["navy", "plum", "forest"].includes(r.wall) &&
    Array.isArray(r.decor) &&
    r.decor.length <= 3 &&
    new Set(r.decor).size === r.decor.length &&
    r.decor.every((v) => ["plant", "lamp", "trophy"].includes(v))
  );
}
export function isEarned(value: unknown): value is RewardId[] {
  return (
    Array.isArray(value) &&
    value.length <= REWARD_IDS.length &&
    new Set(value).size === value.length &&
    value.every((v) => REWARD_IDS.includes(v))
  );
}
export const REWARDS: Record<RewardId, { name: string; requirement: string }> = {
  "hoodie-mint": { name: "Mint hoodie", requirement: "Complete Robot Rescue." },
  "hoodie-amber": { name: "Amber hoodie", requirement: "Complete The Smart Gate." },
  "hoodie-violet": { name: "Violet hoodie", requirement: "Complete a robot delivery route." },
  "robot-rose": { name: "Rose robot shell", requirement: "Beat one of your saved arcade creations." },
  "robot-gold": { name: "Gold robot shell", requirement: "Complete three review adventures." },
  "antenna-dish": { name: "Satellite antenna", requirement: "Complete a robot delivery route." },
  "antenna-double": { name: "Twin antenna", requirement: "Restore the data exchange." },
  "decor-plant": { name: "Workshop plant", requirement: "Reopen the developer workshop." },
  "decor-lamp": { name: "Transit desk lamp", requirement: "Restore the city tram." },
  "decor-trophy": { name: "Review trophy", requirement: "Complete three review adventures." },
};
export function availableRewards(s: GameState): RewardId[] {
  const reviews = Object.values(s.journey?.reviews ?? {}).reduce((sum, r) => sum + (r?.wins ?? 0), 0),
    trip = (s.journey?.companion?.trips ?? 0) > 0,
    restored = s.journey?.restored ?? [];
  const conditions: Record<RewardId, boolean> = {
    "hoodie-mint": s.beginner?.status === "complete",
    "hoodie-amber": s.journey?.gate?.status === "complete",
    "hoodie-violet": trip,
    "robot-rose": !!s.journey?.creations?.some((c) => c.won),
    "robot-gold": reviews >= 3,
    "antenna-dish": trip,
    "antenna-double": restored.includes("network"),
    "decor-plant": restored.includes("workshop"),
    "decor-lamp": restored.includes("tram"),
    "decor-trophy": reviews >= 3,
  };
  return REWARD_IDS.filter((id) => conditions[id]);
}
export function canEquipRoom(r: RoomState, earned: readonly RewardId[]): boolean {
  if (!isRoom(r)) return false;
  const needs: RewardId[] = [];
  if (r.hoodie !== "default") needs.push(`hoodie-${r.hoodie}`);
  if (r.robot !== "cyan") needs.push(`robot-${r.robot}`);
  if (r.antenna !== "standard") needs.push(`antenna-${r.antenna}`);
  for (const item of r.decor) needs.push(`decor-${item}`);
  return needs.every((id) => earned.includes(id));
}
/** Earned rewards survive deleting a custom game; restarting the adventure creates a clean state. */
export function awardRewards(state: GameState): GameState {
  const before = state.journey?.earned ?? [],
    earned = [...new Set([...before, ...availableRewards(state)])];
  if (earned.length === before.length) return state;
  return { ...state, journey: { ...state.journey, earned } };
}
