import { expect, type Page, test } from "@playwright/test";
import { loadArea } from "../../src/content/loader";
import { createGame, defeatBoss, solveTask } from "../../src/core/state";

async function enterLogic(page: Page): Promise<void> {
  const variables = loadArea("javascript", "variables");
  let state = createGame("javascript", { kind: "girl", name: "Ada" }, "2026-10-22T12:00:00Z");
  for (const task of variables.tasks) state = solveTask(state, variables, task.id, state.updatedAt);
  state = defeatBoss(state, variables, state.updatedAt);
  await page.goto("/");
  await page.evaluate((state) => localStorage.setItem("codequest:v1:javascript", JSON.stringify(state)), state);
  await page.reload();
  await page.getByRole("button", { name: "Continue adventure", exact: true }).click();
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator(".world-node").filter({ hasText: "Logic Junction" }).click();
  await expect(page.locator(".location-name")).toHaveText("Logic Junction");
}
test("travels to Logic Junction, uses its terminal, reloads and clears the Router", async ({ page }, testInfo) => {
  test.setTimeout(90_000);
  const conditions = loadArea("javascript", "conditions");
  await enterLogic(page);
  await page.keyboard.down("d");
  await page.waitForFunction(() => {
    const scene = (
      window as unknown as {
        __codequest: { game: { scene: { getScene(k: string): { getPosition(): { x: number } } } } };
      }
    ).__codequest.game.scene.getScene("boot");
    return scene.getPosition().x >= 305;
  });
  await page.keyboard.up("d");
  await page.screenshot({ path: testInfo.outputPath("logic-junction.png") });
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: "Check a laptop battery", exact: true })).toBeVisible();
  for (const [index, task] of conditions.tasks.entries()) {
    await page.getByLabel("Your code").fill(task.solution);
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    await expect(page.locator(".feedback")).toContainText("Correct!");
    if (index === 0) {
      await page.reload();
      await page.getByRole("button", { name: "Continue adventure", exact: true }).click();
      await expect(page.locator(".location-name")).toHaveText("Logic Junction");
      await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
      await page.getByRole("button", { name: "Tasks", exact: true }).click();
      await page.getByRole("button", { name: /2\. Choose a sign-in screen/ }).click();
    } else
      await page.getByRole("button", { name: index < 7 ? "Next task →" : "Inspect the Router →", exact: true }).click();
  }
  await expect(page.getByRole("heading", { name: "The Router", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Get next hint · 1 gem", exact: true }).click();
  await page.getByLabel("Your code").fill(conditions.boss.solution);
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Logic Junction is online!" })).toBeVisible();
  await page.getByRole("button", { name: "Continue journey", exact: true }).click();
  await expect(page.locator(".world-node").filter({ hasText: "Loop Transit" })).toContainText("Unlocked · coming next");
  await page.locator(".world-node").filter({ hasText: "Variable District" }).click();
  await expect(page.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "8");
  await expect(page.locator(".objective")).toContainText("district is online");
});

test("losing hearts in Logic Junction preserves the completed first district", async ({ page }) => {
  await enterLogic(page);
  await page.getByRole("button", { name: "Lesson", exact: true }).click();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: /1\. Check a laptop battery/ }).click();
  await page.getByLabel("Your code").fill('console.log("wrong");');
  for (let n = 0; n < 3; n++) {
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    if (n < 2) await expect(page.locator(".feedback")).toContainText("−1 heart");
  }
  await expect(page.getByRole("heading", { name: "A fresh start" })).toBeVisible();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem("codequest:v1:javascript") ?? "null"));
  expect(state.currentArea).toBe("conditions");
  expect(state.areas.conditions.hearts).toBe(3);
  expect(state.areas.conditions.lessonsFound).toBe(true);
  expect(state.areas.variables.bossDefeated).toBe(true);
  expect(state.areas.variables.solved).toHaveLength(8);
});
