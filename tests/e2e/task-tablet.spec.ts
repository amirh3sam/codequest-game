import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "no-preference" });

test("coding tasks use a task-specific console boot animation and animate output", async ({ page }, testInfo) => {
  await page.goto("/");
  await page.locator('[data-language="javascript"]').click();
  await page.getByLabel("Developer name").fill("Nova");
  await page.getByRole("button", { name: "Start adventure" }).click();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await page.getByRole("button", { name: /1\. Set your display name/ }).click();

  const opening = page.getByRole("dialog", { name: "Connecting to Set your display name" });
  await expect(opening).toBeVisible();
  await expect(page.locator(".task-console-frame")).toBeVisible();
  await expect(page.locator(".task-monitor-camera")).toBeVisible();
  await expect(page.locator(".task-monitor-stand")).toBeVisible();
  await expect(page.locator(".task-console-screen")).toContainText("Set your display name");
  await page
    .locator(".task-console-opening")
    .screenshot({ path: testInfo.outputPath("task-console-opening.png"), animations: "disabled" });
  await expect(page.locator(".task-console-shell")).toHaveAttribute("data-task-console-stage", "ready", {
    timeout: 6000,
  });

  await page.getByLabel("Your code").fill('console.log("ready");');
  await page.getByRole("button", { name: "Run code" }).click();
  const output = page.locator(".task-console-shell .output");
  await expect(output).toHaveText("ready");
  await expect(output).toHaveClass(/console-reveal/);
});

test("monitor boot can be cancelled and Enter opens its workspace without a stale reopen", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  const mission = async () => {
    await page.getByRole("button", { name: "Progress", exact: true }).click();
    await page.locator(".task-row").first().click();
    await expect(page.locator(".task-console-opening")).toBeVisible();
  };
  await mission();
  await page.keyboard.press("Escape");
  await expect(page.locator(".task-console-opening")).toHaveCount(0);
  await page.waitForTimeout(2900);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await mission();
  await page.keyboard.press("Enter");
  await expect(page.locator(".task-console-shell")).toHaveAttribute("data-task-console-stage", "ready");
  await expect(page.getByLabel("Your code", { exact: true })).toBeEditable();
});

test.describe("mobile monitor frame", () => {
  test.use({ isMobile: true, hasTouch: true });
  for (const viewport of [
    { width: 667, height: 375 },
    { width: 390, height: 844 },
  ]) {
    test(`monitor and skip controls fit ${viewport.width} by ${viewport.height}`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await page.addInitScript(() => Object.defineProperty(screen.orientation, "lock", { value: undefined }));
      await page.goto("/");
      await page.getByRole("button", { name: "Start adventure", exact: true }).tap();
      await page.getByRole("button", { name: "Open game menu", exact: true }).tap();
      await page.getByRole("button", { name: "Progress", exact: true }).tap();
      await page.locator(".task-row").first().tap();
      const frame = await page.locator(".task-console-frame").boundingBox();
      const skip = page.getByRole("button", { name: "Open task now", exact: true });
      const bounds = await skip.boundingBox();
      expect(frame?.x).toBeGreaterThanOrEqual(0);
      expect((frame?.x ?? 0) + (frame?.width ?? 0)).toBeLessThanOrEqual(viewport.width);
      expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual(viewport.height);
      await page.screenshot({ path: testInfo.outputPath("mobile-monitor.png"), animations: "disabled" });
      if (await skip.isVisible()) await skip.tap();
      await expect(page.getByLabel("Your code", { exact: true })).toBeEditable();
    });
  }
});
