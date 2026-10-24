import { expect, type Page, test } from "@playwright/test";
import variables from "../../src/content/data/javascript/01-variables.json" with { type: "json" };
import village from "../../src/content/village.json" with { type: "json" };
import { openAdventureTool } from "./helpers/adventure-tools";

test.use({ reducedMotion: "reduce" });

async function start(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("textbox", { name: "Developer name", exact: true }).fill("Nova");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await expect(page.getByTestId("hearts")).toHaveText("♥♥♥");
}
async function firstTask(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Tablet", exact: true }).click();
  await page.getByRole("tab", { name: "Missions", exact: true }).click();
  await page.getByRole("button", { name: "Work on Set your display name", exact: true }).click();
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
  await page.locator(".title-adventure-row").first().click();
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
  await expect(page.getByRole("heading", { name: "Restore the data hub" })).toBeVisible();
  await page.getByLabel("Repair code").fill("let power = 5;\npower += 3;\npower -= 2;\nconsole.log(power);");
  await page.getByRole("button", { name: "Run repair preview", exact: true }).click();
  await expect(page.locator(".hub-finale .feedback")).toContainText("Preview passed");
  await page.getByRole("button", { name: "Restore power", exact: true }).click();
  await page
    .getByLabel("Repair code")
    .fill('const operatorName = "Nova";\nconst signal = "Ready, " + operatorName + "!";\nconsole.log(signal);');
  await page.getByRole("button", { name: "Run repair preview", exact: true }).click();
  await expect(page.locator(".hub-finale .feedback")).toContainText("Preview passed");
  await page.getByRole("button", { name: "Connect operator signal", exact: true }).click();
  await page.getByRole("button", { name: "Open final repair", exact: true }).click();
  await page.getByRole("button", { name: "Get next hint · 1 gem", exact: true }).click();
  await expect(page.getByTestId("gems")).toHaveText("◆ 14");
  await page.getByLabel("Your code").fill(variables.boss.solution);
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Variable District is online!" })).toBeVisible();
  await expect(page.locator(".location-name")).toHaveText("Variable District");
  await page.getByRole("button", { name: "Explore the district", exact: true }).click();
  await page.evaluate(() => {
    const scene = (
      window as unknown as {
        __codequest: {
          game: {
            scene: {
              getScene(key: string): {
                portalPosition: { x: number; y: number };
                position: { x: number; y: number };
                interactTouch(): void;
              };
            };
          };
        };
      }
    ).__codequest.game.scene.getScene("boot");
    scene.position = { x: scene.portalPosition.x + 50, y: scene.portalPosition.y };
    scene.interactTouch();
  });
  await expect(page.getByRole("heading", { name: "Your journey" })).toBeVisible();
  await page.locator('.world-node[data-level-id="conditions"]').click();
  await expect(page.locator(".location-name")).toHaveText("Logic Junction");
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await expect(page.locator(".world-node").filter({ hasText: "Logic Junction" })).toBeEnabled();
  await expect(page.locator(".world-node").filter({ hasText: "Logic Junction" })).toContainText("explore district");
});

test("losing the last heart resets the area and keeps the lesson found", async ({ page }) => {
  await start(page);
  await openAdventureTool(page, "Lesson");
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
