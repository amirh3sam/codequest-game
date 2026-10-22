import { expect, test } from "@playwright/test";
import { SPRITES, TILESETS } from "../../src/game/assets";

test("game boots and shows the canvas", async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("#game canvas")).toBeVisible();
  await page.waitForFunction(() => {
    const w = window as unknown as { __codequest?: { game: { scene: { isActive(k: string): boolean } } } };
    return w.__codequest?.game.scene.isActive("boot") === true;
  });
  // Waiting for textures also covers real HTTP loading and spritesheet slicing.
  await page.waitForFunction(
    (keys) => {
      const w = window as unknown as {
        __codequest?: { game: { textures: { exists(key: string): boolean } } };
      };
      return keys.every((key) => w.__codequest?.game.textures.exists(key));
    },
    TILESETS.map((tileset) => tileset.key),
  );
  const frames = await page.evaluate((sprites) => {
    const w = window as unknown as {
      __codequest: {
        game: {
          textures: {
            get(key: string): { has(frame: number): boolean; get(frame: number): { width: number; height: number } };
          };
        };
      };
    };
    return Object.values(sprites).map(({ texture, frame }) => {
      const sheet = w.__codequest.game.textures.get(texture);
      const image = sheet.get(frame);
      return { exists: sheet.has(frame), width: image.width, height: image.height };
    });
  }, SPRITES);
  expect(frames).toEqual([
    { exists: true, width: 96, height: 112 },
    { exists: true, width: 96, height: 112 },
    { exists: true, width: 96, height: 112 },
    { exists: true, width: 18, height: 18 },
    { exists: true, width: 96, height: 112 },
  ]);
  await page.screenshot({ path: testInfo.outputPath("art-preview.png") });
  expect(errors).toEqual([]);
});

test("boy developer selection survives walking and reloading", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Boy hero", exact: true }).click();
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.down("d");
  await page.waitForTimeout(300);
  await page.keyboard.up("d");
  const expectBoy = async () =>
    expect
      .poll(() =>
        page.evaluate(() => {
          const game = (
            window as unknown as {
              __codequest: {
                game: {
                  scene: {
                    getScene(key: string): {
                      children: { list: { texture?: { key: string } }[] };
                    };
                  };
                };
              };
            }
          ).__codequest.game;
          return game.scene.getScene("boot").children.list.find((node) => node.texture?.key.startsWith("hero-"))
            ?.texture?.key;
        }),
      )
      .toBe("hero-boy");
  await expectBoy();
  await page.reload();
  await page.getByRole("button", { name: "Continue adventure", exact: true }).click();
  await expectBoy();
});
