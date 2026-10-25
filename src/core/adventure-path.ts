import type { GameState } from "./state";

export type AdventureMode = "guided" | "free";
export type AdventurePath = {
  version: 1;
  mode: AdventureMode;
  reviewTopic?: "variables" | "conditions" | "loops";
  help?: "tour" | "handbook";
};
export function isAdventurePath(value: unknown): value is AdventurePath {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const p = value as AdventurePath;
  return (
    p.version === 1 &&
    (p.mode === "guided" || p.mode === "free") &&
    (p.reviewTopic === undefined || ["variables", "conditions", "loops"].includes(p.reviewTopic)) &&
    (p.help === undefined || p.help === "tour" || p.help === "handbook")
  );
}
export const ADVENTURE_STEPS = [
  {
    id: "basics",
    title: "Rescue your first robot",
    learn: "Instructions and changing values",
    goal: "Follow a short guided repair. Arrange instructions, name your robot and charge its battery with real code.",
    expect: "Your robot delivers a repair kit. You can retry freely and ask for clues.",
    action: "Begin the guided robot rescue",
  },
  {
    id: "mission",
    title: "Make your first city repair",
    learn: "Move, meet your courier, run and submit",
    goal: "Meet your courier and create the training badge at Terminal 1. Run the code, read its output, then submit it.",
    expect: "Your first terminal turns on. Click the ground or use WASD/arrows to move; E or Space interacts nearby.",
    action: "Meet my courier and start the mission",
  },
  {
    id: "gate",
    title: "Teach the Smart Gate",
    learn: "If / else, comparisons and two conditions",
    goal: "Check who may enter the clinic. Test a delivery badge and enough energy, including exactly the minimum charge.",
    expect: "Your real output opens or closes the illustrated gate for each visitor.",
    action: "Continue to the Smart Gate",
  },
  {
    id: "robot",
    title: "Program a city delivery",
    learn: "Loops and delivery lists",
    goal: "Print three different terminal numbers from 1 to 8. Test your program, deploy the route, then return to the city to watch it finish.",
    expect: "Your named robot walks around city objects and saves each delivery checkpoint.",
    action: "Program my robot's delivery",
  },
  {
    id: "game",
    title: "Build and beat your own game",
    learn: "Connect classes and change game rules",
    goal: "Edit GameRules in the tablet. Run the project, choose Play my game, save it and collect every gem to win.",
    expect: "Your code changes a playable game. Your saved game and personal record belong to this adventure.",
    action: "Build my first playable game",
  },
  {
    id: "city",
    title: "Bring the city back online",
    learn: "Turn your learning into lasting changes",
    goal: "Reopen the workshop, repair the tram and reconnect the data exchange. Your completed gate, delivery and game supply the requirements.",
    expect: "Doors, tram service, network windows and courier dialogue remember your work.",
    action: "Restore my city services",
  },
  {
    id: "review",
    title: "Use your skills in fresh repairs",
    learn: "Practise values, decisions and loops",
    goal: "Complete three short review repairs. We suggest an idea to revisit, and test it with different starting values.",
    expect: "You get new examples and gentle clues, with unlimited retries and no hearts spent.",
    action: "Start my next review repair",
  },
  {
    id: "room",
    title: "Make the adventure yours",
    learn: "Claim the rewards you earned",
    goal: "Choose a hoodie, robot part or room wall. Add your earned decorations in your own developer room.",
    expect:
      "Your clothing and robot parts also appear in the city. Save a backup to keep your whole adventure on disk.",
    action: "Claim rewards in my developer room",
  },
] as const;
export type AdventureStepId = (typeof ADVENTURE_STEPS)[number]["id"];
export function pathCompletions(s: GameState): boolean[] {
  return [
    s.beginner?.status === "complete",
    s.areas.variables.solved.includes("variables-1"),
    s.journey?.gate?.status === "complete",
    (s.journey?.companion?.trips ?? 0) > 0,
    !!s.journey?.creations?.some((c) => c.won) || !!s.journey?.earned?.includes("robot-rose"),
    s.journey?.restored?.length === 3,
    Object.values(s.journey?.reviews ?? {}).reduce((sum, r) => sum + (r?.wins ?? 0), 0) >= 3,
    s.journey?.room !== undefined,
  ];
}
/** Recommendation comes from verified game progress, so refresh/import cannot invent skipped completions. */
export function adventurePath(s: GameState) {
  const done = pathCompletions(s),
    index = done.findIndex((v) => !v);
  return {
    done,
    index: index < 0 ? ADVENTURE_STEPS.length : index,
    completed: done.filter(Boolean).length,
    next: index < 0 ? null : ADVENTURE_STEPS[index],
  };
}
export const PATH_PREFERENCE = "codequest:path-preference:v1";
export function preferredAdventureMode(): AdventureMode {
  try {
    return localStorage.getItem(PATH_PREFERENCE) === "free" ? "free" : "guided";
  } catch {
    return "guided";
  }
}
export function saveAdventureMode(mode: AdventureMode): void {
  try {
    localStorage.setItem(PATH_PREFERENCE, mode);
  } catch {
    /* Per-adventure choice still saves in the adventure. */
  }
}
