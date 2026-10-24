import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { loadArea } from "../../src/content/loader";
import { ADVENTURES_KEY } from "../../src/core/adventures";
import { createGame, type Position } from "../../src/core/state";
import { portalArrivalPosition } from "../../src/game/district-layout";

type WorldScene = Phaser.Scene & { getPosition(): Position; portalPosition: Position; portalActive: boolean };
type Harness = { __codequest: { game: Phaser.Game } };
test.use({ reducedMotion: "reduce" });

async function clickTransit(page: Page): Promise<void> {
  const canvas = await page.locator("#game canvas").boundingBox();
  if (!canvas) throw new Error("Canvas unavailable");
  const point = await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as WorldScene;
    const camera = scene.cameras.main;
    return {
      x: (scene.portalPosition.x - camera.scrollX) * camera.zoom + camera.x,
      y: (scene.portalPosition.y - 40 - camera.scrollY) * camera.zoom + camera.y,
      width: scene.scale.width,
      height: scene.scale.height,
    };
  });
  await page.mouse.click(
    canvas.x + (point.x * canvas.width) / point.width,
    canvas.y + (point.y * canvas.height) / point.height,
  );
}

test("an unlocked unfinished district has an active portal for return travel and arrivals use transit", async ({
  page,
}) => {
  const base = createGame("javascript", { kind: "girl", name: "Nova" }, new Date().toISOString());
  const state = {
    ...base,
    adventureId: "return-transit",
    position: portalArrivalPosition("variables"),
    areas: {
      ...base.areas,
      variables: {
        ...base.areas.variables,
        solved: loadArea(base.lang, "variables").tasks.map((task) => task.id),
        bossDefeated: true,
      },
    },
  };
  await page.goto("/");
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [state] })),
    { key: ADVENTURES_KEY, state },
  );
  await page.reload();
  await page.locator(".title-adventure-row").filter({ hasText: "Nova" }).click();
  await clickTransit(page);
  await expect(page.getByRole("heading", { name: "Your journey" })).toBeVisible();
  await expect(page.locator('.world-node[data-level-id="loops"]')).toBeDisabled();
  await page.locator('.world-node[data-level-id="conditions"]').click();
  await expect(page.locator(".location-name")).toHaveText("Logic Junction");
  const arrival = await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot") as WorldScene;
    const position = scene.getPosition();
    return {
      active: scene.portalActive,
      distance: Math.hypot(position.x - scene.portalPosition.x, position.y - scene.portalPosition.y),
    };
  });
  expect(arrival.active).toBe(true);
  expect(arrival.distance).toBeLessThan(115);
  await clickTransit(page);
  await expect(page.locator('.world-node[data-level-id="loops"]')).toBeDisabled();
  await page.locator('.world-node[data-level-id="variables"]').click();
  await expect(page.locator(".location-name")).toHaveText("Variable District");
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0],
  );
  expect(saved.areas.conditions.bossDefeated).toBe(false);
  expect(saved.areas.conditions.solved).toHaveLength(0);
  expect(
    Math.hypot(
      saved.position.x - portalArrivalPosition("variables").x,
      saved.position.y - portalArrivalPosition("variables").y,
    ),
  ).toBeLessThan(75);
});
