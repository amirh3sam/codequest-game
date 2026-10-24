import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { loadVariables } from "../../src/content/loader";
import { createGame, type GameState, solveTask } from "../../src/core/state";
import type { BootScene } from "../../src/game/scenes/BootScene";
import type { Lang } from "../../src/runners/types";
import { openAdventureTool } from "./helpers/adventure-tools";

type Harness = { __codequest: { game: Phaser.Game } };
test.use({ reducedMotion: "reduce" });

async function seed(
  page: Page,
  lang: Lang,
  repaired = false,
  kind: "boy" | "girl" = "girl",
  intro = false,
): Promise<void> {
  const area = loadVariables(lang),
    time = new Date().toISOString();
  let state = createGame(lang, { kind, name: "Nova" }, time);
  if (!intro) state = solveTask(state, area, "variables-1", time);
  if (repaired) state = solveTask(state, area, "variables-2", time);
  state = { ...state, position: { x: 768, y: 370 } };
  await page.goto("/");
  await expect(page.getByRole("textbox", { name: "Developer name", exact: true })).toBeVisible({ timeout: 15_000 });
  await page.evaluate((state) => {
    localStorage.clear();
    localStorage.setItem(`codequest:v1:${state.lang}`, JSON.stringify(state));
  }, state);
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
}
async function saved(page: Page, lang: Lang): Promise<GameState> {
  return page.evaluate((lang) => JSON.parse(localStorage.getItem(`codequest:v1:${lang}`) ?? "{}"), lang);
}
async function routeOpen(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
    return scene.children.getByName("courier-gate")?.getData("routeOpen") === true;
  });
}
async function position(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() =>
    ((window as unknown as Harness).__codequest.game.scene.getScene("boot") as BootScene).getPosition(),
  );
}

test("the battery courier and introduction use the opposite hero", async ({ page }) => {
  for (const choice of [
    { player: "boy", guide: "Ava", texture: "hero-girl" },
    { player: "girl", guide: "Kai", texture: "hero-boy" },
  ] as const) {
    await seed(page, "javascript", false, choice.player, true);
    await openAdventureTool(page, "Mission");
    await expect(page.getByRole("heading", { name: `${choice.guide} - A delivery worth debugging` })).toBeVisible();
    await expect(page.locator(".courier-intro")).toContainText(`I'm ${choice.guide}`);
    const courier = await page.evaluate(() => {
      const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
      const group = scene.children.getByName("courier-kai") as Phaser.GameObjects.Container;
      return group.list.map((child) => ({
        texture: (child as Phaser.GameObjects.Image).texture?.key,
        text: (child as Phaser.GameObjects.Text).text,
      }));
    });
    expect(courier.some((child) => child.texture === choice.texture)).toBe(true);
    expect(courier.some((child) => child.text === `${choice.guide.toUpperCase()} / COURIER`)).toBe(true);
    await page.getByRole("button", { name: "Look around the city" }).click();
  }
});

for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: free prediction and preview lead to a persistent drone repair`, async ({ page }) => {
    test.setTimeout(180_000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    if (lang === "javascript") await page.emulateMedia({ reducedMotion: "no-preference" });
    await seed(page, lang);
    expect(await routeOpen(page)).toBe(false);
    await openAdventureTool(page, "Mission");
    // Worker exercises need no canvas frames; leave CPU available for the Java compiler.
    await page.evaluate(() => (window as unknown as Harness).__codequest.game.loop.sleep());
    await expect(page.getByRole("heading", { name: "Predict before you run" })).toBeVisible();
    await page.getByRole("button", { name: "3 cells", exact: true }).click();
    await page.getByRole("button", { name: "Run example", exact: true }).click();
    await expect(page.getByRole("meter", { name: "Drone battery" })).toHaveAttribute("aria-valuenow", "5", {
      timeout: 40_000,
    });
    await expect(page.locator(".lesson-feedback")).toContainText("program printed 5");
    await page.getByRole("button", { name: "Try changing the charge", exact: true }).click();
    await page.getByLabel("Charge to add", { exact: true }).fill("9");
    await page.getByRole("button", { name: "Preview charge", exact: true }).click();
    await expect(page.getByRole("meter", { name: "Drone battery" })).toHaveAttribute("aria-valuenow", "12", {
      timeout: 40_000,
    });
    expect((await saved(page, lang)).areas.variables).toMatchObject({ solved: ["variables-1"], gems: 1, hearts: 3 });
    expect(await routeOpen(page)).toBe(false);
    await page.getByRole("button", { name: "Build the repair", exact: true }).click();
    await page.getByLabel("Your code", { exact: true }).fill(loadVariables(lang).tasks[1]?.solution ?? "");
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    await expect(page.locator(".feedback")).toContainText("Correct!", { timeout: 40_000 });
    expect(await routeOpen(page)).toBe(true);
    await page.evaluate(() => (window as unknown as Harness).__codequest.game.loop.wake());
    await page.getByRole("button", { name: "Watch the delivery", exact: true }).click();
    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(page.locator(".toast")).toContainText("Delivery complete!");
    await page.reload();
    await page.locator(".title-adventure-row").first().click();
    expect(await routeOpen(page)).toBe(true);
    expect((await saved(page, lang)).areas.variables).toMatchObject({
      solved: ["variables-1", "variables-2"],
      gems: 2,
      hearts: 3,
    });
    await openAdventureTool(page, "Mission");
    await page.getByRole("button", { name: "Try a different battery", exact: true }).click();
    await page.evaluate(() => (window as unknown as Harness).__codequest.game.loop.sleep());
    await page.getByRole("button", { name: "7 cells", exact: true }).click();
    await page.getByRole("button", { name: "Run example", exact: true }).click();
    await expect(page.getByRole("meter", { name: "Drone battery" })).toHaveAttribute("aria-valuenow", "7", {
      timeout: 40_000,
    });
    expect((await saved(page, lang)).areas.variables.gems).toBe(2);
    expect(errors).toEqual([]);
  });
}

test("Kai gives a purpose to the first badge and leads into the lesson", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await openAdventureTool(page, "Mission");
  await expect(page.getByRole("heading", { name: "Kai · A delivery worth debugging" })).toBeVisible();
  await page.getByRole("button", { name: "Create the training badge", exact: true }).click();
  await page.getByLabel("Your code", { exact: true }).fill(loadVariables("javascript").tasks[0]?.solution ?? "");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Correct!");
  await page.getByRole("button", { name: "Continue with Kai", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Predict before you run" })).toBeVisible();
});

test("a closed gate stops walking; an existing completion restores a walkable lane", async ({ page }) => {
  await seed(page, "javascript");
  await page.keyboard.down("w");
  await page.waitForTimeout(700);
  await page.keyboard.up("w");
  expect((await position(page)).y).toBeGreaterThanOrEqual(354);
  await openAdventureTool(page, "Mission");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  expect((await saved(page, "javascript")).areas.variables.gems).toBe(1);
  // Load a version-1 save with the same task IDs used before the drone existed.
  await page.reload();
  await seed(page, "javascript", true);
  expect(await routeOpen(page)).toBe(true);
  await page.keyboard.down("w");
  await expect.poll(async () => (await position(page)).y, { timeout: 6000 }).toBeLessThan(245);
  await page.keyboard.up("w");
  expect((await saved(page, "javascript")).areas.variables.gems).toBe(2);
});

test("opening the tablet during a delivery restores the camera and permits walking afterward", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await seed(page, "javascript");
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: /2\. Charge the delivery drone/ }).click();
  await page.getByLabel("Your code", { exact: true }).fill(loadVariables("javascript").tasks[1]?.solution ?? "");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback")).toContainText("Correct!");
  await page.getByRole("button", { name: "Watch the delivery", exact: true }).click();
  await page.keyboard.press("t");
  await expect(page.getByRole("dialog", { name: "Developer tablet", exact: true })).toBeVisible({ timeout: 15_000 });
  expect(await routeOpen(page)).toBe(true);
  await page.keyboard.press("Escape");
  const before = await position(page);
  await page.keyboard.down("d");
  await expect.poll(async () => (await position(page)).x).toBeGreaterThan(before.x + 15);
  await page.keyboard.up("d");
});
