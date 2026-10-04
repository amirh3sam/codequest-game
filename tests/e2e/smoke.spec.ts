import { expect, test } from "@playwright/test";

test("game boots and shows the canvas", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("#game canvas")).toBeVisible();
  await page.waitForFunction(() => {
    const w = window as unknown as { __codequest?: { game: { scene: { isActive(k: string): boolean } } } };
    return w.__codequest?.game.scene.isActive("boot") === true;
  });
  expect(errors).toEqual([]);
});
