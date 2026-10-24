import { describe, expect, it } from "vitest";
import { loadArea } from "../../src/content/loader";
import { STUDY_CURRICULUM } from "../../src/content/study-curriculum";
import { WORLD_LEVELS } from "../../src/content/world-levels";
import { ADVENTURES_KEY, loadAdventures } from "../../src/core/adventures";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { AREA_IDS, STORY_AREA_IDS, STUDY_AREA_IDS } from "../../src/core/rules";
import { isGameState } from "../../src/core/save";
import { createGame, defeatBoss, enterArea, isAreaUnlocked, solveTask } from "../../src/core/state";
import { districtLayout, portalArrivalPosition } from "../../src/game/district-layout";

const timestamp = "2026-10-24T01:00:00Z";

describe("23 playable city districts", () => {
  it("maps every world card to eight real tasks, a separate boss and a distinct course route", () => {
    expect(WORLD_LEVELS.map((level) => level.id)).toEqual(AREA_IDS);
    expect(AREA_IDS).toHaveLength(23);
    expect(STUDY_AREA_IDS.map((id) => id.slice(6))).toEqual(STUDY_CURRICULUM.map((topic) => topic.id));
    for (const lang of ["javascript", "typescript", "python", "java"] as const) {
      for (const [index, id] of AREA_IDS.entries()) {
        const area = loadArea(lang, id);
        expect(area.order).toBe(index + 1);
        expect(area.tasks).toHaveLength(8);
        expect(new Set([...area.tasks.map((task) => task.id), area.boss.id]).size).toBe(9);
        expect(area.boss.tests.length).toBeGreaterThan(0);
        expect(districtLayout(id).tasks).toHaveLength(8);
      }
    }
    expect(new Set(STUDY_AREA_IDS.map((id) => JSON.stringify(districtLayout(id).tasks))).size).toBe(16);
  });

  it("allows return travel before the current boss is defeated and records the portal arrival", () => {
    let state = createGame("javascript", { kind: "boy", name: "Ada" }, timestamp);
    const first = loadArea(state.lang, "variables");
    for (const task of first.tasks) state = solveTask(state, first, task.id, timestamp);
    state = defeatBoss(state, first, timestamp);
    state = enterArea(state, "conditions", timestamp, portalArrivalPosition("conditions"));
    expect(state.position).toEqual(portalArrivalPosition("conditions"));
    expect(state.areas.conditions.bossDefeated).toBe(false);
    expect(isAreaUnlocked(state, "conditions")).toBe(true);
    expect(enterArea(state, "loops", timestamp, portalArrivalPosition("loops"))).toBe(state);
    const returning = enterArea(state, "variables", timestamp, portalArrivalPosition("variables"));
    expect(returning.currentArea).toBe("variables");
    expect(returning.position).toEqual(portalArrivalPosition("variables"));
    expect(returning.areas).toBe(state.areas);
    expect(enterArea(returning, "variables", timestamp, portalArrivalPosition("variables")).position).toEqual(
      returning.position,
    );
  });

  it("upgrades seven-map libraries and their saved tablet progress without rewriting the original", () => {
    const base = createGame("javascript", { kind: "girl", name: "Nova" }, timestamp);
    const legacyAreas = Object.fromEntries(
      STORY_AREA_IDS.map((id) => [
        id,
        {
          ...base.areas[id],
          solved: loadArea(base.lang, id).tasks.map((task) => task.id),
          bossDefeated: true,
        },
      ]),
    );
    const legacy = { ...base, adventureId: "existing-player", areas: legacyAreas };
    const data = new Map<string, string>([
      [ADVENTURES_KEY, JSON.stringify({ version: 1, adventures: [legacy] })],
      ["codequest:study-progress:v2:existing-player", JSON.stringify({ operators: 8, "decision-statements": 3 })],
      ["codequest:study-bosses:v1:existing-player", JSON.stringify(["operators"])],
      ["codequest:study-draft:v2:existing-player:javascript:decision-statements:3", "console.log('saved');"],
    ]);
    const original = data.get(ADVENTURES_KEY);
    const library = loadAdventures({
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
    });
    expect(library.status).toBe("loaded");
    if (library.status !== "loaded") throw new Error("Migration failed");
    const migrated = library.adventures[0];
    if (!migrated) throw new Error("Missing upgraded adventure");
    expect(isGameState(migrated)).toBe(true);
    expect(migrated.areas.variables).toEqual(legacyAreas.variables);
    expect(migrated.areas["study-operators"].solved).toHaveLength(8);
    expect(migrated.areas["study-operators"].bossDefeated).toBe(true);
    expect(migrated.areas["study-decision-statements"].solved).toHaveLength(3);
    expect(migrated.areas["study-decision-statements"].drafts["study-decision-statements-4"]).toBe(
      "console.log('saved');",
    );
    expect(migrated.areas["study-loops"].solved).toHaveLength(0);
    expect(data.get(ADVENTURES_KEY)).toBe(original);
    const restored = parseAdventureBackup(JSON.stringify(makeAdventureBackup(migrated)));
    expect(restored.state).toEqual(migrated);
  });
});
