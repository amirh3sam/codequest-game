import { expect, type Page, test } from "@playwright/test";
import { cityGuide } from "../../src/content/guided-tour";
import { GUIDE_KEY } from "../../src/core/guided-tour";
import { openAdventureTool } from "./helpers/adventure-tools";

test.use({ storageState: { cookies: [], origins: [] }, reducedMotion: "reduce" });
test.setTimeout(90_000);
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Boy hero", exact: true }).click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await expect(page.locator(".guide-tour")).toBeVisible();
}
async function jump(page: Page, id: string) {
  const index = cityGuide("Ava").findIndex((step) => step.id === id);
  await page.getByLabel("Guide tour topic", { exact: true }).selectOption(String(index));
  await expect(page.locator(".guide-tour")).toHaveAttribute("data-step", id);
}
const areas = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0].areas);

test("first-time character guide highlights live controls and opens all seven tablet tabs", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await start(page);
  const before = await areas(page);
  await expect(page.locator(".guide-channel")).toContainText("Ava");
  await expect(page.locator("#ui")).toHaveJSProperty("inert", true);
  await page.getByLabel("Guide tour topic", { exact: true }).focus();
  await page.keyboard.press("ArrowDown");
  await expect(page.locator(".guide-tour")).toHaveAttribute("data-step", "status");
  for (const id of ["status", "movement", "tools"]) {
    await jump(page, id);
    await expect(page.locator(".guide-ring")).toBeVisible();
  }
  for (const [id, tab] of [
    ["tablet", 0],
    ["code", 0],
    ["files", 0],
    ["run", 0],
    ["examples", 1],
    ["console", 0],
    ["missions", 2],
    ["lesson", 3],
    ["daily", 4],
    ["study", 5],
    ["projects", 6],
  ] as const) {
    await jump(page, id);
    await expect(page.locator(".guide-tour")).toHaveAttribute("data-target", id);
    await expect(page.locator(".studio-tab").nth(tab)).toHaveAttribute("aria-selected", "true");
    await expect(page.locator(".guide-ring")).toBeVisible();
  }
  await jump(page, "files");
  await page.screenshot({ path: info.outputPath("guide-explorer.png"), animations: "disabled" });
  for (const id of ["map", "lighting", "arcade", "save", "load", "character", "comfort"]) {
    await jump(page, id);
    await expect(page.locator(".guide-tour")).toHaveAttribute("data-target", id);
    await expect(page.locator(".guide-ring")).toBeVisible();
  }
  await jump(page, "save");
  await expect(page.locator("#guide-full-text")).toContainText("hard drive");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download my adventure backup", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("CodeQuest");
  await jump(page, "ready");
  await page.getByRole("button", { name: "Finish tour", exact: true }).click();
  await expect(page.locator(".guide-tour")).toHaveCount(0);
  await expect(page.locator("#ui")).toHaveJSProperty("inert", false);
  expect(await areas(page)).toEqual(before);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").status, GUIDE_KEY)).toBe(
    "complete",
  );
  await openAdventureTool(page, "Guide tour");
  await expect(page.locator(".guide-tour")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".guide-tour")).toHaveCount(0);
  await page.keyboard.press("t");
  await expect(page.getByRole("dialog", { name: "Developer tablet", exact: true })).toBeVisible();
  await page.getByLabel("Practice code", { exact: true }).fill('console.log("Guide complete");');
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await expect(page.getByLabel("Practice output", { exact: true })).toHaveText("Guide complete\n", { timeout: 30_000 });
  expect(errors).toEqual([]);
});

test("deleting a character in another tab dismisses its running tour safely", async ({ page }) => {
  await start(page);
  await jump(page, "code");
  const other = await page.context().newPage();
  await other.goto("/");
  await other.locator(".title-adventure-row").first().click();
  await other.getByRole("button", { name: "Skip tour", exact: true }).click();
  await other.getByRole("button", { name: "Menu", exact: true }).click();
  await other.getByRole("button", { name: "Manage character", exact: true }).click();
  await other.getByRole("button", { name: "Delete this character", exact: true }).click();
  await other.getByLabel("Type DELETE to confirm", { exact: true }).fill("DELETE");
  await other.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(page.locator(".guide-tour")).toHaveCount(0);
  await expect(page.locator("#ui")).toHaveJSProperty("inert", false);
  await expect(page.getByRole("button", { name: "Start adventure", exact: true })).toBeVisible();
  await other.close();
  await page.reload();
  await expect(page.locator(".title-adventure-row")).toHaveCount(0);
});

test("refresh resumes the tour and skipping leaves existing code untouched", async ({ page }) => {
  await start(page);
  await jump(page, "code");
  await page.keyboard.press("Escape");
  await page.keyboard.press("t");
  await page.getByLabel("Practice code", { exact: true }).fill('console.log("Keep my code");');
  await page.keyboard.press("Escape");
  await openAdventureTool(page, "Guide tour");
  await jump(page, "projects");
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await expect(page.locator(".guide-tour")).toHaveAttribute("data-step", "projects");
  await page.getByRole("button", { name: "Skip tour", exact: true }).click();
  await page.keyboard.press("t");
  await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue('console.log("Keep my code");');
});

test("title tour and animated captions have replay, instant text and handbook access", async ({ page }, info) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await openAdventureTool(page, "Guide tour");
  await expect(page.locator(".guide-tour")).toHaveClass(/guide-talking/);
  await page.getByRole("button", { name: "Show all text", exact: true }).click();
  await expect(page.locator(".guide-copy")).toContainText("launch screen");
  await page.getByRole("button", { name: "Next →", exact: true }).click();
  await expect(page.locator(".guide-tour")).toHaveAttribute("data-target", "language");
  await page.screenshot({ path: info.outputPath("guide-title.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Open detailed handbook", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "CodeQuest training", exact: true })).toBeVisible();
  await expect(page.locator(".guide-tour")).toHaveCount(0);
  await expect(page.locator("#ui")).toHaveJSProperty("inert", false);
});
