import { DEFAULT_DESIGN } from "../core/arcade-creation";
import type { Lang } from "../runners/types";

/** Two files make the connection between game rules and the program exporting them explicit. */
export function arcadeBuilderFiles(lang: Lang): Record<string, string> {
  if (lang === "python")
    return {
      "src/game_rules.py": `class GameRules:\n    name = "My Byte Run"\n    playerColor = "#6ee7ed"\n    goal = 5\n    obstacles = 6\n    speed = 4\n    points = 10\n    theme = "night"\n`,
      "src/main.py": `import json\nfrom game_rules import GameRules\n\nrules = {"format": "codequest-grid-game", "version": 1}\nfor key in ["name", "playerColor", "goal", "obstacles", "speed", "points", "theme"]:\n    rules[key] = getattr(GameRules, key)\nprint(json.dumps(rules, separators=(',', ':')))\n`,
    };
  if (lang === "java")
    return {
      "src/GameRules.java": `class GameRules {\n    static String name = "My Byte Run";\n    static String playerColor = "#6ee7ed";\n    static int goal = 5;\n    static int obstacles = 6;\n    static int speed = 4;\n    static int points = 10;\n    static String theme = "night";\n    static String quote(String s) { return "\\"" + s.replace("\\\\", "\\\\\\\\").replace("\\"", "\\\\\\"") + "\\""; }\n}\n`,
      "src/Main.java": `public class Main {\n    public static void main(String[] args) {\n        System.out.println("{\\"format\\":\\"codequest-grid-game\\",\\"version\\":1,\\"name\\":" + GameRules.quote(GameRules.name)\n            + ",\\"playerColor\\":" + GameRules.quote(GameRules.playerColor) + ",\\"goal\\":" + GameRules.goal\n            + ",\\"obstacles\\":" + GameRules.obstacles + ",\\"speed\\":" + GameRules.speed + ",\\"points\\":" + GameRules.points\n            + ",\\"theme\\":" + GameRules.quote(GameRules.theme) + "}");\n    }\n}\n`,
    };
  const ext = lang === "typescript" ? "ts" : "js";
  return {
    [`src/GameRules.${ext}`]: `export class GameRules {\n  name = "My Byte Run";\n  playerColor = "#6ee7ed";\n  goal = 5;\n  obstacles = 6;\n  speed = 4;\n  points = 10;\n  theme = "night";\n}\n`,
    [`src/Main.${ext}`]: `import { GameRules } from "./GameRules.${ext}";\nconst rules = new GameRules();\nconsole.log(JSON.stringify({ format: "codequest-grid-game", version: 1, ...rules }));\n`,
  };
}
export const arcadeMilestone = (goal: number) => JSON.stringify({ ...DEFAULT_DESIGN, name: "Byte Run", goal });
