import { expect, test } from "@playwright/test";
import { loadArea } from "../../src/content/loader";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { createGame } from "../../src/core/state";

type PortalScene = {
  portalActive: boolean;
  portalPosition: { x: number; y: number };
  position: { x: number; y: number };
  interactTouch(): void;
  children: { getByName(name: string): { name?: string } | null };
};
type PortalWindow = { __codequest: { game: { scene: { getScene(key: string): PortalScene } } } };

test("the level portal stays offline until the boss is defeated, then opens destination selection", async ({
  page,
}) => {
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
  const portalState = () =>
    page.evaluate(() => {
      const scene = (window as unknown as PortalWindow).__codequest.game.scene.getScene("boot");
      return {
        active: scene.portalActive,
        position: scene.portalPosition,
        portal: scene.children.getByName("level-portal")?.name,
      };
    });
  const initialPortal = await portalState();
  expect(initialPortal.portal).toBe("level-portal");
  expect(initialPortal.active).toBe(true);
  await page.evaluate(() => {
    const scene = (window as unknown as PortalWindow).__codequest.game.scene.getScene("boot");
    scene.position = { x: scene.portalPosition.x + 50, y: scene.portalPosition.y };
    scene.interactTouch();
  });
  await expect(page.getByRole("heading", { name: "Your journey" })).toBeVisible();
  const logicJunction = page.locator(".world-node").filter({ hasText: "Logic Junction" });
  await expect(logicJunction).toBeEnabled();
  await logicJunction.click();
  await expect(page.locator(".location-name")).toHaveText("Logic Junction");
});

test("an unbeaten boss leaves its graphical portal offline and unable to open the map", async ({ page }) => {
  const created = createGame("javascript", { kind: "girl", name: "Nova" }, new Date().toISOString());
  const unfinished = { ...created, adventureId: "portal-offline", currentArea: "variables" as const };
  await page.goto("/");
  await page.evaluate(
    ({ key, game }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [game] })),
    { key: ADVENTURES_KEY, game: unfinished },
  );
  await page.reload();
  await page.locator(".title-adventure-row").filter({ hasText: "Nova" }).click();
  await expect(page.locator(".location-name")).toHaveText("Variable District");
  const active = await page.evaluate(() => {
    const scene = (window as unknown as PortalWindow).__codequest.game.scene.getScene("boot");
    scene.position = { x: scene.portalPosition.x + 50, y: scene.portalPosition.y };
    scene.interactTouch();
    return scene.portalActive;
  });
  expect(active).toBe(false);
  await expect(page.getByRole("heading", { name: "Your journey" })).toHaveCount(0);
  await expect(page.locator(".location-name")).toHaveText("Variable District");
});
