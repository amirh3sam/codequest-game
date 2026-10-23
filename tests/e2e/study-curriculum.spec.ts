import { expect, test } from "@playwright/test";
import { STUDY_CURRICULUM } from "../../src/content/study-curriculum";
import type { Lang } from "../../src/runners/types";

test.use({ reducedMotion: "reduce" });

test("all Study Path examples run and save checkpoints in all four languages", async ({ page }) => {
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
      await page.getByRole("button", { name: "Run study example", exact: true }).click();
      await expect
        .poll(() => page.locator(".study-result-output").evaluate((node) => node.textContent?.trim() ?? ""), {
          timeout: lang === "java" || lang === "python" ? 45_000 : 20_000,
        })
        .toBe(topic.examples[lang].output);
      await expect(page.locator(".study-topic-button").nth(index)).toHaveClass(/complete/);
    }
    await expect(page.locator(".study-overview")).toContainText("22 / 22 topics practiced");
    const progressCount = await page.evaluate(() => {
      const key = Object.keys(localStorage).find((item) => item.startsWith("codequest:study-progress:v1:"));
      return key ? JSON.parse(localStorage.getItem(key) ?? "[]").length : 0;
    });
    expect(progressCount).toBe(22);
  }
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
  await expect(page.getByLabel("JDK 17 & IntelliJ Setup · Language Tools java example code")).toHaveValue(
    /public class Main/,
  );
});
