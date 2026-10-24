import { expect, type Page, test } from "@playwright/test";

type Position = { x: number; y: number };
type GameWindow = Window & {
  __codequest: {
    game: {
      scene: {
        getScene(key: string): {
          getPosition(): Position;
          children: { list: { texture?: { key: string }; frame?: { name: string | number } }[] };
        };
      };
    };
  };
};

async function characterPosition(page: Page): Promise<Position> {
  return page.evaluate(() => (window as unknown as GameWindow).__codequest.game.scene.getScene("boot").getPosition());
}

test("mouse drags steer the developer cleanly in all four directions", async ({ page }, testInfo) => {
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

  const beforeDown = await characterPosition(page);
  await page.mouse.move(pointer.x, pointer.y);
  await page.mouse.down();
  await page.mouse.move(pointer.x, pointer.y + 90, { steps: 8 });
  await page.waitForTimeout(450);
  const afterDown = await characterPosition(page);
  expect(afterDown.y).toBeGreaterThan(beforeDown.y + 20);
  await page.screenshot({ path: testInfo.outputPath("mouse-down-walk.png") });
  const downHero = await page.evaluate(() => {
    const scene = (window as unknown as GameWindow).__codequest.game.scene.getScene("boot");
    const hero = scene.children.list.find((node) => (node as { name?: string }).name === "player-hero");
    return {
      count: scene.children.list.filter((node) => (node as { name?: string }).name === "player-hero").length,
      row: Math.floor(Number(hero?.frame?.name) / (hero?.texture?.key.includes("walk") ? 6 : 4)),
    };
  });
  expect(downHero).toEqual({ count: 1, row: 0 });
  await page.mouse.up();

  const beforeUp = await characterPosition(page);
  await page.mouse.move(pointer.x, pointer.y + 90);
  await page.mouse.down();
  await page.mouse.move(pointer.x, pointer.y - 10, { steps: 8 });
  await page.waitForTimeout(450);
  const afterUp = await characterPosition(page);
  expect(afterUp.y).toBeLessThan(beforeUp.y - 20);
  await page.screenshot({ path: testInfo.outputPath("mouse-up-walk.png") });
  const facingRows = await page.evaluate(() => {
    const scene = (window as unknown as GameWindow).__codequest.game.scene.getScene("boot");
    const hero = scene.children.list.find((node) => (node as { name?: string }).name === "player-hero");
    return {
      count: scene.children.list.filter((node) => (node as { name?: string }).name === "player-hero").length,
      texture: hero?.texture?.key,
      row: Math.floor(Number(hero?.frame?.name) / (hero?.texture?.key?.includes("walk") ? 6 : 4)),
    };
  });
  expect(facingRows).toMatchObject({ count: 1, row: 3 });
  await page.mouse.up();
});
