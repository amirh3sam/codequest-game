import { expect, test } from "@playwright/test";
import {
  STUDY_CURRICULUM,
  STUDY_TASKS_PER_TOPIC,
  STUDY_TOTAL_TASKS,
  studyBossFor,
  studyTaskFor,
} from "../../src/content/study-curriculum";
import type { Lang } from "../../src/runners/types";
import { startAfterAbstractionCloud } from "./helpers/study-levels";

test.use({ reducedMotion: "reduce" });

test("all Java study categories run in all four languages", async ({ page }) => {
  test.setTimeout(360_000);
  for (const [languageIndex, lang] of (["javascript", "typescript", "python", "java"] as const).entries()) {
    if (languageIndex > 0) await page.evaluate(() => localStorage.clear());
    await startAfterAbstractionCloud(page, lang);
    await page.keyboard.press("t");
    await page.getByRole("tab", { name: "Study Path", exact: true }).click();

    for (const [index, topic] of STUDY_CURRICULUM.entries()) {
      if (index > 0) {
        const previousTopics = STUDY_CURRICULUM.slice(0, index).map(({ id }) => id);
        await page.evaluate(
          ({ previousTopics }) => {
            const adventure = JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0];
            localStorage.setItem(
              `codequest:study-progress:v2:${adventure.adventureId}`,
              JSON.stringify(Object.fromEntries(previousTopics.map((id) => [id, 8]))),
            );
            localStorage.setItem(`codequest:study-bosses:v1:${adventure.adventureId}`, JSON.stringify(previousTopics));
          },
          { previousTopics },
        );
        await page.locator(".study-topic-button").first().click();
      }
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
      `${STUDY_TOTAL_TASKS - STUDY_TASKS_PER_TOPIC + 1} / ${STUDY_TOTAL_TASKS} category tasks complete`,
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
    expect(progressCount).toBe(STUDY_TOTAL_TASKS - STUDY_TASKS_PER_TOPIC + 1);
  }
});

test("a Study Path level requires and saves all eight task predictions", async ({ page }) => {
  test.setTimeout(120_000);
  await startAfterAbstractionCloud(page, "javascript");
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
      .click({ force: true });
  }
  const boss = studyBossFor(topic, "javascript");
  await page.getByLabel(`${topic.title} boss code`).fill(boss.solution);
  await page.getByLabel(`Boss predicted output for ${topic.title}`).fill(boss.output);
  await page.getByRole("button", { name: "Run and challenge boss", exact: true }).click();
  await expect(page.locator(".study-task-feedback")).toContainText("Boss defeated", { timeout: 30_000 });
  await page.getByRole("button", { name: "Open level portals", exact: true }).click();
  await expect(page.locator(".study-level-complete")).toHaveText("Level cleared · 8/8 tasks + boss");
  await expect(page.locator(".study-topic-button").first()).toHaveClass(/complete/);
  await expect(page.locator(".study-overview")).toContainText(`8 / ${STUDY_TOTAL_TASKS} category tasks complete`);
  await expect(page.locator(".study-topic-button").nth(1)).toBeEnabled();
  await expect(page.locator(".study-portal-door")).toHaveCount(2);
  await page.getByRole("button", { name: /Teleport · 09 · Decision Statements/ }).click();
  await expect(page.locator(".study-topic-detail .eyebrow").filter({ hasText: "LEVEL 09 / 23" })).toBeVisible();
});

test("every Java category boss can be solved and saved after its eight tasks", async ({ page }) => {
  test.setTimeout(180_000);
  await startAfterAbstractionCloud(page, "javascript");
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
    await page.getByRole("button", { name: "Open level portals", exact: true }).click();
    if (STUDY_CURRICULUM.indexOf(topic) < STUDY_CURRICULUM.length - 1) {
      const next = STUDY_CURRICULUM[STUDY_CURRICULUM.indexOf(topic) + 1];
      if (!next) throw new Error("Missing next Java category level");
      await page
        .getByRole("button", {
          name: new RegExp(
            `Teleport · ${String(STUDY_CURRICULUM.indexOf(topic) + 9).padStart(2, "0")} · ${next.title}`,
          ),
        })
        .click();
      await expect(page.locator(".study-topic-detail h4")).toHaveText(next.title);
    }
  }
  await expect(page.locator(".study-overview")).toContainText("16 / 16 bosses defeated");
});

test("Study Path provides the language-appropriate course and saves independent progress", async ({ page }) => {
  const lang: Lang = "java";
  await startAfterAbstractionCloud(page, lang);
  await startAfterAbstractionCloud(page, lang);
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Study Path", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Study Path", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /Operators/ }).click();
  await expect(page.getByLabel("Operators java task 1 code")).toHaveValue(/public class Main/);
});
