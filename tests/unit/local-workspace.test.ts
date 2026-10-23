import { beforeEach, describe, expect, it } from "vitest";
import { combineProjectSources } from "../../src/runners/project-source";
import { createWorkspace, readWorkspace, writeWorkspace } from "../../src/ui/local-workspace";

describe("per-adventure project workspace", () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    Object.defineProperty(globalThis, "localStorage", {
      configurable: true,
      value: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    });
  });

  it("starts Java adventures with a main class that calls a separate model class", () => {
    const workspace = createWorkspace("src/Main.java", "public class Main {}");
    expect(workspace.files["src/Player.java"]).toContain("class Player");
    expect(workspace.files["src/Main.java"]).toContain("public class Main");
  });

  it("persists and reloads a nested file tree while rejecting unsafe paths", () => {
    const workspace = createWorkspace("src/practice.js", 'console.log("hello");');
    workspace.folders.push("src/models");
    workspace.files["src/models/Player.js"] = "class Player {}";
    workspace.files["../outside.js"] = "unsafe";
    expect(writeWorkspace("project", workspace)).toBe(true);
    const loaded = readWorkspace("project", createWorkspace("src/practice.js", "fallback"));
    expect(loaded.files["src/models/Player.js"]).toBe("class Player {}");
    expect(loaded.files["../outside.js"]).toBeUndefined();
    expect(loaded.folders).toContain("src/models");
  });

  it("resolves only local JS, TypeScript and Python imports from project files", () => {
    const js = combineProjectSources(
      'import { Player } from "./Player.js";\nconsole.log(new Player());',
      {
        "src/Player.js": "export class Player {}",
      },
      "javascript",
      "src/practice.js",
    );
    expect(js).toContain("class Player {}");
    expect(js).not.toContain("import { Player }");
    const python = combineProjectSources(
      "from player import Player\nprint(Player())",
      {
        "src/player.py": "class Player: pass",
      },
      "python",
      "src/practice.py",
    );
    expect(python).toContain("class Player: pass");
    expect(python).not.toContain("from player import Player");
    const external = combineProjectSources('import { Player } from "./Player.js";', {}, "javascript");
    expect(external).toContain('import { Player } from "./Player.js";');
  });
});
