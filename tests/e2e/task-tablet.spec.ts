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
  await expect(page.locator(".task-console-screen")).toContainText("Set your display name");
  await page.locator(".task-console-frame").screenshot({ path: testInfo.outputPath("task-console-opening.png") });
  const openNow = page.getByRole("button", { name: "Open task now" });
  if (await openNow.isVisible()) await openNow.click();
  await expect(page.locator(".task-console-shell")).toHaveAttribute("data-task-console-stage", "ready");

  await page.getByLabel("Your code").fill('console.log("ready");');
  await page.getByRole("button", { name: "Run code" }).click();
  const output = page.locator(".task-console-shell .output");
  await expect(output).toHaveText("ready");
  await expect(output).toHaveClass(/console-reveal/);
});
