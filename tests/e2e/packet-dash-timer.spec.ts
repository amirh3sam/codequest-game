import { expect, test } from "@playwright/test";

test("Packet Dash keeps its countdown across jumps and pauses and only replays on request", async ({ page }) => {
  test.setTimeout(60_000);
  await page.clock.install();
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.evaluate(() => {
    type Harness = {
      __codequest: { game: { scene: { getScene(id: string): { callbacks: { interact(id: string): void } } } } };
    };
    (window as unknown as Harness).__codequest.game.scene.getScene("boot").callbacks.interact("arcade");
  });
  await page.getByRole("button", { name: "Play Packet Dash" }).click();
  await page.getByRole("button", { name: "Start 60-second run" }).click();
  await expect(page.getByRole("button", { name: "Run in progress" })).toBeDisabled();
  await page.clock.runFor(100);
  await page.clock.fastForward(12_000);
  const seconds = async () => Number((await page.locator(".arcade-time").innerText()).split(" ")[0]);
  expect(await seconds()).toBeLessThanOrEqual(48);
  await page.keyboard.press("Space");
  await page.getByRole("button", { name: "Jump over the signal glitches" }).click();
  await page.clock.fastForward(3000);
  expect(await seconds()).toBeLessThanOrEqual(45);

  await page.getByRole("button", { name: "Pause run", exact: true }).click();
  const readout = await page.locator(".arcade-score-strip").innerText();
  await page.clock.fastForward(10_000);
  await page.keyboard.press("Space");
  expect(await page.locator(".arcade-score-strip").innerText()).toBe(readout);
  await page.getByRole("button", { name: "Resume run", exact: true }).click();
  await page.clock.runFor(100);
  await page.clock.fastForward(5000);
  expect(await seconds()).toBeLessThanOrEqual(40);

  // Losing browser focus pauses the same round instead of replacing it with a fresh one.
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  const pausedTime = await seconds();
  await page.clock.fastForward(8000);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  expect(await seconds()).toBe(pausedTime);
  await page.getByRole("button", { name: "Resume run", exact: true }).click();
  await page.clock.runFor(100);
  await page.clock.fastForward(60_000);
  await expect(page.locator(".arcade-time")).toHaveText("0 SEC");
  await expect(page.locator(".arcade-feedback")).toContainText("Run over");
  await expect(page.getByRole("button", { name: "Jump over the signal glitches" })).toBeDisabled();
  await page.keyboard.press("Space");
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(".arcade-time")).toHaveText("0 SEC");
  await page.getByRole("button", { name: "Run again", exact: true }).click();
  await expect(page.locator(".arcade-time")).toHaveText("60 SEC");
});
