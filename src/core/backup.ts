import type { GameState } from "./state";

export type AdventureBackup = {
  format: "codequest-adventure";
  version: 1;
  exportedAt: string;
  state: GameState;
  tabletDraft?: string;
};

const MAX_BACKUP_CHARS = 2_000_000;

export function makeAdventureBackup(state: GameState, tabletDraft?: string): AdventureBackup {
  return {
    format: "codequest-adventure",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
    ...(tabletDraft === undefined ? {} : { tabletDraft }),
  };
}

export function parseAdventureBackup(source: string): AdventureBackup {
  if (source.length > MAX_BACKUP_CHARS) throw new Error("This backup is too large to import.");
  const value: unknown = JSON.parse(source);
  if (!value || typeof value !== "object") throw new Error("This file is not a CodeQuest backup.");
  const backup = value as Partial<AdventureBackup>;
  if (backup.format !== "codequest-adventure" || backup.version !== 1 || !isGameState(backup.state))
    throw new Error("This file is not a supported CodeQuest adventure backup.");
  if (backup.tabletDraft !== undefined && (typeof backup.tabletDraft !== "string" || backup.tabletDraft.length > 64000))
    throw new Error("The tablet draft in this backup is invalid.");
  return backup as AdventureBackup;
}

function isGameState(value: unknown): value is GameState {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<GameState>;
  return (
    state.version === 1 &&
    ["javascript", "typescript", "python", "java"].includes(state.lang ?? "") &&
    typeof state.hero?.name === "string" &&
    (state.hero?.kind === "boy" || state.hero?.kind === "girl") &&
    !!state.areas &&
    typeof state.areas === "object" &&
    !!state.currentArea &&
    !!state.position &&
    typeof state.updatedAt === "string"
  );
}
