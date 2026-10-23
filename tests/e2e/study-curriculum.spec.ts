import { expect, test } from "@playwright/test";
import {
  STUDY_CURRICULUM,
  STUDY_TASKS_PER_TOPIC,
  STUDY_TOTAL_TASKS,
  studyBossFor,
  studyTaskFor,
} from "../../src/content/study-curriculum";
import type { Lang } from "../../src/runners/types";

test.use({ reducedMotion: "reduce" });

test("all Java study categories run in all four languages", async ({ page }) => {
  test.setTimeout(360_000);
  for (const [languageIndex, lang] of (["javascript", "typescript", "python", "java"] as const).entries()) {
    if (languageIndex > 0) {
      await page.evaluate(() => localStorage.clear());
      await page.reload();
    } else {
      await page.goto("/");
    }
    await page.locator(`[data-language="${lang}"]`).first().click();
    await page.getByRole("button", { name: "Start adventure", exact: true }).click();
    await page.keyboard.press("t");
    await page.getByRole("tab", { name: "Study Path", exact: true }).click();

    for (const [index, topic] of STUDY_CURRICULUM.entries()) {
      await page.locator(".study-topic-button").nth(index).click();
      await page.getByLabel(`Predicted output for ${topic.title} task 1`).fill(topic.examples[lang].output);
      await page.getByRole("button", { name: "Run and check task", exact: true }).click();
      await expect
        .poll(() => page.locator(".study-result-output").evaluate((node) => node.textContent?.trim() ?? ""), {
          timeout: lang === "java" || lang === "python" ? 45_000 : 20_000,
        })
        .toBe(topic.examples[lang].output);
      await expect(page.locator(".study-topic-button").nth(index)).toContainText("1/8");
    }
    await expect(page.locator(".study-overview")).toContainText(
      `${STUDY_CURRICULUM.length} / ${STUDY_TOTAL_TASKS} category tasks complete`,
    );
    const progressCount = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((item) => item.startsWith("codequest:study-progress:v2:"));
      return key
        ? Object.values(JSON.parse(localStorage.getItem(key) ?? "{}")).reduce(
            (sum: number, value) => sum + Number(value),
            0,
          )
        : 0;
    });
    expect(progressCount).toBe(STUDY_CURRICULUM.length);
  }
});

test("a Study Path level requires and saves all eight task predictions", async ({ page }) => {
  await page.goto("/");
  await page.locator('[data-language="javascript"]').first().click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Study Path", exact: true }).click();
  const topic = STUDY_CURRICULUM[0];
  if (!topic) throw new Error("Missing first study level");
  for (let taskIndex = 0; taskIndex < STUDY_TASKS_PER_TOPIC; taskIndex++) {
    const task = studyTaskFor(topic, "javascript", taskIndex);
    const editor = page.getByLabel(`${topic.title} javascript task ${taskIndex + 1} code`);
    await editor.fill(task.solution);
    await page.getByLabel(`Predicted output for ${topic.title} task ${taskIndex + 1}`).fill(task.output);
    await page.getByRole("button", { name: "Run and check task", exact: true }).click();
    await expect(page.locator(".study-task-feedback")).toContainText(`Task ${taskIndex + 1}/8 complete`, {
      timeout: 30_000,
    });
    await page
      .getByRole("button", { name: taskIndex === 7 ? "Challenge level boss" : "Next task", exact: true })
      .click();
  }
  const boss = studyBossFor(topic, "javascript");
  await page.getByLabel(`${topic.title} boss code`).fill(boss.solution);
  await page.getByLabel(`Boss predicted output for ${topic.title}`).fill(boss.output);
  await page.getByRole("button", { name: "Run and challenge boss", exact: true }).click();
  await expect(page.locator(".study-task-feedback")).toContainText("Boss defeated", { timeout: 30_000 });
  await page.getByRole("button", { name: "Finish level", exact: true }).click();
  await expect(page.locator(".study-level-complete")).toHaveText("Level cleared · 8/8 tasks + boss");
  await expect(page.locator(".study-topic-button").first()).toHaveClass(/complete/);
  await expect(page.locator(".study-overview")).toContainText(`8 / ${STUDY_TOTAL_TASKS} category tasks complete`);
});

test("every Java category boss can be solved and saved after its eight tasks", async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto("/");
  await page.locator('[data-language="javascript"]').first().click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  const adventureId = await page.evaluate(() => {
    const library = JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}");
    return library.adventures[0].adventureId as string;
  });
  await page.evaluate(
    ({ adventureId, topicIds }) =>
      localStorage.setItem(
        `codequest:study-progress:v2:${adventureId}`,
        JSON.stringify(Object.fromEntries(topicIds.map((id) => [id, 8]))),
      ),
    { adventureId, topicIds: STUDY_CURRICULUM.map(({ id }) => id) },
  );
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Study Path", exact: true }).click();
  for (const topic of STUDY_CURRICULUM) {
    const boss = studyBossFor(topic, "javascript");
    await page.locator(".study-topic-button").filter({ hasText: topic.title }).click();
    await page.getByLabel(`${topic.title} boss code`).fill(boss.solution);
    await page.getByLabel(`Boss predicted output for ${topic.title}`).fill(boss.output);
    await page.getByRole("button", { name: "Run and challenge boss", exact: true }).click();
    await expect(page.locator(".study-task-feedback")).toContainText("Boss defeated", { timeout: 30_000 });
    await page.getByRole("button", { name: "Finish level", exact: true }).click();
  }
  await expect(page.locator(".study-overview")).toContainText("17 / 17 bosses defeated");
});

test("Study Path provides the language-appropriate course and saves independent progress", async ({ page }) => {
  const lang: Lang = "java";
  await page.goto("/");
  await page.locator(`[data-language="${lang}"]`).first().click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Study Path", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Study Path", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Variables & Data Types/ }).click();
  await expect(page.getByLabel("Variables & Data Types java task 1 code")).toHaveValue(/public class Main/);
});
