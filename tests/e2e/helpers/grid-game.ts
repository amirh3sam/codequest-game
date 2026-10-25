import type { Page } from "@playwright/test";
import { type GameDesign, newGridRound } from "../../../src/core/arcade-creation";
export async function collectGridGems(page: Page, design: GameDesign): Promise<void> {
  let r = newGridRound(design);
  while (r.items.length) {
    const target = r.items[0],
      queue = [r.player],
      previous = new Map([[r.player, -1]]);
    for (let i = 0; i < queue.length && !previous.has(target); i++) {
      const p = queue[i],
        x = p % 12,
        y = Math.floor(p / 12);
      for (const [a, b] of [
        [x - 1, y],
        [x + 1, y],
        [x, y - 1],
        [x, y + 1],
      ]) {
        const n = b * 12 + a;
        if (a >= 0 && a < 12 && b >= 0 && b < 8 && !r.walls.includes(n) && !previous.has(n)) {
          previous.set(n, p);
          queue.push(n);
        }
      }
    }
    if (!previous.has(target)) throw new Error("Unreachable gem in test level");
    const path: number[] = [];
    for (let p = target; p !== r.player; p = previous.get(p) as number) path.unshift(p);
    for (const n of path) {
      const dx = (n % 12) - (r.player % 12),
        dy = Math.floor(n / 12) - Math.floor(r.player / 12);
      await page
        .getByRole("button", { name: dx === 1 ? "Right" : dx === -1 ? "Left" : dy === 1 ? "Down" : "Up", exact: true })
        .click();
      r = { ...r, player: n, items: r.items.filter((v) => v !== n) };
    }
  }
}
