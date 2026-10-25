import { expect, test } from "@playwright/test";
import { REWARD_IDS } from "../../src/core/developer-room";
import { reviewLesson } from "../../src/core/learning-review";
import { createGame } from "../../src/core/state";
import { openAdventureTool } from "./helpers/adventure-tools";
import { emulateManualRotation } from "./helpers/mobile";

test.beforeEach(({ page }) => emulateManualRotation(page));

test.use({ reducedMotion: "reduce" });
test("phone arcade creation runs code, saves a game and uses touch controls after rotation", async ({ page }, info) => {
  test.setTimeout(120000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await openAdventureTool(page, "Tablet");
  await page.getByRole("tab", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "Start Arcade Builder", exact: true }).click();
  await page.getByRole("button", { name: "Open project files", exact: true }).click();
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play my game", exact: true })).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Play my game", exact: true }).click();
  await page.getByRole("button", { name: "Save game & play", exact: true }).click();
  await page.getByRole("button", { name: "Right", exact: true }).click();
  await expect(page.locator(".grid-game-status")).toContainText("column 2");
  await page.getByRole("button", { name: "Pause game", exact: true }).click();
  await page.getByRole("button", { name: "Right", exact: true }).click();
  await expect(page.locator(".grid-game-status")).toContainText("column 2");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Resume game", exact: true }).click();
  await page.getByRole("button", { name: "Right", exact: true }).click();
  await expect(page.locator(".grid-game-status")).toContainText("column 3");
  await page.screenshot({ path: info.outputPath("phone-custom-arcade.png") });
  await page.getByRole("button", { name: "My arcade", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play My Byte Run", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
test("phone room uses earned clothing, robot parts and decorations with saved touch choices", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const s = {
    ...createGame("javascript", { name: "Ada", kind: "girl" }, new Date().toISOString()),
    adventureId: "phone-room",
    training: { districts: ["variables" as const] },
    journey: { earned: [...REWARD_IDS], companion: { enabled: true, draft: "", trips: 1 } },
  };
  await page.goto("/");
  await expect(page.locator(".language-grid .choice")).toHaveCount(4);
  await page.evaluate(
    (state) => localStorage.setItem("codequest:adventures:v1", JSON.stringify({ version: 1, adventures: [state] })),
    s,
  );
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await openAdventureTool(page, "Learning adventures");
  await page.getByRole("button", { name: "Open My developer room", exact: true }).click();
  for (const choice of [
    "Wear amber hoodie",
    "Use gold shell",
    "Twin antenna",
    "Wall forest",
    "Add Workshop plant",
    "Add Transit desk lamp",
    "Add Review trophy",
  ])
    await page.getByRole("button", { name: choice, exact: true }).click();
  expect(await page.locator(".developer-room-panel").evaluate((n) => n.scrollWidth <= n.clientWidth + 1)).toBe(true);
  await page.locator(".developer-room-scene").scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("phone-developer-room.png") });
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await openAdventureTool(page, "Learning adventures");
  await page.getByRole("button", { name: "Open My developer room", exact: true }).click();
  await expect(page.getByRole("button", { name: "Wear amber hoodie", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Wall plum", exact: true }).click();
  await expect(page.locator(".developer-room-scene")).toHaveAttribute("data-wall", "plum");
  expect(errors).toEqual([]);
});
test("phone review adventure verifies a real cooling repair and stays usable after rotation", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await openAdventureTool(page, "Learning adventures");
  await page.getByRole("button", { name: "Open Review adventures", exact: true }).click();
  await page.getByRole("button", { name: "Review conditions", exact: true }).click();
  await page
    .getByLabel("Review repair code", { exact: true })
    .fill(reviewLesson("conditions", 0, "javascript").solution);
  await page.getByRole("button", { name: "Test my review repair", exact: true }).click();
  await expect(page.locator(".zero-feedback")).toContainText("Review complete", { timeout: 60000 });
  await page.getByRole("button", { name: "Replay Occupied room · 5°", exact: true }).click();
  await expect(page.locator(".review-scene")).toHaveClass(/review-cooling/);
  expect(await page.locator(".review-panel").evaluate((n) => n.scrollWidth <= n.clientWidth + 1)).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Try a new example", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Workshop ventilation", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("phone-review.png") });
});
