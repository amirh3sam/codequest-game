import { expect, type Page, test } from "@playwright/test";
import village from "../../src/content/village.json" with { type: "json" };

type World = {
  getPosition(): { x: number; y: number };
  children: {
    list: {
      name: string;
      depth: number;
      texture?: { key: string };
      list?: { name: string; y: number; parentContainer: unknown }[];
    }[];
  };
};
async function position(page: Page): Promise<{ x: number; y: number }> {
  return page.evaluate(() =>
    (window as unknown as { __codequest: { game: { scene: { getScene(k: string): World } } } }).__codequest.game.scene
      .getScene("boot")
      .getPosition(),
  );
}
async function walk(page: Page, key: string, axis: "x" | "y", target: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForFunction(
    ({ key, axis, target }) => {
      const p = (
        window as unknown as { __codequest: { game: { scene: { getScene(k: string): World } } } }
      ).__codequest.game.scene
        .getScene("boot")
        .getPosition();
      return key === "w" || key === "a" ? p[axis] <= target : p[axis] >= target;
    },
    { key, axis, target },
  );
  await page.keyboard.up(key);
}
async function start(page: Page): Promise<void> {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
}

test("coding terminals stop the developer, carry their number, and can be walked around", async ({ page }) => {
  await start(page);
  const chest = village.tasks[0];
  if (!chest) throw new Error("Missing chest");
  await walk(page, "s", "y", chest.y + 30);
  await walk(page, "d", "x", chest.x);
  await page.keyboard.down("w");
  await page.waitForTimeout(900);
  await page.keyboard.up("w");
  const stopped = await position(page);
  expect(stopped.y).toBeGreaterThanOrEqual(chest.y + 9);
  await page.keyboard.down("w");
  await page.waitForTimeout(300);
  await page.keyboard.up("w");
  expect((await position(page)).y).toBeCloseTo(stopped.y);
  await expect
    .poll(() =>
      page.evaluate(() => {
        const s = (
          window as unknown as { __codequest: { game: { scene: { getScene(k: string): World } } } }
        ).__codequest.game.scene.getScene("boot");
        const hero = s.children.list.find((n) => n.texture?.key.startsWith("hero-"));
        const chest = s.children.list.find((n) => n.name === "variables-1"),
          label = chest?.list?.find((n) => n.name === "task-number");
        return {
          idle: hero?.texture?.key === "hero-girl",
          attached: label?.parentContainer === chest,
          onFront: (label?.y ?? 1) < 0,
        };
      }),
    )
    .toEqual({ idle: true, attached: true, onFront: true });
  await walk(page, "a", "x", chest.x - 70);
  await walk(page, "w", "y", chest.y - 50);
  expect((await position(page)).y).toBeLessThan(chest.y);
});

test("tree trunks are solid while their transparent canopies correctly cover the hero", async ({ page }, testInfo) => {
  await start(page);
  const tree = village.trees[6];
  if (!tree) throw new Error("Missing tree");
  await walk(page, "w", "y", tree.y - 59);
  await walk(page, "d", "x", tree.x);
  await walk(page, "s", "y", tree.y - 40);
  await page.screenshot({ path: testInfo.outputPath("behind-tree.png") });
  await page.keyboard.down("s");
  await page.waitForTimeout(800);
  await page.keyboard.up("s");
  expect((await position(page)).y).toBeLessThanOrEqual(tree.y - 18);
  const layered = await page.evaluate(() => {
    const s = (
      window as unknown as {
        __codequest: {
          game: {
            scene: { getScene(k: string): World };
            textures: { get(k: string): { getSourceImage(): HTMLCanvasElement } };
          };
        };
      }
    ).__codequest.game.scene.getScene("boot");
    const hero = s.children.list.find((n) => n.texture?.key.startsWith("hero-")),
      tree = s.children.list.find((n) => n.name === "fir-6");
    const game = (
      window as unknown as {
        __codequest: { game: { textures: { get(k: string): { getSourceImage(): HTMLCanvasElement } } } };
      }
    ).__codequest.game;
    const image = game.textures.get("environment-fir").getSourceImage(),
      data = image.getContext("2d")?.getImageData(0, 0, image.width, image.height).data;
    let clear = 0,
      opaque = 0;
    if (data)
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] === 0) clear++;
        else if ((data[i] ?? 0) > 200) opaque++;
      }
    return { behind: (hero?.depth ?? 0) < (tree?.depth ?? 0), clear, opaque };
  });
  expect(layered.behind).toBe(true);
  expect(layered.clear).toBeGreaterThan(100);
  expect(layered.opaque).toBeGreaterThan(100);
  await walk(page, "d", "x", tree.x + 58);
  await walk(page, "s", "y", tree.y + 30);
  await walk(page, "d", "x", tree.x + 80);
  expect((await position(page)).x).toBeGreaterThan(tree.x);
});
