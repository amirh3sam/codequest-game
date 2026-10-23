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
    await expect(page.getByRole("tab", { name: FILES[lang], exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(page.getByLabel("Practice code", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Practice output", { exact: true })).toBeVisible();
    await page.getByRole("tab", { name: "Console", exact: true }).click();
    await expect(page.getByLabel("Console output", { exact: true })).toHaveText("7\n");
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

for (const kind of ["boy", "girl"] as const) {
  test(`${kind}: an illustrated 2D wrist view enters the full-screen tablet, then restores walking`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");
    await page.getByRole("button", { name: kind === "boy" ? "Boy hero" : "Girl hero", exact: true }).click();
    await page.getByRole("button", { name: "Start adventure", exact: true }).click();
    await page.getByRole("button", { name: "Tablet", exact: true }).click();
    await expect(page.locator(".tablet-cinematic-canvas")).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".tablet-cinematic")).toHaveAttribute("data-character", kind);
    await expect(page.locator(".tablet-cinematic")).toHaveAttribute("data-view", "first-person");
    await expect(page.locator(".tablet-cinematic")).toHaveAttribute("data-renderer", "2d");
    await expect(page.locator(".tablet-cinematic")).toHaveAttribute("data-art-ready", "true");
    await expect
      .poll(() =>
        page.evaluate(() => (window as unknown as Harness).__codequest.game.scene.getScene("boot").cameras.main.zoom),
      )
      .toBeGreaterThan(1.2);
    await expect(page.getByRole("dialog", { name: "Developer tablet", exact: true })).toBeVisible({ timeout: 15_000 });
    await expect(page.locator(".tablet-cinematic-canvas")).toHaveCount(0);
    const panel = await page.getByRole("dialog", { name: "Developer tablet", exact: true }).boundingBox();
    expect(panel?.width).toBe(page.viewportSize()?.width);
    expect(panel?.height).toBe(page.viewportSize()?.height);
    await page.getByRole("tab", { name: "practice.js", exact: true }).focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Examples", exact: true })).toBeFocused();
    await page.keyboard.press("Escape");
    expect(
      await page.evaluate(
        () => (window as unknown as Harness).__codequest.game.scene.getScene("boot").cameras.main.zoom,
      ),
    ).toBe(1);
    expect(errors).toEqual([]);
  });
}

test("tablet and HUD fit a narrow viewport with reduced motion", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await page.getByRole("button", { name: "Tablet", exact: true }).click();
  const panel = await page.getByRole("dialog", { name: "Developer tablet", exact: true }).boundingBox();
  expect(panel?.x).toBeGreaterThanOrEqual(0);
  expect((panel?.x ?? 0) + (panel?.width ?? 0)).toBeLessThanOrEqual(390);
  await expect(page.locator(".tablet-cinematic-canvas")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Run practice code", exact: true })).toBeVisible();
  const editor = await page.getByLabel("Practice code", { exact: true }).boundingBox();
  const output = await page.getByLabel("Practice output", { exact: true }).boundingBox();
  expect(editor).not.toBeNull();
  expect(output).not.toBeNull();
  expect(output?.y).toBeGreaterThanOrEqual((editor?.y ?? 0) + (editor?.height ?? 0));
  expect((output?.y ?? 0) + (output?.height ?? 0)).toBeLessThanOrEqual(844);
});

test("tablet animation can be skipped or closed before its module arrives without a stale reopen", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/assets/tablet-cinematic-*.js", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 800));
    await route.continue();
  });
  await start(page);
  await page.keyboard.press("t");
  await page.getByRole("button", { name: "Skip animation", exact: true }).click();
  await expect(page.getByLabel("Practice code", { exact: true })).toBeVisible();
  await expect(page.locator(".tablet-cinematic-canvas")).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.keyboard.press("t");
  await expect(page.getByRole("button", { name: "Skip animation", exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1100);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as Harness).__codequest.game.scene.getScene("boot").cameras.main.zoom),
  ).toBe(1);
});

test("the workspace remains usable when a 2D animation context is unavailable", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, ...args: Parameters<typeof original>) {
      if (this.classList.contains("tablet-cinematic-canvas")) return null;
      return Reflect.apply(original, this, args);
    } as typeof original;
  });
  await start(page);
  await page.keyboard.press("t");
  await expect(page.getByLabel("Practice code", { exact: true })).toBeVisible({ timeout: 15_000 });
  await expect(page.locator(".tablet-cinematic")).toHaveCount(0);
});

test("missing illustration opens the workspace, and late image loading never reopens a closed tablet", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  let fail = true;
  await page.route("**/assets/tablet/wrist-tablet-2d.png", async (route) => {
    if (fail) await route.abort();
    else {
      await new Promise((resolve) => setTimeout(resolve, 800));
      await route.continue();
    }
  });
  await start(page);
  await page.keyboard.press("t");
  await expect(page.getByLabel("Practice code", { exact: true })).toBeVisible({ timeout: 15_000 });
  await page.keyboard.press("Escape");
  fail = false;
  await page.keyboard.press("t");
  await expect(page.locator(".tablet-cinematic-canvas")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.waitForTimeout(1100);
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.locator(".tablet-cinematic-canvas")).toHaveCount(0);
  expect(
    await page.evaluate(() => (window as unknown as Harness).__codequest.game.scene.getScene("boot").cameras.main.zoom),
  ).toBe(1);
});

test("missions and guides are usable inside the device and graded tasks retain its frame", async ({ page }) => {
  await start(page);
  await page.keyboard.press("t");
  await page.getByRole("tab", { name: "Guide", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Variables are named containers", exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Missions", exact: true }).click();
  await page.getByRole("button", { name: "Work on Set your display name", exact: true }).click();
  await expect(page.locator(".tablet-task-view")).toBeVisible();
  await page.getByLabel("Your code", { exact: true }).fill('const heroName = "Ada";\nconsole.log(heroName);');
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Correct!");
  await page.getByRole("button", { name: "Tablet home", exact: true }).click();
  await page.getByRole("tab", { name: "Missions", exact: true }).click();
  await expect(page.locator(".studio-missions")).toContainText("1/8 complete");
  await expect(page.locator(".studio-missions")).toContainText("1 gems");
});
