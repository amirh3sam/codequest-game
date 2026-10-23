import { beforeEach, describe, expect, it } from "vitest";
import { combineProjectSources } from "../../src/runners/project-source";
import {
  createWorkspace,
  deleteWorkspaceEntry,
  javaClassTemplate,
  parseWorkspaceShare,
  readWorkspace,
  renameWorkspaceEntry,
  serializeWorkspaceShare,
  writeWorkspace,
} from "../../src/ui/local-workspace";

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

  it("creates Java class scaffolds from the folder package and file name", () => {
    expect(javaClassTemplate("src/claude/Test4.java")).toBe(
      "package claude;\n\nimport java.util.*;\n\npublic class Test4 {\n}\n",
    );
    expect(javaClassTemplate("src/Helper.java")).toBe("import java.util.*;\n\npublic class Helper {\n}\n");
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

  it("exports and validates shareable projects for the selected language", () => {
    const workspace = createWorkspace("src/practice.js", 'console.log("hello");');
    const share = serializeWorkspaceShare(workspace, "javascript");
    expect(parseWorkspaceShare(share, "javascript")).toEqual(workspace);
    expect(() => parseWorkspaceShare(share, "python")).toThrow("different coding language");
    const unsafe = JSON.parse(share) as { workspace: { files: Record<string, string> } };
    unsafe.workspace.files["../../secrets.txt"] = "no";
    expect(parseWorkspaceShare(JSON.stringify(unsafe), "javascript").files["../../secrets.txt"]).toBeUndefined();
    expect(() => parseWorkspaceShare("x".repeat(2_000_001), "javascript")).toThrow("too large");
  });

  it("renames and deletes project entries with nested contents and keeps the run entry in sync", () => {
    const workspace = createWorkspace("src/Main.java", "class Main {}");
    workspace.folders.push("src/models");
    workspace.files["src/models/Badge.java"] = "class Badge {}";
    expect(renameWorkspaceEntry(workspace, "src/models", "entities", "folder")).toBe("src/entities");
    expect(workspace.files["src/entities/Badge.java"]).toBe("class Badge {}");
    expect(workspace.folders).toContain("src/entities");
    expect(renameWorkspaceEntry(workspace, "src/Main.java", "App.java", "file")).toBe("src/App.java");
    expect(workspace.entryPath).toBe("src/App.java");
    expect(renameWorkspaceEntry(workspace, "src/App.java", "entities", "file")).toBeNull();
    expect(deleteWorkspaceEntry(workspace, "src/entities", "folder")).toBe(true);
    expect(workspace.files["src/entities/Badge.java"]).toBeUndefined();
    expect(workspace.folders).not.toContain("src/entities");
  });
});
