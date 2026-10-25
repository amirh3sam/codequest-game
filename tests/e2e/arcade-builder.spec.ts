import { expect, test } from "@playwright/test";
import { arcadeBuilderFiles } from "../../src/content/arcade-builder";
import { DEFAULT_DESIGN, newGridRound } from "../../src/core/arcade-creation";
import { openAdventureTool } from "./helpers/adventure-tools";

test.use({ reducedMotion: "reduce" });
for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: multi-file arcade rules become a saved playable game`, async ({ page }, info) => {
    test.setTimeout(150000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.locator(`.language-grid [data-language="${lang}"]`).click();
    await page.getByRole("button", { name: "Start adventure", exact: true }).click();
    await openAdventureTool(page, "Tablet");
    await page.getByRole("tab", { name: "Projects", exact: true }).click();
    await page.getByRole("button", { name: "Start Arcade Builder", exact: true }).click();
    await page.getByRole("button", { name: "Open project files", exact: true }).click();
    const files = arcadeBuilderFiles(lang),
      rule = Object.keys(files).find((p) => /GameRules|game_rules/.test(p)) as string;
    await page.locator(`.studio-file[title='${rule}']`).click();
    await page.getByLabel(`Code editor: ${rule}`).fill(files[rule].replace("My Byte Run", "Byte Run"));
    // Running the rules file must execute this project's Main in every language.
    await page.getByRole("button", { name: "Run practice code", exact: true }).click();
    await expect(page.getByRole("button", { name: "Play my game", exact: true })).toBeVisible({ timeout: 60000 });
    await expect(page.getByLabel("Practice output", { exact: true })).toContainText('"name":"Byte Run"');
    await page.locator(`.studio-file[title='${rule}']`).click();
    await page
      .getByLabel(`Code editor: ${rule}`)
      .fill(files[rule].replace("My Byte Run", "Byte Run").replace("goal = 5", "goal = 8"));
    await expect(page.getByRole("button", { name: "Play my game", exact: true })).toBeHidden();
    await page.getByRole("button", { name: "Run practice code", exact: true }).click();
    await expect(page.getByRole("button", { name: "Play my game", exact: true })).toBeVisible({ timeout: 60000 });
    await expect(page.getByLabel("Practice output", { exact: true })).toContainText('"goal":8');
    await page.getByRole("button", { name: "Play my game", exact: true }).click();
    await page.getByRole("button", { name: "Save game & play", exact: true }).click();
    await expect(page.locator(".grid-game-canvas")).toBeVisible();
    if (lang === "javascript") {
      let r = newGridRound({ ...DEFAULT_DESIGN, name: "Byte Run", goal: 8 });
      while (r.items.length) {
        const target = r.items[0],
          q = [r.player],
          prev = new Map<number, number>();
        prev.set(r.player, -1);
        for (let i = 0; i < q.length && !prev.has(target); i++) {
          const p = q[i],
            x = p % 12,
            y = Math.floor(p / 12);
          for (const [a, b] of [
            [x - 1, y],
            [x + 1, y],
            [x, y - 1],
            [x, y + 1],
          ]) {
            const n = b * 12 + a;
            if (a >= 0 && a < 12 && b >= 0 && b < 8 && !r.walls.includes(n) && !prev.has(n)) {
              prev.set(n, p);
              q.push(n);
            }
          }
        }
        const path: number[] = [];
        for (let p = target; p !== r.player; p = prev.get(p) as number) path.unshift(p);
        for (const n of path) {
          const dx = (n % 12) - (r.player % 12),
            dy = Math.floor(n / 12) - Math.floor(r.player / 12);
          await page
            .getByRole("button", {
              name: dx === 1 ? "Right" : dx === -1 ? "Left" : dy === 1 ? "Down" : "Up",
              exact: true,
            })
            .click();
          r = { ...r, player: n, items: r.items.filter((v) => v !== n) };
        }
      }
      await expect(page.locator(".grid-game-status")).toContainText("You beat it!");
      await page.screenshot({ path: info.outputPath("custom-game-won.png") });
    }
    await page.getByRole("button", { name: "My arcade", exact: true }).click();
    await expect(page.getByRole("button", { name: "Play Byte Run", exact: true })).toBeVisible();
    await page.reload();
    await page.locator(".title-adventure-row").first().click();
    await openAdventureTool(page, "Learning adventures");
    await page.getByRole("button", { name: "Open Arcade Builder", exact: true }).click();
    await expect(page.getByRole("button", { name: "Play Byte Run", exact: true })).toBeVisible();
    const state = await page.evaluate(
      () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0],
    );
    expect(state.journey.creations[0].design.goal).toBe(8);
    if (lang === "javascript") expect(state.journey.creations[0].won).toBe(true);
    expect(state.areas.variables.solved).toEqual([]);
    expect(errors).toEqual([]);
  });
}
