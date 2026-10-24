import { expect, type Page, test } from "@playwright/test";
import { loadArea } from "../../src/content/loader";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { createGame, solveTask } from "../../src/core/state";

test.use({ reducedMotion: "reduce" });
async function seed(page: Page, resume = true) {
  const at = new Date().toISOString();
  const first = {
    ...solveTask(
      createGame("javascript", { name: "Ada", kind: "girl" }, at),
      loadArea("javascript", "variables"),
      "variables-1",
      at,
    ),
    adventureId: "manage-ada",
    training: { districts: ["variables" as const] },
    games: { packetDashBest: 88 },
  };
  const other = {
    ...createGame("javascript", { name: "Noah", kind: "boy" }, at),
    adventureId: "manage-noah",
    training: { districts: ["variables" as const] },
  };
  await page.goto("/");
  await page.evaluate(
    ({ key, first, other }) => {
      localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [first, other] }));
      localStorage.setItem("codequest:v1:javascript", JSON.stringify(first));
      localStorage.setItem("codequest:tablet:v2:manage-ada", 'console.log("Keep Ada work");');
      localStorage.setItem("codequest:project-workspace:v1:manage-ada:badge-builder", "Ada project");
      localStorage.setItem("codequest:project-progress:v1:manage-ada:badge-builder", "1");
      localStorage.setItem("codequest:workspace:v1:manage-noah", "Noah project");
      localStorage.setItem("other-app-data", "keep this");
    },
    { key: ADVENTURES_KEY, first, other },
  );
  await page.reload();
  if (resume) await page.locator(".title-adventure-row").filter({ hasText: "Ada's" }).click();
  return { first, other };
}
async function manageActive(page: Page) {
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Manage character", exact: true }).click();
}
const library = (page: Page) =>
  page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").adventures, ADVENTURES_KEY);

test("rename updates the live character and title while retaining missions, records and drafts", async ({ page }) => {
  const { first, other } = await seed(page);
  await manageActive(page);
  await page.getByLabel("Character name", { exact: true }).fill(" ");
  await expect(page.getByRole("button", { name: "Save name", exact: true })).toBeDisabled();
  await page.getByLabel("Character name", { exact: true }).fill("Alex");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue("Alex");
  await page.keyboard.press("Escape");
  await expect(page.locator(".hero-name")).toHaveText("Alex");
  const stored = await library(page);
  expect(stored.find((entry: { adventureId: string }) => entry.adventureId === first.adventureId).areas).toEqual(
    first.areas,
  );
  expect(stored.find((entry: { adventureId: string }) => entry.adventureId === other.adventureId)).toEqual(other);
  await page.reload();
  await expect(page.locator(".title-adventure-row").filter({ hasText: "Alex's" })).toBeVisible();
  await page.locator(".title-adventure-row").filter({ hasText: "Alex's" }).click();
  await page.keyboard.press("t");
  await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue('console.log("Keep Ada work");');
});

test("restart is confirmed, permits a backup first, and resets only the selected adventure", async ({ page }) => {
  const { first, other } = await seed(page);
  await manageActive(page);
  await page.getByRole("button", { name: "Restart this adventure", exact: true }).click();
  await expect(page.getByRole("button", { name: "Restart permanently", exact: true })).toBeDisabled();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Download backup before continuing", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("Ada");
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(
    (await library(page)).find((entry: { adventureId: string }) => entry.adventureId === first.adventureId).areas,
  ).toEqual(first.areas);
  await page.getByRole("button", { name: "Restart this adventure", exact: true }).click();
  await page.getByLabel("Type RESTART to confirm", { exact: true }).fill("RESTART");
  await page.getByRole("button", { name: "Restart permanently", exact: true }).click();
  await expect(page.locator(".hero-name")).toHaveText("Ada");
  await expect(page.getByTestId("gems")).toContainText("0");
  const after = await library(page);
  expect(after).toHaveLength(2);
  const restarted = after.find((entry: { adventureId: string }) => entry.adventureId !== other.adventureId);
  expect(restarted.adventureId).not.toBe(first.adventureId);
  expect(restarted.hero).toEqual(first.hero);
  expect(restarted.games).toBeUndefined();
  expect(restarted.areas).toEqual(createGame("javascript", first.hero, first.updatedAt).areas);
  expect(after.find((entry: { adventureId: string }) => entry.adventureId === other.adventureId)).toEqual(other);
  expect(
    await page.evaluate(() => localStorage.getItem("codequest:project-workspace:v1:manage-ada:badge-builder")),
  ).toBeNull();
  expect(await page.evaluate(() => localStorage.getItem("codequest:workspace:v1:manage-noah"))).toBe("Noah project");
  await page.reload();
  await expect(page.locator(".title-adventure-row")).toHaveCount(2);
  expect((await library(page)).some((entry: { adventureId: string }) => entry.adventureId === first.adventureId)).toBe(
    false,
  );
});

test("delete from the title library cannot resurrect a compatibility snapshot after refresh", async ({ page }) => {
  const { other } = await seed(page, false);
  await page.getByRole("button", { name: "Manage adventures", exact: true }).click();
  await page.getByRole("button", { name: "Manage Ada", exact: true }).click();
  await page.getByRole("button", { name: "Delete this character", exact: true }).click();
  await expect(page.getByRole("button", { name: "Delete permanently", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await library(page)).toHaveLength(2);
  await page.getByRole("button", { name: "Delete this character", exact: true }).click();
  await page.getByLabel("Type DELETE to confirm", { exact: true }).fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(page.locator(".adventure-card")).toHaveCount(1);
  expect(await library(page)).toEqual([other]);
  expect(await page.evaluate(() => localStorage.getItem("codequest:tablet:v2:manage-ada"))).toBeNull();
  await page.reload();
  await expect(page.locator(".title-adventure-row")).toHaveCount(1);
  await expect(page.locator(".title-adventure-row")).toContainText("Noah's");
});

test("deleting the active character stops autosave and returns to the title", async ({ page }) => {
  await seed(page);
  const second = await page.context().newPage();
  await second.goto("/");
  await second.locator(".title-adventure-row").filter({ hasText: "Ada's" }).click();
  await second.keyboard.press("t");
  await second.getByLabel("Practice code", { exact: true }).fill('console.log("Another tab draft");');
  await manageActive(page);
  await page.getByRole("button", { name: "Delete this character", exact: true }).click();
  await page.getByLabel("Type DELETE to confirm", { exact: true }).fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Start (a new )?adventure$/ })).toBeVisible();
  await expect(second.getByRole("button", { name: /^Start (a new )?adventure$/ })).toBeVisible();
  await second.close();
  await page.keyboard.press("w");
  await page.reload();
  expect(await library(page)).toHaveLength(1);
  expect(await page.evaluate(() => localStorage.getItem("codequest:tablet:v2:manage-ada"))).toBeNull();
  await expect(page.locator(".title-adventure-row")).toContainText("Noah's");
});

test("erasing the profile stops another tab's open tablet from restoring deleted drafts", async ({ page }) => {
  await seed(page);
  const second = await page.context().newPage();
  await second.goto("/");
  await second.locator(".title-adventure-row").filter({ hasText: "Ada's" }).click();
  await second.keyboard.press("t");
  await second.getByLabel("Practice code", { exact: true }).fill('console.log("Pending draft");');
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Switch adventure", exact: true }).click();
  await page.getByRole("button", { name: "Delete all game data", exact: true }).click();
  await page.getByLabel("Type DELETE ALL to confirm", { exact: true }).fill("DELETE ALL");
  await page.getByRole("button", { name: "Delete all data permanently", exact: true }).click();
  await expect(page.getByRole("button", { name: "Start adventure", exact: true })).toBeVisible();
  await expect(second.getByRole("button", { name: "Start adventure", exact: true })).toBeVisible();
  await second.close();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("codequest:")))).toEqual(
    [],
  );
  await page.reload();
  await expect(page.locator(".title-adventure-row")).toHaveCount(0);
});
