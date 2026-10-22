import { expect, test } from "@playwright/test";

test("every developer walking frame has at most two complete shoes", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).waitFor();
  const poses = await page.evaluate(() => {
    const game = (
      window as unknown as {
        __codequest: {
          game: {
            textures: {
              get(key: string): { getSourceImage(): HTMLCanvasElement };
            };
          };
        };
      }
    ).__codequest.game;
    return ["boy", "girl"].flatMap((kind) => {
      const source = game.textures.get(`hero-walk-${kind}`).getSourceImage();
      const ctx = source.getContext("2d");
      if (!ctx) throw new Error("Missing walking artwork");
      return Array.from({ length: 24 }, (_, frame) => {
        const data = ctx.getImageData((frame % 6) * 96, Math.floor(frame / 6) * 112, 96, 112).data;
        const shoes = new Set<number>();
        for (let y = 85; y < 112; y++)
          for (let x = 0; x < 96; x++) {
            const i = (y * 96 + x) * 4;
            const r = data[i] ?? 0,
              g = data[i + 1] ?? 0,
              b = data[i + 2] ?? 0;
            if ((data[i + 3] ?? 0) > 150 && Math.min(r, g, b) > 110 && Math.max(r, g, b) - Math.min(r, g, b) < 65)
              shoes.add(y * 96 + x);
          }
        const sizes: number[] = [];
        while (shoes.size) {
          const first = shoes.values().next().value;
          if (first === undefined) break;
          const queue = [first];
          shoes.delete(first);
          for (let p = 0; p < queue.length; p++) {
            const current = queue[p] ?? 0,
              x = current % 96,
              y = Math.floor(current / 96);
            for (let dy = -1; dy <= 1; dy++)
              for (let dx = -1; dx <= 1; dx++) {
                if (x + dx < 0 || x + dx >= 96) continue;
                const next = (y + dy) * 96 + x + dx;
                if (shoes.delete(next)) queue.push(next);
              }
          }
          if (queue.length >= 6) sizes.push(queue.length);
        }
        return { kind, frame, shoes: sizes.length };
      });
    });
  });
  expect(poses.filter(({ shoes }) => shoes > 2)).toEqual([]);
  expect(poses.every(({ shoes }) => shoes >= 1)).toBe(true);
  expect(poses.filter(({ shoes }) => shoes === 2).length).toBeGreaterThan(24);
});
