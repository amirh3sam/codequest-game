import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("world map lists all 22 study levels and opens the selected category", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-language="javascript"]').first().click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "World map", exact: true }).click();

  await expect(page.locator(".world-skill-node")).toHaveCount(22);
  await expect(page.locator(".world-node")).toHaveCount(7);
  await expect(page.getByRole("heading", { name: "0 / 176 tasks complete" })).toBeVisible();
  await page.locator(".world-skill-node").filter({ hasText: "Extra Topics" }).click();

  await expect(page.getByRole("tab", { name: "Study Path", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".study-topic-detail h4")).toHaveText("Extra Topics");
  await expect(page.getByLabel("Extra Topics javascript task 1 code")).toBeVisible();
});
