import { expect, type Page, test } from "@playwright/test";

type Position = { x: number; y: number };
type GameWindow = Window & { __codequest: { game: { scene: { getScene(key: string): { getPosition(): Position } } } } };

async function characterPosition(page: Page): Promise<Position> {
  return page.evaluate(() => (window as unknown as GameWindow).__codequest.game.scene.getScene("boot").getPosition());
}

test("left and right mouse drags steer the developer through the map", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  const canvas = page.locator("#game canvas");
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Game canvas is unavailable");
  const pointer = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const beforeLeft = await characterPosition(page);
  await page.mouse.move(pointer.x, pointer.y);
  await page.mouse.down();
  await page.mouse.move(pointer.x - 90, pointer.y, { steps: 8 });
  await page.waitForTimeout(450);
  await page.mouse.up();
  const afterLeft = await characterPosition(page);
  expect(afterLeft.x).toBeLessThan(beforeLeft.x - 20);

  await page.mouse.move(pointer.x - 90, pointer.y);
  await page.mouse.down();
  await page.mouse.move(pointer.x + 10, pointer.y, { steps: 8 });
  await page.waitForTimeout(450);
  await page.mouse.up();
  const afterRight = await characterPosition(page);
  expect(afterRight.x).toBeGreaterThan(afterLeft.x + 20);
});
