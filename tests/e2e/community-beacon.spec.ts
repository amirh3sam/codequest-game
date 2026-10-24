import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { lightingCode } from "../../src/content/lighting-code";
import { loadArea } from "../../src/content/loader";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { createGame } from "../../src/core/state";
import type { Lang } from "../../src/runners/types";

type Circuit = { target: string; power: string; color: string };
type Harness = { __codequest: { game: Phaser.Game } };
test.use({ reducedMotion: "reduce" });
async function seed(page: Page, lang: Lang, firstBoss = false) {
  const base = createGame(lang, { kind: "girl", name: "Nova" }, new Date().toISOString());
  const state = {
    ...base,
    adventureId: `lighting-${lang}`,
    areas: firstBoss
      ? {
          ...base.areas,
          variables: {
            ...base.areas.variables,
            solved: loadArea(lang, "variables").tasks.map((task) => task.id),
            bossDefeated: true,
          },
        }
      : base.areas,
  };
  await page.goto("/");
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [state] })),
    { key: ADVENTURES_KEY, state },
  );
  await page.reload();
  await page.locator(".title-adventure-row").filter({ hasText: "Nova" }).click();
}
async function circuits(page: Page): Promise<Circuit[]> {
  return page.evaluate(() =>
    (window as unknown as Harness).__codequest.game.scene
      .getScene("boot")
      .children.getByName("district-lighting")
      ?.getData("circuits"),
  );
}
async function apply(page: Page, code: string) {
  await page.getByLabel("Lighting code", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Run & apply lighting", exact: true }).click();
}

for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: program power and per-task rail colors, reject invalid commands and preserve saves`, async ({
    page,
  }) => {
    test.setTimeout(150_000);
    await seed(page, lang);
    await page.getByRole("button", { name: "Lighting", exact: true }).click();
    await apply(page, lightingCode(lang, { power: "offline", color: "yellow" }));
    await expect(page.locator(".lighting-console .feedback")).toContainText(/offline.*yellow/, { timeout: 45_000 });
    expect((await circuits(page)).every((light) => light.power === "offline" && light.color === "yellow")).toBe(true);
    await page.getByLabel("Choose part of this map", { exact: true }).selectOption("terminal-3");
    await apply(page, lightingCode(lang, { power: "online", color: "green" }));
    await expect(page.locator(".lighting-console .feedback")).toContainText(/Task 3 rails.*online.*green/, {
      timeout: 45_000,
    });
    const expected = await circuits(page);
    expect(expected[2]).toEqual({ target: "terminal-3", power: "online", color: "green" });
    expect(expected[1]).toEqual({ target: "terminal-2", power: "offline", color: "yellow" });
    await apply(page, lightingCode(lang, { power: "online", color: "green" }).replace('"green"', '"orange"'));
    await expect(page.locator(".lighting-console .feedback")).toContainText("Unknown lighting command: orange", {
      timeout: 45_000,
    });
    expect(await circuits(page)).toEqual(expected);
    const saved = await page.evaluate(
      () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0],
    );
    expect(saved.areas.variables.hearts).toBe(3);
    expect(saved.areas.variables.gems).toBe(0);
    expect(saved.areas.variables.solved).toHaveLength(0);
    await page.reload();
    await page.locator(".title-adventure-row").filter({ hasText: "Nova" }).click();
    expect(await circuits(page)).toEqual(expected);
  });
}

test("each city map saves independent rail colors and whole-map commands clear individual overrides", async ({
  page,
}) => {
  await seed(page, "javascript", true);
  await page.getByRole("button", { name: "Lighting", exact: true }).click();
  await apply(page, lightingCode("javascript", { power: "online", color: "red" }));
  await expect(page.locator(".lighting-console .feedback")).toContainText(/online.*red/);
  await page.getByRole("button", { name: "See the lights in the city", exact: true }).click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator('.world-node[data-level-id="conditions"]').click();
  expect((await circuits(page)).every((light) => light.color === "blue")).toBe(true);
  await page.getByRole("button", { name: "Lighting", exact: true }).click();
  await apply(page, lightingCode("javascript", { power: "online", color: "white" }));
  await expect(page.locator(".lighting-console .feedback")).toContainText(/online.*white/);
  await page.getByLabel("Choose part of this map", { exact: true }).selectOption("terminal-1");
  await apply(page, lightingCode("javascript", { power: "offline", color: "green" }));
  await expect(page.locator(".lighting-console .feedback")).toContainText(/Task 1 rails.*offline/);
  await page.getByLabel("Choose part of this map", { exact: true }).selectOption("all");
  await apply(page, lightingCode("javascript", { power: "online", color: "yellow" }));
  await expect(page.locator(".lighting-console .feedback")).toContainText(/online.*yellow/);
  expect((await circuits(page)).every((light) => light.power === "online" && light.color === "yellow")).toBe(true);
  await page.getByRole("button", { name: "See the lights in the city", exact: true }).click();
  await page.getByRole("button", { name: "World map", exact: true }).click();
  await page.locator('.world-node[data-level-id="variables"]').click();
  expect((await circuits(page)).every((light) => light.color === "red")).toBe(true);
});
