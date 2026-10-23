import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "no-preference" });

test("coding tasks use the illustrated wrist opening and animate console output", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-language="javascript"]').click();
  await page.getByLabel("Developer name").fill("Nova");
  await page.getByRole("button", { name: "Start adventure" }).click();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: /1\. Set your display name/ }).click();

  const opening = page.getByRole("dialog", { name: "Opening developer tablet" });
  await expect(opening).toBeVisible();
  await expect(page.locator(".tablet-shell")).toHaveAttribute("data-tablet-stage", "opening");
  await page.getByRole("button", { name: "Skip animation" }).click();
  await expect(page.locator(".tablet-shell")).toHaveAttribute("data-tablet-stage", "ready");

  await page.getByLabel("Your code").fill('console.log("ready");');
  await page.getByRole("button", { name: "Run code" }).click();
  const output = page.locator(".tablet-shell .output");
  await expect(output).toHaveText("ready");
  await expect(output).toHaveClass(/console-reveal/);
});
