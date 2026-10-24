import { expect, test } from "@playwright/test";
import { WORLD_LEVELS } from "../../src/content/world-levels";
import { SPRITES, TILESETS } from "../../src/game/assets";
import { openAdventureTool } from "./helpers/adventure-tools";

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

test("language colors are distinct and the first-run guide follows play", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator(".language-grid .choice")).toHaveCount(4);
  const accents = await page
    .locator(".language-grid .choice")
    .evaluateAll((cards) => cards.map((card) => getComputedStyle(card).getPropertyValue("--language-accent").trim()));
  expect(new Set(accents).size).toBe(4);
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await expect(page.locator(".field-guide-title")).toHaveText("1 / 3 · MOVE");
  await page.keyboard.down("d");
  try {
    await expect(page.locator(".field-guide-title")).toHaveText("2 / 3 · MEET YOUR COURIER", { timeout: 5000 });
  } finally {
    await page.keyboard.up("d");
  }
  await openAdventureTool(page, "Mission");
  await expect(page.locator(".field-guide-title")).toHaveText("3 / 3 · TRY A MISSION");
  await expect(page.locator(".courier-intro")).toContainText("Kai");
  await page.getByRole("button", { name: "Look around the city" }).click();
  await page.getByRole("button", { name: "Skip guide" }).click();
  await expect(page.locator(".field-guide")).toHaveCount(0);
  await openAdventureTool(page, "Progress");
  await expect(page.getByRole("heading", { name: "Your coding progress" })).toBeVisible();
  await expect(page.locator(".study-skill-track")).toHaveCount(16);
  await expect(page.locator(".study-skill-track").first()).toContainText("Operators");
  await expect(page.locator(".study-skill-track").first()).toContainText("0 / 8 tasks");
  await expect(page.locator(".study-skill-track").nth(1)).toContainText("Locked · defeat the boss in level 8.");
  await expect(page.locator(".skill-progress-summary")).toContainText("0 / 128 Study Path tasks");
  await expect(page.getByText("The city's network has gone dark.")).toBeVisible();
  await expect(page.locator(".skill-progress-summary")).toContainText(`0 / ${8 * WORLD_LEVELS.length} missions`);
  await expect(page.getByRole("progressbar", { name: "Variable District missions completed" })).toHaveAttribute(
    "aria-valuenow",
    "0",
  );
});

test("accessibility settings remap movement and persist on this device", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Accessibility & controls", exact: true }).click();
  await page.getByLabel("Movement keys", { exact: true }).selectOption("ijkl");
  await page.getByRole("button", { name: "Large text", exact: true }).click();
  await page.getByRole("button", { name: "High contrast", exact: true }).click();
  await expect(page.locator("#ui")).toHaveAttribute("data-large-text", "true");
  await expect(page.locator("#ui")).toHaveAttribute("data-high-contrast", "true");
  await page.keyboard.press("Escape");
  const before = await page.evaluate(() => {
    const scene = (
      window as unknown as { __codequest: { game: { scene: { getScene(key: string): unknown } } } }
    ).__codequest.game.scene.getScene("boot") as { getPosition(): { x: number; y: number } };
    return scene.getPosition();
  });
  await page.keyboard.down("k");
  await page.waitForTimeout(300);
  await page.keyboard.up("i");
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const scene = (
          window as unknown as { __codequest: { game: { scene: { getScene(key: string): unknown } } } }
        ).__codequest.game.scene.getScene("boot") as { getPosition(): { x: number; y: number } };
        return scene.getPosition().y;
      }),
    )
    .toBeGreaterThan(before.y + 15);
  await page.reload();
  await expect(page.locator("#ui")).toHaveAttribute("data-large-text", "true");
  await expect(page.locator("#ui")).toHaveAttribute("data-high-contrast", "true");
  await expect
    .poll(() =>
      page.evaluate(() => JSON.parse(localStorage.getItem("codequest:accessibility:v1") ?? "{}").controlScheme),
    )
    .toBe("ijkl");
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
  await page.locator(".title-adventure-row").first().click();
  await expectBoy();
});
