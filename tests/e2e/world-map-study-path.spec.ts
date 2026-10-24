import { expect, test } from "@playwright/test";
import { startAfterAbstractionCloud } from "./helpers/study-levels";

test.use({ reducedMotion: "reduce" });

test("Study Path starts with Operators after Abstraction Cloud and unlocks categories sequentially", async ({
  page,
}) => {
  await page.goto("/");
  await page.locator('[data-language="javascript"]').first().click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.getByRole("button", { name: "World map", exact: true }).click();

  await expect(page.locator(".world-skill-node")).toHaveCount(16);
  await expect(page.locator(".world-node")).toHaveCount(23);
  await expect(page.locator(".level-map-nodes").locator(":scope > *")).toHaveCount(23);
  await expect(page.locator(".level-map-nodes > .world-node").nth(6)).toContainText("Abstraction Cloud");
  const firstCategory = page.locator(".world-skill-node").first();
  await expect(firstCategory).toContainText("Operators");
  await expect(firstCategory).toBeDisabled();
  await expect(firstCategory.locator(".world-number")).toHaveText("🔒");
  await expect(page.locator(".world-map-hint")).toContainText("eight tasks and a boss");

  await startAfterAbstractionCloud(page, "javascript");
  await page.getByRole("button", { name: "World map", exact: true }).click();
  const firstCategoryAfterStory = page.locator(".world-skill-node").first();
  await expect(firstCategoryAfterStory).toBeEnabled();
  await expect(firstCategoryAfterStory.locator(".world-number")).toHaveText("08");
  await expect(page.locator(".world-skill-node").nth(1)).toBeDisabled();
  await expect(page.locator(".world-skill-node").nth(1)).toContainText(
    "defeat the previous category boss to unlock level 9",
  );
  await firstCategoryAfterStory.click();

  await expect(page.getByRole("tab", { name: "Study Path", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".study-topic-detail h4")).toHaveText("Operators");
  await expect(page.locator(".study-topic-detail > .eyebrow").first()).toHaveText("LEVEL 08 / 23");
  await expect(page.locator(".study-topic-button").nth(1)).toBeDisabled();
  await expect(page.getByLabel("Operators javascript task 1 code")).toBeVisible();
});
