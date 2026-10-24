import { expect, test } from "@playwright/test";
import type Phaser from "phaser";
import { loadArea } from "../../src/content/loader";
import { WORLD_LEVELS } from "../../src/content/world-levels";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { AREA_IDS } from "../../src/core/rules";
import { createGame, type Position } from "../../src/core/state";
import { portalArrivalPosition } from "../../src/game/district-layout";
import { openAdventureTool } from "./helpers/adventure-tools";
import { mapLayoutConflicts } from "./helpers/map-clearance";

type WorldScene = Phaser.Scene & {
  getPosition(): Position;
  canStand(x: number, y: number): boolean;
  portalPosition: Position;
  portalActive: boolean;
};
type Harness = { __codequest: { game: Phaser.Game } };
test.use({ reducedMotion: "reduce" });

test("all 23 world cards enter playable maps and arrive safely beside active transit buildings", async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  const base = createGame("javascript", { kind: "girl", name: "Nova" }, new Date().toISOString());
  const state = {
    ...base,
    adventureId: "all-city-maps",
    position: portalArrivalPosition("variables"),
    areas: Object.fromEntries(
      AREA_IDS.map((id, index) => [
        id,
        {
          ...base.areas[id],
          solved: index < 22 ? loadArea(base.lang, id).tasks.map((task) => task.id) : [],
          bossDefeated: index < 22,
        },
      ]),
    ),
  };
  await page.goto("/");
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [state] })),
    { key: ADVENTURES_KEY, state },
  );
  await page.reload();
  await page.locator(".title-adventure-row").filter({ hasText: "Nova" }).click();
  const colors: number[] = [];
  const layoutConflicts: Record<string, string[]> = {};
  for (const level of WORLD_LEVELS) {
    await page.getByRole("button", { name: "World map", exact: true }).click();
    await expect(page.locator(".world-node")).toHaveCount(23);
    await page.locator(`.world-node[data-level-id="${level.id}"]`).click();
    await expect(page.locator(".location-name")).toHaveText(level.name);
    const result = await page.evaluate((id) => {
      const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as WorldScene;
      const position = scene.getPosition();
      const ground = scene.children.getByName(`${id}-ground`) as Phaser.GameObjects.Rectangle | null;
      return {
        tasks: Array.from({ length: 8 }, (_, index) => Boolean(scene.children.getByName(`${id}-${index + 1}`))),
        boss: Boolean(scene.children.getByName("boss")),
        active: scene.portalActive,
        distance: Math.hypot(position.x - scene.portalPosition.x, position.y - scene.portalPosition.y),
        safe: scene.canStand(position.x, position.y),
        color: ground?.fillColor,
      };
    }, level.id);
    expect(result.tasks).toEqual(Array(8).fill(true));
    expect(result.boss).toBe(true);
    expect(result.active).toBe(true);
    expect(result.safe).toBe(true);
    expect(result.distance).toBeLessThan(115);
    const conflicts = await mapLayoutConflicts(page);
    if (conflicts.length) layoutConflicts[level.id] = conflicts;
    if (level.id.startsWith("study-")) {
      if (result.color === undefined) throw new Error("Missing district ground color");
      colors.push(result.color);
    }
    if (["variables", "conditions", "arrays", "study-operators", "study-abstraction-polymorphism"].includes(level.id)) {
      await page.evaluate(() => {
        const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
        scene.cameras.main.stopFollow().setZoom(0.625).centerOn(768, 432);
      });
      await page.locator("#ui").evaluate((node) => {
        node.style.visibility = "hidden";
      });
      await page.screenshot({ path: testInfo.outputPath(`${level.id}-layout.png`) });
      await page.locator("#ui").evaluate((node) => {
        node.style.visibility = "";
      });
      await page.evaluate(() =>
        (window as unknown as Harness).__codequest.game.scene.getScene("boot").cameras.main.setZoom(1),
      );
    }
  }
  expect(new Set(colors).size).toBe(16);
  expect(layoutConflicts, "All 23 maps: object, label and arrival clearance").toEqual({});
  await openAdventureTool(page, "Progress");
  await expect(page.locator(".skill-track")).toHaveCount(23);
  await expect(page.locator(".skill-progress-summary")).toContainText("176 / 184 missions");
});
