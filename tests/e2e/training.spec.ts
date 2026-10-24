import { expect, type Page, test } from "@playwright/test";
import { loadArea } from "../../src/content/loader";
import { TABLET_TRAINING, trainingProgram } from "../../src/content/training";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { createGame } from "../../src/core/state";
import { TRAINING_KEY } from "../../src/core/training";
import type { Lang } from "../../src/runners/types";
import { openAdventureTool } from "./helpers/adventure-tools";

test.use({ storageState: { cookies: [], origins: [] }, reducedMotion: "reduce" });

async function start(page: Page, lang: Lang = "javascript") {
  await page.goto("/");
  await page.locator(`[data-language="${lang}"]`).click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.getByRole("button", { name: "Open detailed handbook", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "CodeQuest training", exact: true })).toBeVisible();
}
async function chapter(page: Page, title: string) {
  const details = page.locator(".training-contents");
  if (!(await details.evaluate((node) => (node as HTMLDetailsElement).open))) await details.locator("summary").click();
  await page.locator(".training-chapter").filter({ hasText: title }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}
const areas = (page: Page, lang = "javascript") =>
  page.evaluate((lang) => JSON.parse(localStorage.getItem(`codequest:v1:${lang}`) ?? "{}").areas, lang);

test("first visit has interactive chapters, resumes after refresh and can be skipped", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  const before = await areas(page);
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await page.getByRole("button", { name: "Walk to the marker", exact: true }).click();
  await expect(page.locator(".training-status")).toContainText("dotted route");
  await page.locator(".training-canvas").focus();
  await page.keyboard.press("ArrowUp");
  await expect(page.locator(".training-canvas")).toBeVisible();
  await page.screenshot({ path: info.outputPath("training-movement.png") });
  await chapter(page, "Every tab in your tablet");
  for (const [name, description] of TABLET_TRAINING) {
    await page.getByRole("group", { name: "Explore tablet tabs" }).getByRole("button", { name, exact: true }).click();
    await expect(page.locator(".training-explanation")).toContainText(description);
  }
  await page.screenshot({ path: info.outputPath("training-tablet.png") });
  await chapter(page, "Build with files and classes");
  await page.getByRole("button", { name: "Create preview file", exact: true }).click();
  await expect(page.locator(".training-status")).toContainText("Select src first");
  await page.getByRole("button", { name: "Select src folder", exact: true }).click();
  await page.getByRole("button", { name: "Create preview file", exact: true }).click();
  await expect(page.locator(".training-status")).toContainText("Created src/player.js");
  await chapter(page, "Keep your adventures safe");
  await expect(page.locator(".training-copy")).toContainText("hard drive");
  await page.getByRole("button", { name: "Preview: Clear browser data", exact: true }).click();
  await page.getByRole("button", { name: "Preview: Load backup file", exact: true }).click();
  await expect(page.locator(".training-status")).toContainText("no backup file");
  await page.getByRole("button", { name: "Reset save demonstration", exact: true }).click();
  await page.getByRole("button", { name: "Preview: Save backup file", exact: true }).click();
  await expect(page.locator(".training-status")).toContainText("snapshot");
  await page.getByRole("button", { name: "Preview: Clear browser data", exact: true }).click();
  await expect(page.locator(".training-status")).toContainText("backup on disk is still safe");
  await page.screenshot({ path: info.outputPath("training-backup-on-disk.png") });
  await page.getByRole("button", { name: "Preview: Load backup file", exact: true }).click();
  await expect(page.locator(".training-status")).toContainText("progress restored");
  expect(await areas(page)).toEqual(before);
  await chapter(page, "Build with files and classes");
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await expect(page.getByRole("heading", { name: "Build with files and classes", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Skip training", exact: true }).click();
  await expect(page.locator(".training-shell")).toHaveCount(0);
  expect(await areas(page)).toEqual(before);
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await expect(page.locator(".overlay")).toBeHidden();
  await openAdventureTool(page, "Training");
  await expect(page.getByRole("heading", { name: "Build with files and classes", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: training uses the real runner without grading the adventure`, async ({ page }) => {
    test.setTimeout(120_000);
    await start(page, lang);
    const before = await areas(page, lang);
    await chapter(page, "Run first. Submit when ready.");
    await page.getByRole("button", { name: "Submit training signal", exact: true }).click();
    await expect(page.locator(".training-status")).toContainText("Run code that prints exactly");
    await page.getByLabel("Training code", { exact: true }).fill(trainingProgram(lang, "Wrong signal"));
    await page.getByRole("button", { name: "Run training code", exact: true }).click();
    await expect(page.getByLabel("Training output", { exact: true })).toContainText("Wrong signal", {
      timeout: 60_000,
    });
    await page.getByRole("button", { name: "Submit training signal", exact: true }).click();
    await expect(page.locator(".training-status")).toContainText("Run code that prints exactly");
    await page.getByLabel("Training code", { exact: true }).fill(trainingProgram(lang));
    await page.getByRole("button", { name: "Run training code", exact: true }).click();
    await expect(page.getByLabel("Training output", { exact: true })).toHaveText("Signal ready\n", { timeout: 60_000 });
    await page.getByRole("button", { name: "Submit training signal", exact: true }).click();
    await expect(page.locator(".training-status")).toContainText("Signal restored!");
    if (lang === "javascript") {
      await page.getByLabel("Training code", { exact: true }).fill("while (true) {}");
      await page.getByRole("button", { name: "Run training code", exact: true }).click();
      await page.getByRole("button", { name: "Next chapter", exact: true }).click();
      await chapter(page, "Run first. Submit when ready.");
      await page.getByRole("button", { name: "Run training code", exact: true }).click();
      await expect(page.getByLabel("Training output", { exact: true })).toHaveText("Signal ready\n", {
        timeout: 30_000,
      });
    }
    expect(await areas(page, lang)).toEqual(before);
    await page.keyboard.press("Escape");
    await expect(page.locator(".training-shell")).toHaveCount(0);
    await expect(page.locator(".training-overlay")).toHaveCount(0);
    await page.keyboard.press("t");
    await expect(page.getByLabel("Practice code", { exact: true })).toBeVisible();
  });
}

test("the complete tour and tablet help preserve drafts and the selected tab", async ({ page }) => {
  await start(page);
  for (let i = 0; i < 12; i++) await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await page.getByRole("button", { name: "Finish training", exact: true }).click();
  await expect(page.locator(".overlay")).toBeHidden();
  await expect(page.locator(".field-guide")).toHaveCount(0);
  const settings = await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}"), TRAINING_KEY);
  expect(settings.welcome).toBe("complete");
  expect(settings.completed).toHaveLength(13);
  await page.keyboard.press("t");
  await page.getByLabel("Practice code", { exact: true }).fill('console.log("Keep my draft");');
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await page.getByRole("button", { name: "Tablet help", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Every tab in your tablet", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Skip training", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Guide", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("tab", { name: "Code", exact: true }).click();
  await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue('console.log("Keep my draft");');
  await page.getByRole("tab", { name: "Projects", exact: true }).click();
  await page.getByRole("button", { name: "Tablet help", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tab", { name: "Projects", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("the title handbook works before a character exists and animations can pause", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "How to play · Interactive training", exact: true }).click();
  await chapter(page, "Find your way around");
  await page.getByRole("button", { name: "Walk to the marker", exact: true }).click();
  const image = await page.locator(".training-canvas").evaluate((node) => (node as HTMLCanvasElement).toDataURL());
  await expect
    .poll(() => page.locator(".training-canvas").evaluate((node) => (node as HTMLCanvasElement).toDataURL()))
    .not.toBe(image);
  await page.getByRole("button", { name: "Pause animation", exact: true }).click();
  await expect(page.getByRole("button", { name: "Play animation", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await chapter(page, "Run first. Submit when ready.");
  await page.getByRole("button", { name: "Run training code", exact: true }).click();
  await expect(page.getByLabel("Training output", { exact: true })).toHaveText("Signal ready\n", { timeout: 30_000 });
  await page.getByRole("button", { name: "Skip training", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start adventure", exact: true })).toBeVisible();
});

test("new district briefings teach their own topic and are remembered on return", async ({ page }) => {
  await page.goto("/");
  const base = createGame("javascript", { kind: "boy", name: "Noah" }, new Date().toISOString());
  const state = {
    ...base,
    adventureId: "training-transit",
    training: { districts: ["variables"] },
    areas: {
      ...base.areas,
      variables: {
        ...base.areas.variables,
        solved: loadArea(base.lang, "variables").tasks.map((task) => task.id),
        bossDefeated: true,
      },
    },
  };
  await page.evaluate(
    ({ state, library, key }) => {
      localStorage.setItem(library, JSON.stringify({ version: 1, adventures: [state] }));
      localStorage.setItem(
        key,
        JSON.stringify({ version: 1, welcome: "complete", chapter: "ready", completed: [], autoDistricts: true }),
      );
    },
    { state, library: ADVENTURES_KEY, key: TRAINING_KEY },
  );
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator('.world-node[data-level-id="conditions"]').click();
  await expect(page.getByRole("dialog", { name: "District briefing", exact: true })).toBeVisible();
  await expect(page.locator(".training-copy")).toContainText(loadArea("javascript", "conditions").tasks[0].title);
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await expect(page.getByLabel("Training code", { exact: true })).toHaveValue(
    loadArea("javascript", "conditions").lesson.pages.find((page) => page.code)?.code ?? trainingProgram("javascript"),
  );
  await page.getByRole("button", { name: "Run training code", exact: true }).click();
  await expect(page.locator(".training-status")).toContainText("Lesson example executed", { timeout: 30_000 });
  await page.getByRole("button", { name: "Next chapter", exact: true }).click();
  await page.getByRole("button", { name: "Finish training", exact: true }).click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator('.world-node[data-level-id="variables"]').click();
  await expect(page.locator(".overlay")).toBeHidden();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator('.world-node[data-level-id="conditions"]').click();
  await expect(page.locator(".overlay")).toBeHidden();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key) ?? "{}").adventures[0].training.districts,
      ADVENTURES_KEY,
    ),
  ).toEqual(["variables", "conditions"]);
});

test("existing saves remain playable without an unsolicited tour", async ({ page }) => {
  await page.goto("/");
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [state] })),
    {
      key: ADVENTURES_KEY,
      state: {
        ...createGame("javascript", { kind: "girl", name: "Ada" }, new Date().toISOString()),
        adventureId: "before-training",
      },
    },
  );
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await expect(page.locator(".overlay")).toBeHidden();
  await openAdventureTool(page, "Training");
  await expect(page.locator(".training-shell")).toBeVisible();
});
