declare const Buffer: { from(input: string): Uint8Array };

import { expect, test } from "@playwright/test";

test.describe("mobile movement", () => {
  test.use({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
  test("tap controls move the developer", async ({ page }) => {
    await page.goto("/");
    await page.locator('[data-language="javascript"]').click();
    await page.getByLabel("Developer name").fill("Mobile");
    await page.getByRole("button", { name: "Start adventure" }).click();
    const getPosition = () =>
      page.evaluate(() => {
        const api = (window as unknown as { __codequest: { position(): { x: number; y: number } } }).__codequest;
        return api.position();
      });
    const before = await getPosition();
    const right = page.getByRole("button", { name: "Move right" });
    await expect(right).toBeVisible();
    await right.dispatchEvent("pointerdown", { pointerId: 7, pointerType: "touch", isPrimary: true, button: 0 });
    await page.waitForTimeout(500);
    await right.dispatchEvent("pointerup", { pointerId: 7, pointerType: "touch", isPrimary: true, button: 0 });
    await expect.poll(async () => (await getPosition()).x).toBeGreaterThan(before.x + 8);
  });
});

test("adventure backup can be downloaded and restored as a separate save", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-language="javascript"]').click();
  await page.getByLabel("Developer name").fill("Backup");
  await page.getByRole("button", { name: "Start adventure" }).click();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save backup file", exact: true }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^CodeQuest-javascript-Backup\.json$/);
  const state = await page.evaluate(() => {
    const raw = localStorage.getItem("codequest:adventures:v1");
    return raw ? JSON.parse(raw).adventures[0] : null;
  });
  const backup = JSON.stringify({
    format: "codequest-adventure",
    version: 1,
    exportedAt: new Date().toISOString(),
    state,
  });
  await page.keyboard.press("Escape");
  await page.reload();
  const picker = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Load adventure backup", exact: true }).click();
  await (await picker).setFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(page.locator(".hero-name")).toHaveText("Backup");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Switch adventure", exact: true }).click();
  await expect(page.locator(".adventure-card")).toHaveCount(2);
});
