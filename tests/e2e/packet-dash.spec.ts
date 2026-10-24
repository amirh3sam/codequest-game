import { expect, test } from "@playwright/test";
import type Phaser from "phaser";

type Harness = { __codequest: { position(): { x: number; y: number }; game: Phaser.Game } };

test.use({ reducedMotion: "reduce" });

test("finds the city arcade and plays a round of Packet Dash", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.locator('[data-language="javascript"]').click();
  await page.getByLabel("Developer name").fill("Runner");
  await page.getByRole("button", { name: "Start adventure" }).click();

  const position = () => page.evaluate(() => (window as unknown as Harness).__codequest.position());
  await expect.poll(async () => (await position()).y).toBeGreaterThan(600);

  // Use an exact real map click; polling a held key can overshoot the arcade's narrow interaction lane.
  const canvas = await page.locator("#game canvas").boundingBox();
  if (!canvas) throw new Error("Game canvas unavailable");
  const point = await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
    const camera = scene.cameras.main;
    return {
      x: (211 - camera.scrollX) * camera.zoom + camera.x,
      y: (375 - camera.scrollY) * camera.zoom + camera.y,
      width: scene.scale.width,
      height: scene.scale.height,
    };
  });
  await page.mouse.click(
    canvas.x + (point.x / point.width) * canvas.width,
    canvas.y + (point.y / point.height) * canvas.height,
  );
  await expect
    .poll(async () => Math.hypot((await position()).x - 211, (await position()).y - 375), { timeout: 12_000 })
    .toBeLessThan(6);
  await page.addStyleTag({ content: ".toast { display: none !important; }" });
  await page.screenshot({ path: testInfo.outputPath("codequest-arcade-map.png") });
  await page.keyboard.press("e");

  await expect(page.getByRole("heading", { name: "City Arcade" })).toBeVisible();
  await page.getByRole("button", { name: "Play Packet Dash" }).click();
  await expect(page.getByRole("heading", { name: "Packet Dash" })).toBeVisible();
  await expect(page.getByLabel(/Packet Dash runner/)).toBeVisible();
  await expect(page.locator(".arcade-combo")).toHaveText("COMBO 0/3");
  await expect(page.locator(".packet-dash")).toContainText("Every third bit makes a combo");
  await page.getByRole("button", { name: "Start 60-second run" }).click();
  await expect(page.locator(".arcade-feedback")).toContainText("Run!");
  await page.locator(".packet-dash").screenshot({ path: testInfo.outputPath("packet-dash-view.png") });
  await page.keyboard.press("Space");
  await expect(page.locator(".arcade-feedback")).toContainText("jump");
  await expect(page.locator(".arcade-score")).toContainText("SCORE");
  await page.getByRole("button", { name: "Arcade lobby", exact: true }).click();
  await page.getByRole("button", { name: "Play Signal Stack" }).click();
  await expect(page.getByRole("heading", { name: "Signal Stack" })).toBeVisible();
  await page.getByRole("button", { name: "Start a tower" }).click();
  await page.getByRole("button", { name: "Drop relay" }).click();
  await expect(page.locator(".arcade-score")).toHaveText("LEVEL 1");
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("codequest:v1:javascript") ?? "{}").games?.signalStackBest),
    )
    .toBe(1);
});
