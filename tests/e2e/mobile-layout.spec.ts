import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import type { Position } from "../../src/core/state";

type Scene = Phaser.Scene & { position: Position; getPosition(): Position; touchAxis: Position };
type Harness = { __codequest: { game: Phaser.Game } };
const snapshot = (page: Page) =>
  page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
    const hero = scene.children.getByName("player-hero") as Phaser.GameObjects.Image;
    const walking = hero.texture.key.includes("walk");
    return {
      ...scene.getPosition(),
      row: Math.floor(Number(hero.frame.name) / (walking ? 6 : 4)),
      walking,
      count: scene.children.list.filter((node) => node.name === "player-hero").length,
      paused: scene.scene.isPaused(),
    };
  });

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test.beforeEach(async ({ page }) => {
  // Exercise the manual-rotation fallback without changing the test browser's window.
  await page.addInitScript(() =>
    Object.defineProperty(screen.orientation, "lock", { configurable: true, value: undefined }),
  );
});

test("portrait shows menus and a rotate prompt; landscape keeps the city clear", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).tap();
  await expect(page.getByRole("heading", { name: "Rotate to play" })).toBeVisible();
  await expect(page.locator("#game")).toBeHidden();
  await expect(page.getByRole("button", { name: "Move up" })).toBeHidden();
  expect((await snapshot(page)).paused).toBe(true);
  await page.screenshot({ path: testInfo.outputPath("mobile-portrait-menu.png") });

  await page.getByRole("button", { name: "Open game menu" }).tap();
  await expect(page.getByRole("heading", { name: "Adventure menu" })).toBeVisible();
  await expect(page.locator(".mobile-game-menu .objective")).toBeVisible();
  await expect(page.locator(".mobile-game-menu").getByLabel("First steps guide")).toBeVisible();
  await page.getByRole("button", { name: "World map", exact: true }).tap();
  await expect(page.locator(".world-node")).toHaveCount(23);
  await page.getByRole("button", { name: "Close panel", exact: true }).tap();
  await expect(page.getByRole("heading", { name: "Rotate to play" })).toBeVisible();

  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator(".rotate-prompt")).toBeHidden();
  await expect(page.locator("#game")).toBeVisible();
  await expect(page.getByRole("button", { name: "Move up" })).toBeVisible();
  await expect(page.locator(".hud .field-guide")).toBeHidden();
  await expect(page.locator(".hud .objective")).toBeHidden();
  expect((await snapshot(page)).paused).toBe(false);
  expect((await page.locator(".hud").boundingBox())?.height).toBeLessThanOrEqual(56);
  await page.screenshot({ path: testInfo.outputPath("mobile-landscape-city.png") });
  await page.getByRole("button", { name: "Open game menu" }).tap();
  await expect(page.getByRole("button", { name: "Move up" })).toBeHidden();
  await page.getByRole("button", { name: "Skip guide" }).tap();
  await expect(page.locator(".mobile-game-menu .field-guide")).toHaveCount(0);
  await page.getByRole("button", { name: "Resume adventure", exact: true }).tap();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Rotate to play" })).toBeVisible();
  expect((await snapshot(page)).paused).toBe(true);
});

test("landscape is requested when supported and rejection leaves a usable rotate menu", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => {
    Object.defineProperty(document.documentElement, "requestFullscreen", { value: () => Promise.resolve() });
    Object.defineProperty(screen.orientation, "lock", {
      configurable: true,
      value: (value: string) => {
        document.documentElement.dataset.orientationRequest = value;
        return Promise.reject(new Error("Orientation lock unavailable"));
      },
    });
  });
  await page.getByRole("button", { name: "Start adventure", exact: true }).tap();
  await expect(page.locator("html")).toHaveAttribute("data-orientation-request", "landscape");
  await expect(page.locator(".rotate-card p")).toContainText("Auto-rotate");
  await page.getByRole("button", { name: "Play in landscape", exact: true }).tap();
  await expect(page.getByRole("heading", { name: "Rotate to play" })).toBeVisible();
  await page.getByRole("button", { name: "Open game menu" }).tap();
  await expect(page.getByRole("heading", { name: "Adventure menu" })).toBeVisible();
});

test("reduced-motion touch facing survives cancelled holds and phone rotation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).tap();
  const up = page.getByRole("button", { name: "Move up", exact: true });
  const before = await snapshot(page);
  await up.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch", button: 0 });
  await expect.poll(async () => (await snapshot(page)).row).toBe(3);
  await expect.poll(async () => (await snapshot(page)).y).toBeLessThan(before.y - 8);
  expect((await snapshot(page)).walking).toBe(false);
  await up.dispatchEvent("pointercancel", { pointerId: 7, pointerType: "touch", button: 0 });
  const cancelled = await snapshot(page);
  await page.waitForTimeout(100);
  expect((await snapshot(page)).y).toBe(cancelled.y);
  await up.dispatchEvent("pointerdown", { pointerId: 8, pointerType: "touch", button: 0 });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Rotate to play" })).toBeVisible();
  const rotated = await snapshot(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole("button", { name: "Move up" })).toBeVisible();
  await page.waitForTimeout(150);
  expect((await snapshot(page)).y).toBe(rotated.y);
  expect((await snapshot(page)).row).toBe(3);
});

for (const kind of ["Boy", "Girl"] as const) {
  test(`${kind} turns and walks in all four directions with touch holds and short taps`, async ({ page }, testInfo) => {
    test.setTimeout(60_000);
    await page.setViewportSize({ width: 844, height: 390 });
    await page.goto("/");
    await page.getByRole("button", { name: `${kind} hero`, exact: true }).tap();
    await page.getByRole("button", { name: "Start adventure", exact: true }).tap();
    const client = await page.context().newCDPSession(page);
    for (const [label, axis, sign, row] of [
      ["Move up", "y", -1, 3],
      ["Move right", "x", 1, 2],
      ["Move left", "x", -1, 1],
      ["Move down", "y", 1, 0],
    ] as const) {
      await page.evaluate(() => {
        const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
        scene.position = { x: 154, y: 420 };
        scene.cameras.main.centerOn(154, 420);
      });
      const before = await snapshot(page);
      const control = page.getByRole("button", { name: label, exact: true });
      const bounds = await control.boundingBox();
      if (!bounds) throw new Error("Missing touch control");
      await client.send("Input.dispatchTouchEvent", {
        type: "touchStart",
        touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
      });
      await expect.poll(async () => (await snapshot(page)).row).toBe(row);
      await expect.poll(async () => (await snapshot(page)).walking).toBe(true);
      await page.waitForTimeout(220);
      const held = await snapshot(page);
      expect((held[axis] - before[axis]) * sign).toBeGreaterThan(5);
      expect(held.count).toBe(1);
      await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
      await expect.poll(async () => (await snapshot(page)).walking).toBe(false);
      const stopped = await snapshot(page);
      await page.waitForTimeout(150);
      const after = await snapshot(page);
      expect(after.row).toBe(row);
      expect(Math.abs(after[axis] - stopped[axis])).toBeLessThan(1);
      if (label === "Move up") await page.screenshot({ path: testInfo.outputPath(`${kind}-north-touch.png`) });
      // A quick tap also goes through the walking animation, with no instant 36px teleport.
      await page.evaluate(() => {
        const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as Scene;
        scene.position = { x: 154, y: 420 };
      });
      const tapBefore = await snapshot(page);
      await control.tap();
      await expect.poll(async () => (await snapshot(page)).walking, { intervals: [20, 50] }).toBe(true);
      expect((await snapshot(page)).row).toBe(row);
      await expect.poll(async () => (await snapshot(page)).walking).toBe(false);
      expect(((await snapshot(page))[axis] - tapBefore[axis]) * sign).toBeGreaterThan(8);
    }
  });
}
