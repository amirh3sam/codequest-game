import { expect, test } from "@playwright/test";
import { loadArea } from "../../src/content/loader";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { createGame } from "../../src/core/state";

test("a cleared level one exposes a direct portal to Logic Junction", async ({ page }) => {
  const created = createGame("javascript", { kind: "girl", name: "Nova" }, new Date().toISOString());
  const area = loadArea("javascript", "variables");
  const completed = {
    ...created,
    adventureId: "portal-level-one",
    areas: {
      ...created.areas,
      variables: {
        ...created.areas.variables,
        solved: area.tasks.map(({ id }) => id),
        bossDefeated: true,
      },
    },
  };

  await page.goto("/");
  await page.evaluate(
    ({ key, game }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [game] })),
    { key: ADVENTURES_KEY, game: completed },
  );
  await page.reload();
  await page.locator(".title-adventure-row").filter({ hasText: "Nova" }).click();

  await expect(page.locator(".location-name")).toHaveText("Variable District");
  await expect(page.getByTestId("next-level-portal")).toContainText("Logic Junction");
  await page.getByTestId("next-level-portal").click();
  await expect(page.locator(".location-name")).toHaveText("Logic Junction");
});
