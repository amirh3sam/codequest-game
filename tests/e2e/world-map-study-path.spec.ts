import { expect, test } from "@playwright/test";

test.use({ reducedMotion: "reduce" });

test("world map lists all 17 Java categories and opens the selected category", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-language="javascript"]').first().click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "World map", exact: true }).click();

  await expect(page.locator(".world-skill-node")).toHaveCount(17);
  await expect(page.locator(".world-node")).toHaveCount(7);
  await expect(page.locator(".level-map-nodes").locator(":scope > *")).toHaveCount(24);
  await expect(page.locator(".level-map-nodes > .world-node").nth(6)).toContainText("Abstraction Cloud");
  await expect(page.locator(".level-map-nodes > .world-skill-node").first()).toContainText("Variables & Data Types");
  await expect(page.getByRole("heading", { name: /0 \/ 136 category tasks/ })).toBeVisible();
  await page.locator(".world-skill-node").filter({ hasText: "Extra Topics" }).click();

  await expect(page.getByRole("tab", { name: "Study Path", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".study-topic-detail h4")).toHaveText("Extra Topics");
  await expect(page.getByLabel("Extra Topics javascript task 1 code")).toBeVisible();
});
