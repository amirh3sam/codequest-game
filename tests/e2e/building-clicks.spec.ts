import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { dronePilot } from "../../src/content/drone-pilot";
import { loadArea } from "../../src/content/loader";
import { AREA_IDS } from "../../src/core/rules";
import type { createGame, Position } from "../../src/core/state";

type Scene = Phaser.Scene & {
  position: Position;
  communityBeacon: { position: Position };
  markers: { id: string; x: number; y: number; icon: Phaser.GameObjects.Image; pad: Phaser.GameObjects.Arc }[];
  portalPosition: Position;
  levelPortal: {
    sync(position: Position, active: boolean, level: number, visible: boolean): void;
    view: Phaser.GameObjects.Container;
  };
  setSession(state: ReturnType<typeof createGame>, area: ReturnType<typeof loadArea>, callbacks: unknown): void;
  callbacks: unknown;
};
type Harness = { __codequest: { game: Phaser.Game } };
test.use({ reducedMotion: "reduce" });
test.setTimeout(120_000);
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.getByRole("button", { name: "Skip guide", exact: true }).click();
}
async function frame(page: Page, point: Position, stand?: Position) {
  await page.evaluate(
    ({ point, stand }) =>
      new Promise<void>((resolve) => {
        const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
        if (stand) scene.position = stand;
        scene.cameras.main.stopFollow().centerOn(point.x, point.y - 54);
        scene.game.events.once("postrender", () => resolve());
      }),
    { point, stand },
  );
}
async function pointer(page: Page, point: Position, click = false) {
  const box = await page.locator("#game canvas").boundingBox();
  if (!box) throw new Error("Game canvas unavailable");
  const screen = await page.evaluate((point) => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
    const camera = scene.cameras.main;
    return {
      x: camera.x + (point.x - camera.scrollX) * camera.zoom,
      y: camera.y + (point.y - camera.scrollY) * camera.zoom,
      width: scene.scale.width,
      height: scene.scale.height,
    };
  }, point);
  const x = box.x + (screen.x / screen.width) * box.width,
    y = box.y + (screen.y / screen.height) * box.height;
  await page.mouse.move(x, y);
  if (click) await page.mouse.click(x, y);
}
const beacon = (page: Page) =>
  page.evaluate(
    () => ((window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene).communityBeacon.position,
  );

test("only the lighting console body opens it; the area below remains ordinary ground", async ({ page }, info) => {
  await start(page);
  const point = await beacon(page);
  await frame(page, point);
  for (const offset of [
    { x: 0, y: 40 },
    { x: 0, y: 10 },
    { x: 35, y: -40 },
    { x: 20, y: -16 },
  ]) {
    await pointer(page, { x: point.x + offset.x, y: point.y + offset.y });
    await expect(page.locator("#game canvas")).not.toHaveCSS("cursor", "pointer");
  }
  await pointer(page, { x: point.x, y: point.y + 40 }, true);
  await expect(page.locator(".overlay")).toBeHidden();
  await pointer(page, { x: point.x, y: point.y - 45 });
  await expect(page.locator("#game canvas")).toHaveCSS("cursor", "pointer");
  await page.screenshot({ path: info.outputPath("lighting-console-cursor.png") });
  await pointer(page, { x: point.x, y: point.y - 45 }, true);
  await expect(page.getByRole("heading", { name: "Community beacon · City lights", exact: true })).toBeVisible();
});

test("visible task, lesson, boss, arcade and courier artwork uses the pointer, with no hotspots below", async ({
  page,
}) => {
  await start(page);
  const markers = await page.evaluate(() =>
    ((window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene).markers.map(({ id, x, y }) => ({
      id,
      x,
      y,
    })),
  );
  for (const marker of markers) {
    await frame(page, marker);
    await pointer(page, { x: marker.x, y: marker.y + 18 });
    await expect(page.locator("#game canvas")).not.toHaveCSS("cursor", "pointer");
    await pointer(page, { x: marker.x, y: marker.y - 25 });
    await expect(page.locator("#game canvas")).toHaveCSS("cursor", "pointer");
  }
  const first = markers.find((marker) => marker.id === "variables-1");
  if (!first) throw new Error("Task 1 unavailable");
  await frame(page, first, { x: first.x, y: first.y + 45 });
  await pointer(page, { x: first.x, y: first.y - 25 }, true);
  await expect(page.getByLabel("Your code", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  const courier = dronePilot.world.courier;
  await frame(page, courier, { x: courier.x - 35, y: courier.y + 25 });
  await pointer(page, { x: courier.x, y: courier.y + 25 });
  await expect(page.locator("#game canvas")).not.toHaveCSS("cursor", "pointer");
  await pointer(page, { x: courier.x, y: courier.y - 30 });
  await expect(page.locator("#game canvas")).toHaveCSS("cursor", "pointer");
});

test("all 23 district consoles reject below-building coordinates and scaled transit ignores empty corners", async ({
  page,
}) => {
  test.setTimeout(90_000);
  await start(page);
  const results = await page.evaluate(
    ({ ids, areas }) => {
      const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
      const base = JSON.parse(localStorage.getItem("codequest:v1:javascript") ?? "{}") as ReturnType<typeof createGame>;
      const unlocked = { ...base.areas };
      for (const id of ids)
        unlocked[id] = { ...unlocked[id], solved: areas[id].tasks.map((task) => task.id), bossDefeated: true };
      return ids.map((id) => {
        scene.setSession({ ...base, areas: unlocked, currentArea: id }, areas[id], scene.callbacks);
        const group = scene.children.getByName("community-beacon") as Phaser.GameObjects.Container;
        const hit = (x: number, y: number) => scene.input.manager.pointWithinHitArea(group, x, y);
        return { id, screen: hit(0, -45), base: hit(0, -7), below: hit(0, 40), corner: hit(20, -16) };
      });
    },
    { ids: AREA_IDS, areas: Object.fromEntries(AREA_IDS.map((id) => [id, loadArea("javascript", id)])) },
  );
  for (const result of results)
    expect(result).toEqual({ id: result.id, screen: true, base: true, below: false, corner: false });
  const position = await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
    return scene.portalPosition;
  });
  await frame(page, position);
  await pointer(page, { x: position.x + 60 * 0.65, y: position.y - 110 * 0.65 });
  await expect(page.locator("#game canvas")).not.toHaveCSS("cursor", "pointer");
  await pointer(page, { x: position.x, y: position.y - 42 * 0.65 });
  await expect(page.locator("#game canvas")).toHaveCSS("cursor", "pointer");
  await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
    scene.levelPortal.sync(scene.portalPosition, false, 1, true);
  });
  await pointer(page, { x: position.x, y: position.y - 50 * 0.65 });
  await expect(page.locator("#game canvas")).not.toHaveCSS("cursor", "pointer");
});
