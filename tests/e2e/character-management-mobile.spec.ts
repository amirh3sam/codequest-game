import { expect, test } from "@playwright/test";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { createGame } from "../../src/core/state";

test.use({ reducedMotion: "reduce", viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
test("all character controls work in portrait; erasing the profile preserves unrelated data", async ({
  page,
}, info) => {
  const states = ["Ada", "Noah"].map((name) => ({
    ...createGame("javascript", { name, kind: "girl" }, new Date().toISOString()),
    adventureId: `mobile-${name}`,
  }));
  await page.goto("/");
  await page.evaluate(
    ({ key, states }) => {
      localStorage.setItem(key, JSON.stringify({ version: 1, adventures: states }));
      localStorage.setItem("codequest:workspace:v1:mobile-Ada", "browser project");
      localStorage.setItem("other-app-data", "keep this");
    },
    { key: ADVENTURES_KEY, states },
  );
  await page.reload();
  await page.getByRole("button", { name: "Manage adventures", exact: true }).tap();
  await page.getByRole("button", { name: "Manage Ada", exact: true }).tap();
  await page.getByLabel("Character name", { exact: true }).fill("Ava");
  await page.getByRole("button", { name: "Save name", exact: true }).tap();
  await expect(page.getByLabel("Character name", { exact: true })).toHaveValue("Ava");
  await page.screenshot({ path: info.outputPath("mobile-manage-character.png"), animations: "disabled" });
  await page.getByRole("button", { name: "Restart this adventure", exact: true }).tap();
  await expect(page.getByRole("button", { name: "Restart permanently", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel", exact: true }).tap();
  await page.getByRole("button", { name: "Delete this character", exact: true }).tap();
  await expect(page.getByRole("button", { name: "Delete permanently", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel", exact: true }).tap();
  await page.getByRole("button", { name: "Back to adventures", exact: true }).tap();
  await page.getByRole("button", { name: "Delete all game data", exact: true }).tap();
  await expect(page.getByRole("button", { name: "Delete all data permanently", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancel", exact: true }).tap();
  await page.getByRole("button", { name: "Manage adventures", exact: true }).tap();
  await page.getByRole("button", { name: "Delete all game data", exact: true }).tap();
  await page.getByLabel("Type DELETE ALL to confirm", { exact: true }).fill("DELETE ALL");
  await page.getByRole("button", { name: "Delete all data permanently", exact: true }).tap();
  await expect(page.getByRole("button", { name: "Start adventure", exact: true })).toBeVisible();
  expect(await page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("codequest:")))).toEqual(
    [],
  );
  expect(await page.evaluate(() => localStorage.getItem("other-app-data"))).toBe("keep this");
  await expect(page.locator(".title-adventure-row")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
