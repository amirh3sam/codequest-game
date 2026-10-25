import { expect, type Page, test } from "@playwright/test";
import type Phaser from "phaser";
import { DEFAULT_DESIGN } from "../../src/core/arcade-creation";
import { BEGINNER_STEPS, createBeginnerProgress } from "../../src/core/beginner";
import { GATE_STEPS, newLesson } from "../../src/core/journey";
import { createGame } from "../../src/core/state";
import { openAdventureTool } from "./helpers/adventure-tools";

type Harness = { __codequest: { game: Phaser.Game } };
declare const Buffer: { from(source: string): Uint8Array };
test.use({ reducedMotion: "reduce" });
async function seed(page: Page, kind: "boy" | "girl") {
  const state = {
    ...createGame("javascript", { name: "Ada", kind }, new Date().toISOString()),
    adventureId: "room-owner",
    training: { districts: ["variables" as const] },
    beginner: {
      ...createBeginnerProgress(),
      status: "complete" as const,
      step: 6,
      completed: [...BEGINNER_STEPS],
      robotName: "Nova",
    },
    journey: {
      gate: { ...newLesson(), status: "complete" as const, step: 4, completed: [...GATE_STEPS] },
      companion: { enabled: true, draft: "", trips: 1 },
      creations: [{ id: "mine", design: DEFAULT_DESIGN, best: 50, won: true }],
      restored: ["workshop", "tram", "network"] as ("workshop" | "tram" | "network")[],
      reviews: { variables: { misses: 0, wins: 3, variant: 0 } },
    },
  };
  const other = {
    ...createGame("python", { name: "Kai", kind: "boy" }, new Date().toISOString()),
    adventureId: "room-other",
  };
  await page.goto("/");
  await expect(page.locator(".language-grid .choice")).toHaveCount(4);
  await page.evaluate(
    (s) => localStorage.setItem("codequest:adventures:v1", JSON.stringify({ version: 1, adventures: s })),
    [state, other],
  );
  await page.reload();
  await page.locator(".title-adventure-row").filter({ hasText: "Ada's" }).click();
  return { state, other };
}
async function room(page: Page) {
  await openAdventureTool(page, "Learning adventures");
  await page.getByRole("button", { name: "Open 7 · My developer room", exact: true }).click();
}
for (const kind of ["boy", "girl"] as const) {
  test(`${kind}: earned room choices change city clothing and robot parts and survive reload`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const { other } = await seed(page, kind);
    await room(page);
    await expect(page.getByRole("button", { name: "Wear amber hoodie", exact: true })).toBeEnabled();
    await page.getByRole("button", { name: "Wear amber hoodie", exact: true }).click();
    await page.getByRole("button", { name: "Use gold shell", exact: true }).click();
    await page.getByRole("button", { name: "Satellite antenna", exact: true }).click();
    await page.getByRole("button", { name: "Wall plum", exact: true }).click();
    for (const name of ["Workshop plant", "Transit desk lamp", "Review trophy"])
      await page.getByRole("button", { name: `Add ${name}`, exact: true }).click();
    await expect(page.locator(".room-plant")).toBeVisible();
    await expect(page.locator(".room-lamp")).toBeVisible();
    await expect(page.locator(".room-trophy")).toBeVisible();
    await page.locator(".developer-room-scene").scrollIntoViewIfNeeded();
    await page.screenshot({ path: info.outputPath(`developer-room-${kind}.png`) });
    await page.getByRole("button", { name: "Close panel", exact: true }).click();
    const view = await page.evaluate((kind) => {
      const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot"),
        hero = scene.children.getByName("player-hero") as Phaser.GameObjects.Image,
        robot = scene.children.getByName("robot-companion") as Phaser.GameObjects.Container;
      const read = (key: string) => {
        const src = scene.textures.get(key).getSourceImage() as HTMLCanvasElement,
          c = document.createElement("canvas");
        c.width = src.width;
        c.height = src.height;
        const ctx = c.getContext("2d");
        if (!ctx) throw new Error("Missing image canvas");
        ctx.drawImage(src, 0, 0);
        return ctx.getImageData(0, 0, c.width, c.height).data;
      };
      const original = read(`hero-${kind}`),
        changed = read(`hero-${kind}-hoodie-amber`);
      let different = 0,
        faceChanged = 0;
      for (let y = 0; y < 112; y++)
        for (let x = 0; x < 96; x++) {
          const i = (y * 384 + x) * 4;
          if (original[i] !== changed[i] || original[i + 1] !== changed[i + 1] || original[i + 2] !== changed[i + 2]) {
            different++;
            if (y < 32) faceChanged++;
          }
        }
      return { texture: hero.texture.key, robot: robot.getData("appearance"), different, faceChanged };
    }, kind);
    expect(view.texture).toBe(`hero-${kind}-hoodie-amber`);
    expect(view.robot).toBe("gold:dish");
    expect(view.different).toBeGreaterThan(30);
    expect(view.faceChanged).toBe(0);
    await page.reload();
    await page.locator(".title-adventure-row").filter({ hasText: "Ada's" }).click();
    await room(page);
    await expect(page.getByRole("button", { name: "Wear amber hoodie", exact: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(page.locator(".developer-room-scene")).toHaveAttribute("data-wall", "plum");
    await page.getByRole("button", { name: "Close panel", exact: true }).click();
    await openAdventureTool(page, "Learning adventures");
    await page.getByRole("button", { name: "Open 4 · Arcade Builder", exact: true }).click();
    page.once("dialog", (d) => d.accept());
    await page.getByRole("button", { name: "Delete My Byte Run", exact: true }).click();
    await room(page);
    await expect(page.getByRole("button", { name: "Use rose shell", exact: true })).toBeEnabled();
    const entries = await page.evaluate(
      () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures,
    );
    expect(entries.find((s: { adventureId: string }) => s.adventureId === "room-other")).toEqual(other);
    expect(errors).toEqual([]);
  });
}
test("new players see clear reward requirements and can personalize their free room wall", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await room(page);
  await expect(page.getByRole("button", { name: "Wear amber hoodie", exact: true })).toBeDisabled();
  await expect(page.getByText("Complete The Smart Gate.", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Wall forest", exact: true }).click();
  await expect(page.locator(".developer-room-scene")).toHaveAttribute("data-wall", "forest");
});
test.describe("earned walking appearance", () => {
  test.use({ reducedMotion: "no-preference" });
  for (const kind of ["boy", "girl"] as const)
    test(`${kind}: colored hoodies retain all four walking directions`, async ({ page }) => {
      await seed(page, kind);
      await room(page);
      await page.getByRole("button", { name: "Wear amber hoodie", exact: true }).click();
      await page.getByRole("button", { name: "Close panel", exact: true }).click();
      const pose = () =>
        page.evaluate(() => {
          const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot"),
            hero = scene.children.getByName("player-hero") as Phaser.GameObjects.Image;
          return { texture: hero.texture.key, frame: Number(hero.frame.name) };
        });
      for (const [key, row] of [
        ["w", 3],
        ["s", 0],
        ["a", 1],
        ["d", 2],
      ] as const) {
        await page.keyboard.down(key);
        await expect.poll(async () => (await pose()).texture).toBe(`hero-walk-${kind}-hoodie-amber`);
        const p = await pose();
        expect(p.frame).toBeGreaterThanOrEqual(row * 6);
        expect(p.frame).toBeLessThan(row * 6 + 6);
        await page.keyboard.up(key);
        await expect.poll(async () => (await pose()).texture).toBe(`hero-${kind}-hoodie-amber`);
      }
    });
});
test("journey lifecycle: disk backup restores every feature and rename restart and delete stay scoped", async ({
  page,
}) => {
  test.setTimeout(120000);
  const { other } = await seed(page, "girl");
  await room(page);
  await page.getByRole("button", { name: "Wear amber hoodie", exact: true }).click();
  await page.getByRole("button", { name: "Wall plum", exact: true }).click();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.evaluate(() => {
    const original = URL.createObjectURL;
    URL.createObjectURL = (blob) => {
      (window as unknown as { __journeyBackup: Promise<string> }).__journeyBackup = (blob as Blob).text();
      return original(blob);
    };
  });
  await openAdventureTool(page, "Menu");
  // Capture the actual downloaded Blob before its object URL is revoked.
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Save backup file", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("Ada");
  const source = await page.evaluate(() => (window as unknown as { __journeyBackup: Promise<string> }).__journeyBackup);
  const backup = JSON.parse(source);
  expect(backup.state.journey.room.hoodie).toBe("amber");
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "Load backup file", exact: true }).click();
  await (await chooser).setFiles({
    name: "my-codequest-adventure.json",
    mimeType: "application/json",
    buffer: Buffer.from(source),
  });
  await expect(page.locator(".overlay")).toBeHidden();
  await room(page);
  await expect(page.getByRole("button", { name: "Wear amber hoodie", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  const library = () =>
    page.evaluate(() => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures);
  const imported = (await library()).find(
    (s: { adventureId: string }) => !["room-owner", "room-other"].includes(s.adventureId),
  );
  expect(imported.journey).toEqual(backup.state.journey);
  await openAdventureTool(page, "Manage character");
  await page.getByLabel("Character name", { exact: true }).fill("Ada2");
  await page.getByRole("button", { name: "Save name", exact: true }).click();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await room(page);
  await expect(page.locator(".room-name")).toContainText("Ada2's");
  await openAdventureTool(page, "Manage character");
  await page.getByRole("button", { name: "Restart this adventure", exact: true }).click();
  await page.getByLabel("Type RESTART to confirm", { exact: true }).fill("RESTART");
  await page.getByRole("button", { name: "Restart permanently", exact: true }).click();
  const after = await library(),
    fresh = after.find((s: { adventureId: string }) => !["room-owner", "room-other"].includes(s.adventureId));
  expect(fresh.journey).toBeUndefined();
  expect(fresh.hero.name).toBe("Ada2");
  expect(after.find((s: { adventureId: string }) => s.adventureId === "room-owner").journey).toEqual(
    backup.state.journey,
  );
  expect(after.find((s: { adventureId: string }) => s.adventureId === "room-other")).toEqual(other);
  await openAdventureTool(page, "Manage character");
  await page.getByRole("button", { name: "Delete this character", exact: true }).click();
  await page.getByLabel("Type DELETE to confirm", { exact: true }).fill("DELETE");
  await page.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await page.reload();
  await expect(page.locator(".title-adventure-row")).toHaveCount(2);
  expect((await library()).some((s: { adventureId: string }) => s.adventureId === fresh.adventureId)).toBe(false);
});
