import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { loadArea } from "../../src/content/loader";
import { WORLD_LEVELS } from "../../src/content/world-levels";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { AREA_IDS } from "../../src/core/rules";
import { createGame, type Position } from "../../src/core/state";
import type { canStandAt, moveWithCollisions, Solid } from "../../src/game/collision";
import { districtLayout } from "../../src/game/district-layout";
import type { findWalkingRoute } from "../../src/game/navigation";
import { openAdventureTool } from "./helpers/adventure-tools";

type Scene = Phaser.Scene & {
  position: Position;
  getPosition(): Position;
  worldSolids(): Solid[];
  tapTarget: Position | null;
  route: Position[];
};
type Harness = {
  __codequest: {
    game: Phaser.Game;
    navigation: { plan: typeof findWalkingRoute; move: typeof moveWithCollisions; stand: typeof canStandAt };
  };
};
test.use({ reducedMotion: "reduce" });

const position = (page: Page) =>
  page.evaluate(() => ((window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene).getPosition());

async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.getByRole("button", { name: "Skip guide", exact: true }).click();
  await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
    scene.position = { x: 460, y: 330 };
    scene.cameras.main.stopFollow().centerOn(600, 420);
  });
}

async function clickWorld(page: Page, target: Position) {
  const canvas = await page.locator("#game canvas").boundingBox();
  if (!canvas) throw new Error("Missing game canvas");
  const point = await page.evaluate((target) => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
    const camera = scene.cameras.main;
    return {
      x: camera.x + (target.x - camera.scrollX) * camera.zoom,
      y: camera.y + (target.y - camera.scrollY) * camera.zoom,
      width: scene.scale.width,
      height: scene.scale.height,
    };
  }, target);
  await page.mouse.click(
    canvas.x + (point.x / point.width) * canvas.width,
    canvas.y + (point.y / point.height) * canvas.height,
  );
}

test("a map click shows its destination and walks around the planter to the exact diagonal point", async ({
  page,
}, testInfo) => {
  await start(page);
  const target = { x: 750, y: 445 };
  await clickWorld(page, target);
  const route = await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
    const marker = scene.children.getByName("click-destination") as Phaser.GameObjects.Container;
    return {
      visible: marker.visible,
      x: marker.x,
      y: marker.y,
      adjusted: marker.getData("adjusted"),
      points: scene.route,
    };
  });
  expect(route.visible).toBe(true);
  expect(Math.hypot(route.x - target.x, route.y - target.y)).toBeLessThan(2);
  expect(route.adjusted).toBe(false);
  expect(route.points.length).toBeGreaterThan(1);
  await page.screenshot({ path: testInfo.outputPath("click-destination-route.png") });
  await expect
    .poll(
      async () => {
        const p = await position(page);
        return Math.hypot(p.x - target.x, p.y - target.y);
      },
      { timeout: 15000 },
    )
    .toBeLessThan(2);
});

test("a blocked click chooses a reachable place and keyboard input immediately replaces a route", async ({ page }) => {
  await start(page);
  await clickWorld(page, { x: 600, y: 390 });
  const goal = await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
    const marker = scene.children.getByName("click-destination") as Phaser.GameObjects.Container;
    return { x: marker.x, y: marker.y, adjusted: marker.getData("adjusted") };
  });
  expect(goal.adjusted).toBe(true);
  await expect
    .poll(
      async () => {
        const p = await position(page);
        return Math.hypot(p.x - goal.x, p.y - goal.y);
      },
      { timeout: 15000 },
    )
    .toBeLessThan(1);
  await clickWorld(page, { x: 900, y: 510 });
  await page.keyboard.down("w");
  await expect
    .poll(() =>
      page.evaluate(() => {
        const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
        return scene.tapTarget;
      }),
    )
    .toBeNull();
  await page.keyboard.up("w");
  await openAdventureTool(page, "Progress");
  expect(
    await page.evaluate(
      () => ((window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene).tapTarget,
    ),
  ).toBeNull();
});

test("all 23 maps have collision-safe routes from their entrance to every task and boss", async ({ page }) => {
  test.setTimeout(120_000);
  const base = createGame("javascript", { kind: "girl", name: "Pathfinder" }, new Date().toISOString());
  const state = {
    ...base,
    adventureId: "navigation-audit",
    areas: Object.fromEntries(
      AREA_IDS.map((id) => [
        id,
        { ...base.areas[id], solved: loadArea(base.lang, id).tasks.map((task) => task.id), bossDefeated: true },
      ]),
    ),
  };
  await page.goto("/");
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [state] })),
    { key: ADVENTURES_KEY, state },
  );
  await page.reload();
  await page.locator(".title-adventure-row").filter({ hasText: "Pathfinder" }).click();
  await page.evaluate(() => (window as unknown as Harness).__codequest.game.loop.sleep());
  const failures: string[] = [];
  let checked = 0;
  for (const level of WORLD_LEVELS) {
    await page.getByRole("button", { name: "World map", exact: true }).click();
    await page.locator(`.world-node[data-level-id="${level.id}"]`).click();
    const layout = districtLayout(level.id);
    const result = await page.evaluate(
      ({ layout, id }) => {
        const api = (window as unknown as Harness).__codequest;
        const scene = api.game.scene.getScene("boot") as Scene;
        const world = { bounds: layout.bounds, solids: scene.worldSolids() };
        const failures: string[] = [];
        for (const [index, target] of [...layout.tasks, layout.boss].entries()) {
          const route = api.navigation.plan(layout.spawn, target, world);
          if (!route || Math.hypot(route.destination.x - target.x, route.destination.y - target.y) > 68) {
            failures.push(`${id} / station ${index + 1}: no interaction route`);
            continue;
          }
          let position = { ...layout.spawn };
          for (const point of route.points) {
            for (let tick = 0; tick < 3000; tick++) {
              const dx = point.x - position.x,
                dy = point.y - position.y,
                length = Math.hypot(dx, dy);
              if (length < 0.1) break;
              const step = Math.min(3, length);
              const next = api.navigation.move(position, (dx / length) * step, (dy / length) * step, world);
              if (!api.navigation.stand(next, world) || Math.hypot(next.x - position.x, next.y - position.y) < 0.001) {
                failures.push(`${id} / station ${index + 1}: blocked during walk`);
                break;
              }
              position = next;
            }
            if (Math.hypot(position.x - point.x, position.y - point.y) > 0.3) {
              failures.push(`${id} / station ${index + 1}: missed waypoint`);
              break;
            }
          }
        }
        return failures;
      },
      { layout, id: level.id },
    );
    failures.push(...result);
    checked += 9;
  }
  expect(failures).toEqual([]);
  expect(checked).toBe(207);
});
