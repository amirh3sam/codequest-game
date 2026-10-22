import { expect, type Page, test } from "@playwright/test";
import variables from "../../src/content/data/javascript/01-variables.json" with { type: "json" };
import village from "../../src/content/village.json" with { type: "json" };

async function start(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Developer name", exact: true }).fill("Nova");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await expect(page.getByTestId("hearts")).toHaveText("♥♥♥");
}
async function firstTask(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: /1\. Set your display name/ }).click();
}

test("moves, runs real code, earns gems and continues a saved adventure", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  await page.keyboard.down("d");
  await page.waitForFunction(
    (x) => JSON.parse(localStorage.getItem("codequest:v1:javascript") ?? "{}").position?.x > x,
    village.spawn.x + 30,
  );
  await page.keyboard.up("d");
  await page.screenshot({ path: testInfo.outputPath("playable-village.png") });
  await firstTask(page);
  const editor = page.getByLabel("Your code");
  await editor.fill('console.log("wrong");');
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Run complete");
  await expect(page.getByTestId("hearts")).toHaveText("♥♥♥");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("−1 heart");
  await expect(page.getByTestId("hearts")).toHaveText("♥♥♡");
  await editor.fill("const = ;");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("No heart lost");
  await expect(page.getByTestId("hearts")).toHaveText("♥♥♡");
  await editor.fill(variables.tasks[0]?.solution ?? "");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Correct!");
  await expect(page.getByTestId("gems")).toHaveText("◆ 1");
  await page.reload();
  await page.getByRole("button", { name: "Continue adventure", exact: true }).click();
  await expect(page.getByTestId("gems")).toHaveText("◆ 1");
  await expect(page.getByTestId("hearts")).toHaveText("♥♥♡");
  await expect(page.locator(".hero-name")).toHaveText("Nova");
  expect(errors).toEqual([]);
});

test("completes all eight tasks, buys a hint and defeats the boss", async ({ page }) => {
  await start(page);
  await firstTask(page);
  for (const [index, task] of variables.tasks.entries()) {
    await page.getByLabel("Your code").fill(task.solution);
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    await expect(page.locator(".feedback")).toContainText("Correct!");
    await page.getByRole("button", { name: index < 7 ? "Next task →" : "Inspect the Firewall →", exact: true }).click();
  }
  await expect(page.getByTestId("gems")).toHaveText("◆ 15");
  await page.getByRole("button", { name: "Get next hint · 1 gem", exact: true }).click();
  await expect(page.getByTestId("gems")).toHaveText("◆ 14");
  await page.getByLabel("Your code").fill(variables.boss.solution);
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Variable District is online!" })).toBeVisible();
  await page.getByRole("button", { name: "Continue journey", exact: true }).click();
  await expect(page.locator(".world-node").filter({ hasText: "Logic Junction" })).toBeEnabled();
  await expect(page.locator(".world-node").filter({ hasText: "Logic Junction" })).toContainText("Explore district");
});

test("losing the last heart resets the area and keeps the lesson found", async ({ page }) => {
  await start(page);
  await page.getByRole("button", { name: "Lesson", exact: true }).click();
  await page.getByRole("button", { name: "Close panel" }).click();
  await firstTask(page);
  await page.getByLabel("Your code").fill('console.log("incorrect");');
  for (let index = 0; index < 3; index++) {
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    if (index < 2) await expect(page.locator(".feedback")).toContainText("−1 heart");
  }
  await expect(page.getByRole("heading", { name: "A fresh start" })).toBeVisible();
  await expect(page.getByTestId("hearts")).toHaveText("♥♥♥");
  await expect(page.getByTestId("gems")).toHaveText("◆ 0");
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem("codequest:v1:javascript") ?? "{}").areas.variables.lessonsFound,
    ),
  ).toBe(true);
});
