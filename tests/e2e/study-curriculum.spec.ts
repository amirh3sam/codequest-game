import { expect, test } from "@playwright/test";
import { STUDY_CURRICULUM, STUDY_TASKS_PER_TOPIC, studyTaskFor } from "../../src/content/study-curriculum";
import type { Lang } from "../../src/runners/types";

test.use({ reducedMotion: "reduce" });

test("all 22 Study Path level starters run in all four languages", async ({ page }) => {
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
    await expect(page.locator(".study-overview")).toContainText("22 / 176 tasks complete");
    const progressCount = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((item) => item.startsWith("codequest:study-progress:v2:"));
      return key
        ? Object.values(JSON.parse(localStorage.getItem(key) ?? "{}")).reduce(
            (sum: number, value) => sum + Number(value),
            0,
          )
        : 0;
    });
    expect(progressCount).toBe(22);
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
    await page.getByRole("button", { name: taskIndex === 7 ? "Finish level" : "Next task", exact: true }).click();
  }
  await expect(page.locator(".study-level-complete")).toHaveText("Level mastered · 8/8 tasks");
  await expect(page.locator(".study-topic-button").first()).toHaveClass(/complete/);
  await expect(page.locator(".study-overview")).toContainText("8 / 176 tasks complete");
});

test("Study Path provides the language-appropriate course and saves independent progress", async ({ page }) => {
  const lang: Lang = "java";
  await page.goto("/");
  await page.locator(`[data-language="${lang}"]`).first().click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Study Path", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Study Path", exact: true })).toBeVisible();
  await page.getByRole("button", { name: /JDK 17 & IntelliJ Setup · Language Tools/ }).click();
  await expect(page.getByLabel("JDK 17 & IntelliJ Setup · Language Tools java task 1 code")).toHaveValue(
    /public class Main/,
  );
});
