import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { batteryExample } from "../../src/content/drone-pilot";
import type { Lang } from "../../src/runners/types";

type Harness = { __codequest: { game: Phaser.Game } };
const FILES = { javascript: "practice.js", typescript: "practice.ts", python: "practice.py", java: "Main.java" };
test.use({ reducedMotion: "reduce" });

async function start(page: Page, lang: Lang = "javascript"): Promise<void> {
  await page.goto("/");
  await page.locator(`[data-language="${lang}"]`).click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
}
async function progress(page: Page, lang: Lang) {
  return page.evaluate((lang) => JSON.parse(localStorage.getItem(`codequest:v1:${lang}`) ?? "{}").areas, lang);
}
for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: tablet runs code, has useful tabs and saves a separate free-practice draft`, async ({ page }) => {
    test.setTimeout(150_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await start(page, lang);
    const before = await progress(page, lang);
    await page.keyboard.press("t");
    await expect(page.getByRole("dialog", { name: "Developer tablet", exact: true })).toBeVisible();
    await expect(page.getByRole("tab", { name: FILES[lang], exact: true })).toHaveAttribute("aria-selected", "true");
    await page.evaluate(() => (window as unknown as Harness).__codequest.game.loop.sleep());
    const code = batteryExample(lang, 4, 3);
    await page.getByLabel("Practice code", { exact: true }).fill(code);
    await page.getByRole("button", { name: "Run practice code", exact: true }).click();
    await expect(page.getByLabel("Practice output", { exact: true })).toHaveText("7\n", { timeout: 40_000 });
    await expect(page.getByRole("tab", { name: "Console", exact: true })).toHaveAttribute("aria-selected", "true");
    expect(await progress(page, lang)).toEqual(before);
    await page.getByRole("tab", { name: "Examples", exact: true }).click();
    await page.getByRole("button", { name: "Insert say hello example", exact: true }).click();
    await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue(/Hello, CodeQuest!/);
    await page.getByLabel("Practice code", { exact: true }).fill(code);
    await page.keyboard.press("Escape");
    await page.keyboard.press("t");
    await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue(code);
    await page.reload();
    await page.getByRole("button", { name: "Continue adventure", exact: true }).click();
    await page.getByRole("button", { name: "Tablet", exact: true }).click();
    await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue(code);
    expect(await progress(page, lang)).toEqual(before);
    expect(errors).toEqual([]);
  });
}

test("closing a running tablet program cancels it and permits another run", async ({ page }) => {
  await start(page);
  await page.keyboard.press("t");
  await page.getByLabel("Practice code", { exact: true }).fill("while (true) {}");
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.keyboard.press("t");
  await page.getByLabel("Practice code", { exact: true }).fill("console.log(21);");
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await expect(page.getByLabel("Practice output", { exact: true })).toHaveText("21\n");
  await expect(page.getByTestId("hearts")).toHaveAttribute("aria-label", "3 hearts");
  await expect(page.getByTestId("gems")).toContainText("0");
  await page.getByRole("tab", { name: "practice.js", exact: true }).click();
  await page.getByLabel("Practice code", { exact: true }).fill("");
  await page.getByLabel("Practice code", { exact: true }).press("t");
  await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue("t");
});

test("the tablet reveal animates for either developer and tabs support keyboard navigation", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");
  await page.getByRole("button", { name: "Boy hero", exact: true }).click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.getByRole("button", { name: "Tablet", exact: true }).click();
  await expect(page.locator(".tablet-hero")).toHaveCount(1);
  await expect.poll(() => page.locator(".tablet-studio").evaluate((node) => getComputedStyle(node).opacity)).toBe("1");
  await expect(page.locator(".tablet-reveal")).toHaveCSS("visibility", "hidden");
  await page.getByRole("tab", { name: "practice.js", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Examples", exact: true })).toBeFocused();
  await expect(page.getByRole("tab", { name: "Examples", exact: true })).toHaveAttribute("aria-selected", "true");
});

test("tablet and HUD fit a narrow viewport with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page.getByRole("button", { name: "Tablet", exact: true }).click();
  const panel = await page.getByRole("dialog", { name: "Developer tablet", exact: true }).boundingBox();
  expect(panel?.x).toBeGreaterThanOrEqual(0);
  expect((panel?.x ?? 0) + (panel?.width ?? 0)).toBeLessThanOrEqual(390);
  await expect(page.locator(".tablet-reveal")).toBeHidden();
  await expect(page.getByRole("button", { name: "Run practice code", exact: true })).toBeVisible();
});
