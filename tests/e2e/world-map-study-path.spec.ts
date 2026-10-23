import { expect, test } from "@playwright/test";
import { startAfterAbstractionCloud } from "./helpers/study-levels";

test.use({ reducedMotion: "reduce" });

test("Java categories continue after Abstraction Cloud and unlock sequentially", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-language="javascript"]').first().click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.getByRole("button", { name: "World map", exact: true }).click();

  await expect(page.locator(".world-skill-node")).toHaveCount(17);
  await expect(page.locator(".world-node")).toHaveCount(24);
  await expect(page.locator(".level-map-nodes").locator(":scope > *")).toHaveCount(24);
  await expect(page.locator(".level-map-nodes > .world-node").nth(6)).toContainText("Abstraction Cloud");
  await expect(page.locator(".level-map-nodes > .world-skill-node").first()).toContainText("Variables & Data Types");
  for (const node of await page.locator(".world-skill-node").all()) await expect(node).toBeDisabled();
  for (const lock of await page.locator(".world-skill-node .world-number").all()) await expect(lock).toHaveText("🔒");
  await expect(page.locator(".world-skill-node").first()).toContainText("complete Abstraction Cloud to unlock level 8");
  await expect(page.locator(".world-map-hint")).toContainText("eight tasks plus its boss");

  await startAfterAbstractionCloud(page, "javascript");
  await page.getByRole("button", { name: "World map", exact: true }).click();
  const firstCategory = page.locator(".world-skill-node").first();
  await expect(firstCategory).toBeEnabled();
  await expect(firstCategory).toHaveClass(/world-node/);
  await expect(firstCategory.locator(".world-number")).toHaveText("08");
  await expect(page.locator(".world-skill-node").nth(1)).toBeDisabled();
  await expect(page.locator(".world-skill-node").nth(1)).toContainText(
    "defeat the previous category boss to unlock level 9",
  );
  await firstCategory.click();

  await expect(page.getByRole("tab", { name: "Study Path", exact: true })).toHaveAttribute("aria-selected", "true");
  await expect(page.locator(".study-topic-detail h4")).toHaveText("Variables & Data Types");
  await expect(page.locator(".study-topic-detail .eyebrow").filter({ hasText: "LEVEL 08 / 24" })).toBeVisible();
  await expect(page.locator(".study-topic-button").nth(1)).toBeDisabled();
  await expect(page.getByLabel("Variables & Data Types javascript task 1 code")).toBeVisible();
});
