import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { loadArea } from "../../src/content/loader";
import { createGame, defeatBoss, solveTask } from "../../src/core/state";

async function enterLogic(page: Page): Promise<void> {
  const variables = loadArea("javascript", "variables");
  let state = createGame("javascript", { kind: "girl", name: "Ada" }, "2026-10-22T12:00:00Z");
  for (const task of variables.tasks) state = solveTask(state, variables, task.id, state.updatedAt);
  state = defeatBoss(state, variables, state.updatedAt);
  await page.goto("/");
  await page.evaluate((state) => localStorage.setItem("codequest:v1:javascript", JSON.stringify(state)), state);
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator(".world-node").filter({ hasText: "Logic Junction" }).click();
  await expect(page.locator(".location-name")).toHaveText("Logic Junction");
}
test("travels to Logic Junction, uses its terminal, reloads and clears the Router", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const conditions = loadArea("javascript", "conditions"),
    loops = loadArea("javascript", "loops");
  await enterLogic(page);
  await page.keyboard.down("d");
  await page.waitForFunction(() => {
    const scene = (
      window as unknown as {
        __codequest: { game: { scene: { getScene(k: string): { getPosition(): { x: number } } } } };
      }
    ).__codequest.game.scene.getScene("boot");
    return scene.getPosition().x >= 305;
  });
  await page.keyboard.up("d");
  await page.screenshot({ path: testInfo.outputPath("logic-junction.png") });
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: "Check a laptop battery", exact: true })).toBeVisible();
  for (const [index, task] of conditions.tasks.entries()) {
    await page.getByLabel("Your code").fill(task.solution);
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    await expect(page.locator(".feedback")).toContainText("Correct!");
    if (index === 0) {
      await page.reload();
      await page.locator(".title-adventure-row").first().click();
      await expect(page.locator(".location-name")).toHaveText("Logic Junction");
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
      await page.getByRole("button", { name: "Skip guide", exact: true }).click();
      await page.keyboard.press("t");
      await page.getByRole("tab", { name: "Missions", exact: true }).click();
      await page.getByRole("button", { name: "Work on Choose a sign-in screen", exact: true }).click();
    } else
      await page.getByRole("button", { name: index < 7 ? "Next task →" : "Inspect the Router →", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "The Router", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Get next hint · 1 gem", exact: true }).click();
  await page.getByLabel("Your code").fill(conditions.boss.solution);
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Logic Junction is online!" })).toBeVisible();
  await page.getByRole("button", { name: "Continue journey", exact: true }).click();
  await expect(page.locator(".world-node").filter({ hasText: "Loop Transit" })).toContainText("Explore district");
  await page.locator(".world-node").filter({ hasText: "Loop Transit" }).click();
  await expect(page.locator(".location-name")).toHaveText("Loop Transit");
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
  await page.keyboard.down("d");
  await page.waitForFunction(() => {
    const scene = (
      window as unknown as {
        __codequest: { game: { scene: { getScene(k: string): { getPosition(): { x: number } } } } };
      }
    ).__codequest.game.scene.getScene("boot");
    return scene.getPosition().x >= 310;
  });
  await page.keyboard.up("d");
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: "Loops: checkpoint 1", exact: true })).toBeVisible();
  await page.getByLabel("Your code").fill(loops.tasks[0]?.solution ?? "");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Correct!");
  await page.getByRole("button", { name: "Back to district", exact: true }).click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator(".world-node").filter({ hasText: "Variable District" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "8");
  await expect(page.locator(".objective")).toContainText("district is online");
});

test("losing hearts in Logic Junction preserves the completed first district", async ({ page }) => {
  await enterLogic(page);
  await page.getByRole("button", { name: "Lesson", exact: true }).click();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: /1\. Check a laptop battery/ }).click();
  await page.getByLabel("Your code").fill('console.log("wrong");');
  for (let n = 0; n < 3; n++) {
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    if (n < 2) await expect(page.locator(".feedback")).toContainText("−1 heart");
  }
  await expect(page.getByRole("heading", { name: "A fresh start" })).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("codequest:v1:javascript") ?? "null"));
  expect(state.currentArea).toBe("conditions");
  expect(state.areas.conditions.hearts).toBe(3);
  expect(state.areas.conditions.lessonsFound).toBe(true);
  expect(state.areas.variables.bossDefeated).toBe(true);
  expect(state.areas.variables.solved).toHaveLength(8);
});

test("districts have different scenery and routes; every Logic terminal is reachable around solid objects", async ({
  page,
}) => {
  await enterLogic(page);
  const report = await page.evaluate(() => {
    const scene = (window as unknown as { __codequest: { game: Phaser.Game } }).__codequest.game.scene.getScene("boot");
    const navigation = scene as unknown as {
      getPosition(): { x: number; y: number };
      canStand(x: number, y: number): boolean;
    };
    const start = navigation.getPosition(),
      visited = new Set<string>(),
      queue = [start];
    visited.add(`${start.x}:${start.y}`);
    for (let index = 0; index < queue.length; index++) {
      const point = queue[index];
      if (!point) continue;
      for (const [dx, dy] of [
        [10, 0],
        [-10, 0],
        [0, 10],
        [0, -10],
      ]) {
        const x = point.x + (dx ?? 0),
          y = point.y + (dy ?? 0),
          key = `${x}:${y}`;
        if (!visited.has(key) && navigation.canStand(x, y)) {
          visited.add(key);
          queue.push({ x, y });
        }
      }
    }
    const targets = [...Array.from({ length: 8 }, (_, i) => `conditions-${i + 1}`), "lesson", "boss"];
    return {
      ground: (scene.children.getByName("district-ground") as Phaser.GameObjects.Image).texture.key,
      layers: scene.children.list.filter((object) => object.name === "district-ground").length,
      spawn: start,
      reachable: targets.map((id) => {
        const target = scene.children.getByName(id) as Phaser.GameObjects.Container;
        return queue.some((point) => Math.hypot(point.x - target.x, point.y - target.y) <= 60);
      }),
      hubSolid: !navigation.canStand(768, 400),
      outsideSolid: !navigation.canStand(220, 650),
    };
  });
  expect(report).toMatchObject({
    ground: "logic-ground",
    layers: 1,
    spawn: { x: 220, y: 550 },
    hubSolid: true,
    outsideSolid: true,
  });
  expect(report.reachable).toEqual(Array(10).fill(true));
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator(".world-node").filter({ hasText: "Variable District" }).click();
  const restored = await page.evaluate(() => {
    const scene = (window as unknown as { __codequest: { game: Phaser.Game } }).__codequest.game.scene.getScene("boot");
    return {
      ground: (scene.children.getByName("district-ground") as Phaser.GameObjects.Image).texture.key,
      layers: scene.children.list.filter((object) => object.name === "district-ground").length,
      hub: Boolean(scene.children.getByName("routing-control-hub")),
    };
  });
  expect(restored).toEqual({ ground: "adventure-world", layers: 1, hub: false });
});
