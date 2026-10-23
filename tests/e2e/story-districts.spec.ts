import { expect, test } from "@playwright/test";
import type Phaser from "phaser";
import { startAfterAbstractionCloud } from "./helpers/study-levels";

test.use({ reducedMotion: "reduce" });

test("all newly playable story districts have their own themed route and eight terminals", async ({ page }) => {
  const districts = [
    ["loops", "Loop Transit"],
    ["arrays", "Array Towers"],
    ["functions", "Function Labs"],
    ["objects", "Object Campus"],
    ["abstraction", "Abstraction Cloud"],
  ] as const;
  await startAfterAbstractionCloud(page, "javascript");
  const groundColors: number[] = [];

  for (const [areaId, name] of districts) {
    await expect(page.getByRole("button", { name: "World map", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "World map", exact: true }).click();
    await page.locator(".world-node").filter({ hasText: name }).click();
    await expect(page.locator(".location-name")).toHaveText(name);
    const district = await page.evaluate((areaId) => {
      const scene = (window as unknown as { __codequest: { game: Phaser.Game } }).__codequest.game.scene.getScene(
        "boot",
      );
      const ground = scene.children.getByName(`${areaId}-ground`) as Phaser.GameObjects.Rectangle;
      return {
        color: ground?.fillColor,
        taskMarkers: Array.from({ length: 8 }, (_, index) =>
          Boolean(scene.children.getByName(`${areaId}-${index + 1}`)),
        ),
      };
    }, areaId);
    expect(district.color).toEqual(expect.any(Number));
    expect(district.taskMarkers).toEqual(Array(8).fill(true));
    groundColors.push(district.color as number);
  }

  expect(new Set(groundColors).size).toBe(districts.length);
});
