import type { Lang } from "../runners/types";
import { arcadeBuilderFiles, arcadeMilestone } from "./arcade-builder";

export type ProjectQuestStep = { title: string; prompt: string; hint: string; expectedOutput: string };
export type ProjectQuest = {
  id: string;
  title: string;
  description: string;
  entryPath: Record<Lang, string>;
  files(lang: Lang): Record<string, string>;
  steps: readonly ProjectQuestStep[];
};

const MAIN_PATH: Record<Lang, string> = {
  javascript: "src/Main.js",
  typescript: "src/Main.ts",
  python: "src/main.py",
  java: "src/Main.java",
};

const PROJECT_FILES: Record<Lang, Record<string, string>> = {
  javascript: {
    "src/Player.js":
      'export class Player {\n  constructor(name) { this.name = name; }\n  greeting() { return "Hi, " + this.name + "!"; }\n}\n',
    "src/Badge.js":
      'import { Player } from "./Player.js";\nexport class Badge {\n  constructor(player) { this.player = player; }\n  award() { return this.player.name + " earned a badge."; }\n}\n',
    "src/Main.js":
      'import { Player } from "./Player.js";\nimport { Badge } from "./Badge.js";\nconst player = new Player("Ada");\nconsole.log(player.greeting());\n',
  },
  typescript: {
    "src/Player.ts":
      'export class Player {\n  constructor(public name: string) {}\n  greeting(): string { return "Hi, " + this.name + "!"; }\n}\n',
    "src/Badge.ts":
      'import { Player } from "./Player.ts";\nexport class Badge {\n  constructor(private player: Player) {}\n  award(): string { return this.player.name + " earned a badge."; }\n}\n',
    "src/Main.ts":
      'import { Player } from "./Player.ts";\nimport { Badge } from "./Badge.ts";\nconst player = new Player("Ada");\nconsole.log(player.greeting());\n',
  },
  python: {
    "src/player.py":
      'class Player:\n    def __init__(self, name):\n        self.name = name\n\n    def greeting(self):\n        return f"Hi, {self.name}!"\n',
    "src/badge.py":
      'from player import Player\n\nclass Badge:\n    def __init__(self, player):\n        self.player = player\n\n    def award(self):\n        return self.player.name + " earned a badge."\n',
    "src/main.py":
      'from player import Player\nfrom badge import Badge\n\nplayer = Player("Ada")\nprint(player.greeting())\n',
  },
  java: {
    "src/Player.java":
      'class Player {\n    private final String name;\n    Player(String name) { this.name = name; }\n    String getName() { return name; }\n    String greeting() { return "Hi, " + name + "!"; }\n}\n',
    "src/Badge.java":
      'class Badge {\n    private final Player player;\n    Badge(Player player) { this.player = player; }\n    String award() { return player.getName() + " earned a badge."; }\n}\n',
    "src/Main.java":
      'public class Main {\n    public static void main(String[] args) {\n        Player player = new Player("Ada");\n        System.out.println(player.greeting());\n    }\n}\n',
  },
};

export const PROJECT_QUESTS: readonly ProjectQuest[] = [
  {
    id: "arcade-builder",
    title: "Arcade Builder",
    description:
      "Create a playable gem-collecting game. Edit GameRules, press Run, then choose Play my game. Run starts Main for this project. Goal 3–12, walls 0–12, speed 2–8, points 1–100, color #RRGGBB, theme night/garden. Export project for source files; save the game for its playable rules.",
    entryPath: MAIN_PATH,
    files: arcadeBuilderFiles,
    steps: [
      {
        title: "Name your game",
        prompt: "In GameRules change the name to Byte Run, then press Run. Next change the challenge below.",
        hint: "Keep the remaining rules unchanged for this milestone. GameRules supplies data; Main prints the game design as JSON.",
        expectedOutput: arcadeMilestone(5),
      },
      {
        title: "Change the challenge",
        prompt:
          "Change goal to 8 while keeping the other rules, then press Run again. Choose Play my game, save it and collect eight gems to win.",
        hint: "GameRules.goal controls how many gems appear. After the milestone, experiment with colors, walls, speed and scoring.",
        expectedOutput: arcadeMilestone(8),
      },
    ],
  },
  {
    id: "badge-builder",
    title: "Badge Builder",
    description: "Connect Player and Badge classes to create a reward that belongs to a character.",
    entryPath: MAIN_PATH,
    files: (lang) => ({ ...PROJECT_FILES[lang] }),
    steps: [
      {
        title: "Give the player a greeting",
        prompt: "Open Player and change its greeting so it prints exactly: Hello, Ada! Then run the project.",
        hint: "Find the return statement inside Player.greeting(). Change the first word, then save.",
        expectedOutput: "Hello, Ada!",
      },
      {
        title: "Award a badge through another class",
        prompt:
          "Update Main to create a Player named Kai and print Badge.award(). The exact result is: Kai earned the CodeQuest badge!",
        hint: "Pass the Player into a new Badge, then change Badge.award() to use the player's name and the CodeQuest badge title.",
        expectedOutput: "Kai earned the CodeQuest badge!",
      },
    ],
  },
];

export function projectQuestWorkspaceKey(adventureId: string, questId: string): string {
  return `codequest:project-workspace:v1:${adventureId}:${questId}`;
}

export function projectQuestProgressKey(adventureId: string, questId: string): string {
  return `codequest:project-progress:v1:${adventureId}:${questId}`;
}

export function readProjectQuestProgress(adventureId: string, questId: string): number {
  try {
    const value = Number(localStorage.getItem(projectQuestProgressKey(adventureId, questId)) ?? "0");
    return Number.isSafeInteger(value) ? Math.max(0, Math.min(value, 2)) : 0;
  } catch {
    return 0;
  }
}

export function saveProjectQuestProgress(adventureId: string, questId: string, completedSteps: number): boolean {
  if (!Number.isSafeInteger(completedSteps) || completedSteps < 0 || completedSteps > 2) return false;
  try {
    localStorage.setItem(projectQuestProgressKey(adventureId, questId), String(completedSteps));
    return true;
  } catch {
    return false;
  }
}

export function createProjectQuestWorkspace(quest: ProjectQuest, lang: Lang) {
  return {
    version: 1 as const,
    entryPath: quest.entryPath[lang],
    folders: ["src"],
    files: quest.files(lang),
  };
}
