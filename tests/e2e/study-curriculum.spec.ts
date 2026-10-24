import { expect, test } from "@playwright/test";
import { loadArea } from "../../src/content/loader";
import {
  STUDY_CURRICULUM,
  STUDY_TASKS_PER_TOPIC,
  STUDY_TOTAL_TASKS,
  studyBossFor,
  studyTaskFor,
} from "../../src/content/study-curriculum";
import { startAfterAbstractionCloud } from "./helpers/study-levels";
import { openRunner } from "./runner-helpers";

test.use({ reducedMotion: "reduce" });

test("all category examples and boss programs run in every language", async ({ browser }) => {
  test.setTimeout(360_000);
  for (const lang of ["javascript", "typescript", "python", "java"] as const) {
    const runner = await openRunner(browser, lang);
    for (const topic of STUDY_CURRICULUM) {
      for (const task of [studyTaskFor(topic, lang, 0), studyBossFor(topic, lang)]) {
        const result = await runner.run(task.solution);
        expect(result.compileErrors).toBeUndefined();
        expect(result.runtimeError).toBeUndefined();
        expect(result.stdout.trim()).toBe(task.output);
      }
    }
    await runner.page.close();
  }
});

test("eight tablet checkpoints and the boss restore the matching city map and unlock the next", async ({ page }) => {
  test.setTimeout(120_000);
  await startAfterAbstractionCloud(page, "javascript");
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Study Path", exact: true }).click();
  const topic = STUDY_CURRICULUM[0];
  if (!topic) throw new Error("Missing first study level");
  for (let taskIndex = 0; taskIndex < STUDY_TASKS_PER_TOPIC; taskIndex++) {
    const task = studyTaskFor(topic, "javascript", taskIndex);
    await page.getByLabel(`${topic.title} javascript task ${taskIndex + 1} code`).fill(task.solution);
    await page.getByLabel(`Predicted output for ${topic.title} task ${taskIndex + 1}`).fill(task.output);
    await page.getByRole("button", { name: "Run and check task", exact: true }).click();
    await expect(page.locator(".study-task-feedback")).toContainText(`Task ${taskIndex + 1}/8 complete`, {
      timeout: 30_000,
    });
    await page
      .getByRole("button", { name: taskIndex === 7 ? "Challenge level boss" : "Next task", exact: true })
      .click({ force: true });
  }
  const boss = studyBossFor(topic, "javascript");
  await page.getByLabel(`${topic.title} boss code`).fill(boss.solution);
  await page.getByLabel(`Boss predicted output for ${topic.title}`).fill(boss.output);
  await page.getByRole("button", { name: "Run and challenge boss", exact: true }).click();
  await expect(page.locator(".study-task-feedback")).toContainText("Boss defeated", { timeout: 30_000 });
  await page.getByRole("button", { name: "Open level portals", exact: true }).click();
  await expect(page.locator(".study-overview")).toContainText(`8 / ${STUDY_TOTAL_TASKS} category tasks complete`);
  await expect(page.locator(".study-topic-button").nth(1)).toBeEnabled();
  await page.getByRole("button", { name: /Teleport.*09.*Decision Statements/ }).click();
  await expect(page.locator(".location-name")).toHaveText("Decision Statements");
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0],
  );
  expect(saved.areas["study-operators"].solved).toHaveLength(8);
  expect(saved.areas["study-operators"].bossDefeated).toBe(true);
  expect(saved.currentArea).toBe("study-decision-statements");
});

test("solving a map terminal updates the same checkpoint in the tablet", async ({ page }) => {
  await startAfterAbstractionCloud(page, "javascript");
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator('.world-node[data-level-id="study-operators"]').click();
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await page.locator(".task-row").first().click();
  await page
    .getByLabel("Your code", { exact: true })
    .fill(loadArea("javascript", "study-operators").tasks[0]?.solution ?? "");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Correct!");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Study Path", exact: true }).click();
  await expect(page.locator(".study-topic-button").first()).toContainText("1/8");
  await expect(page.getByLabel("Operators javascript task 2 code")).toBeVisible();
});

test("Java Study Path uses the language-appropriate course", async ({ page }) => {
  await startAfterAbstractionCloud(page, "java");
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Study Path", exact: true }).click();
  await expect(page.getByLabel("Operators java task 1 code")).toHaveValue(/public class Main/);
});
