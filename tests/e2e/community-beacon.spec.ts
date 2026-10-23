import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { BEACON_EVENTS, beaconCode } from "../../src/content/community-beacon";
import { loadVariables } from "../../src/content/loader";
import { createGame, type GameState, solveTask } from "../../src/core/state";
import type { BootScene } from "../../src/game/scenes/BootScene";
import type { Lang } from "../../src/runners/types";

type Harness = { __codequest: { game: Phaser.Game } };
test.use({ reducedMotion: "reduce" });
async function seed(page: Page, lang: Lang, repaired = true) {
  const time = new Date().toISOString(),
    area = loadVariables(lang);
  let state = createGame(lang, { kind: "girl", name: "Nova" }, time);
  if (repaired) for (const id of ["variables-1", "variables-2"]) state = solveTask(state, area, id, time);
  state = { ...state, position: { x: 866, y: 330 } };
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Start adventure", exact: true })).toBeVisible();
  await page.evaluate((state) => localStorage.setItem(`codequest:v1:${state.lang}`, JSON.stringify(state)), state);
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
}
async function saved(page: Page, lang: Lang): Promise<GameState> {
  return page.evaluate((lang) => JSON.parse(localStorage.getItem(`codequest:v1:${lang}`) ?? "{}"), lang);
}
async function choiceInWorld(page: Page) {
  return page.evaluate(() =>
    (window as unknown as Harness).__codequest.game.scene
      .getScene("boot")
      .children.getByName("community-beacon")
      ?.getData("choice"),
  );
}
async function openFromTasks(page: Page) {
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await page.getByRole("button", { name: "Optional discovery · Community beacon", exact: true }).click();
}
for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: preview, choice and world restoration persist without changing rewards`, async ({ page }) => {
    test.setTimeout(150_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await seed(page, lang);
    const before = (await saved(page, lang)).areas;
    await page.keyboard.press("e");
    await expect(page.getByLabel("Beacon code", { exact: true })).toBeVisible();
    await page.evaluate(() => (window as unknown as Harness).__codequest.game.loop.sleep());
    await page.getByRole("button", { name: "Run beacon preview", exact: true }).click();
    await expect(page.getByLabel("Beacon output", { exact: true })).toHaveText("Offline\n", { timeout: 40_000 });
    await expect(page.getByRole("button", { name: "Light the beacon", exact: true })).toBeDisabled();
    expect((await saved(page, lang)).areas).toEqual(before);
    expect(await choiceInWorld(page)).toBeNull();
    const choice = lang === "javascript" || lang === "python" ? "garden" : "arcade";
    await page.getByRole("button", { name: BEACON_EVENTS[choice].title, exact: true }).click();
    await page.getByLabel("Beacon code", { exact: true }).fill(beaconCode(lang, BEACON_EVENTS[choice].title, true));
    await page.getByRole("button", { name: "Run beacon preview", exact: true }).click();
    await expect(page.getByRole("button", { name: "Light the beacon", exact: true })).toBeEnabled({ timeout: 40_000 });
    expect(await choiceInWorld(page)).toBeNull();
    await page.getByRole("button", { name: "Light the beacon", exact: true }).click();
    await expect(page.getByRole("heading", { name: "The courtyard is on air!", exact: true })).toBeVisible();
    expect(await choiceInWorld(page)).toBe(choice);
    expect((await saved(page, lang)).areas).toEqual(before);
    await page.reload();
    await page.locator(".title-adventure-row").first().click();
    expect(await choiceInWorld(page)).toBe(choice);
    await page.keyboard.press("t");
    await page.getByRole("tab", { name: "Missions", exact: true }).click();
    await expect(page.locator(".beacon-log")).toContainText(`Signal Maker · ${BEACON_EVENTS[choice].title}`);
    await page.getByRole("button", { name: "Visit community beacon", exact: true }).click();
    await expect(page.getByRole("button", { name: "Tablet home", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Tablet home", exact: true }).click();
    await expect(page.getByLabel("Practice code", { exact: true })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("edited code or another event requires a fresh preview; retries and reconfiguration are free", async ({
  page,
}) => {
  await seed(page, "javascript");
  const before = (await saved(page, "javascript")).areas;
  await openFromTasks(page);
  const code = page.getByLabel("Beacon code", { exact: true }),
    activate = page.getByRole("button", { name: "Light the beacon", exact: true }),
    run = page.getByRole("button", { name: "Run beacon preview", exact: true });
  await code.fill(beaconCode("javascript", "Garden night", true));
  await run.click();
  await expect(activate).toBeEnabled();
  await code.fill('console.log("wrong");');
  await expect(activate).toBeDisabled();
  await page.getByRole("button", { name: "Arcade night", exact: true }).click();
  await expect(activate).toBeDisabled();
  await code.fill('throw new Error("test failure");');
  await run.click();
  await expect(page.locator(".feedback")).toContainText("test failure");
  await expect(activate).toBeDisabled();
  expect(await choiceInWorld(page)).toBeNull();
  await code.fill(beaconCode("javascript", "Arcade night", true));
  await run.click();
  await expect(activate).toBeEnabled();
  await activate.click();
  await page.getByRole("button", { name: "See the courtyard", exact: true }).click();
  await openFromTasks(page);
  await page.getByRole("button", { name: "Garden night", exact: true }).click();
  await code.fill(beaconCode("javascript", "Garden night", true));
  await run.click();
  await expect(activate).toBeEnabled();
  await activate.click();
  expect(await choiceInWorld(page)).toBe("garden");
  expect((await saved(page, "javascript")).areas).toEqual(before);
});

test("beacon has a solid base, a prerequisite and a reachable path around it", async ({ page }) => {
  await seed(page, "javascript", false);
  await page.keyboard.down("w");
  await page.waitForTimeout(650);
  await page.keyboard.up("w");
  const position = () =>
    page.evaluate(() =>
      ((window as unknown as Harness).__codequest.game.scene.getScene("boot") as BootScene).getPosition(),
    );
  expect((await position()).y).toBeGreaterThanOrEqual(306);
  expect((await position()).y).toBeLessThan(330);
  await page.keyboard.press("e");
  await expect(page.getByRole("button", { name: "Help Kai first", exact: true })).toBeVisible();
  await expect(page.getByLabel("Beacon code", { exact: true })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await page.keyboard.down("d");
  await expect.poll(async () => (await position()).x).toBeGreaterThan(906);
  await page.keyboard.up("d");
  expect((await position()).x).toBeGreaterThan(900);
  await page.keyboard.down("w");
  await expect.poll(async () => (await position()).y).toBeLessThan(280);
  await page.keyboard.up("w");
  expect((await position()).y).toBeLessThan(280);
});

test("closing a running preview cannot activate a stale result", async ({ page }) => {
  await seed(page, "javascript");
  await openFromTasks(page);
  await page.getByLabel("Beacon code", { exact: true }).fill("while (true) {}");
  await page.getByRole("button", { name: "Run beacon preview", exact: true }).click();
  await page.keyboard.press("Escape");
  await openFromTasks(page);
  await expect(page.getByRole("button", { name: "Light the beacon", exact: true })).toBeDisabled();
  await page.getByLabel("Beacon code", { exact: true }).fill(beaconCode("javascript", "Garden night", true));
  await page.getByRole("button", { name: "Run beacon preview", exact: true }).click();
  await expect(page.getByRole("button", { name: "Light the beacon", exact: true })).toBeEnabled();
  expect(await choiceInWorld(page)).toBeNull();
});
