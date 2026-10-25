import { expect, test } from "@playwright/test";
import type Phaser from "phaser";
import { loadArea } from "../../src/content/loader";
import { DEFAULT_DESIGN } from "../../src/core/arcade-creation";
import { GATE_STEPS, newLesson } from "../../src/core/journey";
import { createGame } from "../../src/core/state";
import { openAdventureTool } from "./helpers/adventure-tools";

type Harness = { __codequest: { game: Phaser.Game } };
test.use({ reducedMotion: "reduce" });
test("earned services restore visible city objects, useful destinations and persistent NPC reactions", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const state = {
    ...createGame("javascript", { name: "Ada", kind: "girl" }, new Date().toISOString()),
    adventureId: "restorer",
    training: { districts: ["variables" as const] },
    journey: {
      gate: { ...newLesson(), status: "complete" as const, step: 4, completed: [...GATE_STEPS] },
      companion: { enabled: true, draft: "", trips: 1 },
      creations: [{ id: "mine", design: DEFAULT_DESIGN, best: 50, won: true }],
    },
  };
  await page.goto("/");
  await expect(page.locator(".language-grid .choice")).toHaveCount(4);
  await page.evaluate(
    (s) => localStorage.setItem("codequest:adventures:v1", JSON.stringify({ version: 1, adventures: [s] })),
    state,
  );
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await openAdventureTool(page, "Learning adventures");
  await page.getByRole("button", { name: "Open Restore the city", exact: true }).click();
  await expect(page.getByRole("button", { name: "Restore Data exchange", exact: true })).toBeDisabled();
  for (const name of ["Developer workshop", "City tram", "Data exchange"])
    await page.getByRole("button", { name: `Restore ${name}`, exact: true }).click();
  await expect(page.locator(".city-reaction")).toContainText("data exchange is alive");
  await page.getByRole("button", { name: "Enter workshop", exact: true }).click();
  await page.getByRole("button", { name: "Open developer studio", exact: true }).click();
  await expect(page.getByRole("tab", { name: "Projects", exact: true })).toHaveAttribute("aria-selected", "true");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  const art = await page.evaluate(() => {
    const s = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
    const ticket = s.children.getByName("tram-ticket-desk") as Phaser.GameObjects.Container;
    const workshop = s.children.getByName("restoration-workshop") as Phaser.GameObjects.Container;
    return {
      online: ticket.getData("service"),
      labels: workshop.list.filter((o) => o.type === "Text").map((o) => (o as Phaser.GameObjects.Text).text),
      network: !!s.children.getByName("restored-network-windows"),
      pods: s.children.list.filter((o) => o.name === "city-transit-pod").length,
    };
  });
  expect(art).toEqual({ online: "online", labels: ["WORKSHOP / OPEN"], network: true, pods: 0 });
  const target = await page.evaluate(() => {
    const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
    scene.cameras.main.stopFollow().centerOn(768, 432);
    const camera = scene.cameras.main;
    return { x: 409 - camera.scrollX, y: 235 - camera.scrollY, width: scene.scale.width, height: scene.scale.height };
  });
  const bounds = await page.locator("#game canvas").boundingBox();
  if (!bounds) throw new Error("Missing city canvas");
  await page.mouse.click(
    bounds.x + (target.x / target.width) * bounds.width,
    bounds.y + (target.y / target.height) * bounds.height,
  );
  await expect(page.getByRole("heading", { name: "Developer workshop", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.screenshot({ path: info.outputPath("restored-campus.png") });
  await openAdventureTool(page, "Mission");
  await expect(page.locator(".city-reaction")).toContainText("data exchange is alive");
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await openAdventureTool(page, "Learning adventures");
  await page.getByRole("button", { name: "Open Restore the city", exact: true }).click();
  await expect(page.locator(".restoration-panel [data-service] .feedback")).toHaveText([
    "Restored · remembered by this adventure",
    "Restored · remembered by this adventure",
    "Restored · remembered by this adventure",
  ]);
  await page.getByRole("button", { name: "Choose tram destination", exact: true }).click();
  await expect(page.locator(".world-node[data-level-id='conditions']")).toBeDisabled();
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0],
  );
  expect(saved.areas).toEqual(state.areas);
  expect(errors).toEqual([]);
});
test.describe("restored tram motion", () => {
  test.use({ reducedMotion: "no-preference" });
  test("the existing Loop Transit tram starts moving after delivery parts restore its service", async ({ page }) => {
    const base = createGame("javascript", { name: "Ada", kind: "girl" }, new Date().toISOString());
    const state = {
      ...base,
      currentArea: "loops" as const,
      adventureId: "tram-motion",
      training: { districts: ["loops" as const] },
      journey: { companion: { enabled: true, draft: "", trips: 1 } },
      areas: {
        ...base.areas,
        ...Object.fromEntries(
          ["variables", "conditions"].map((id) => [
            id,
            {
              ...base.areas[id as "variables" | "conditions"],
              solved: loadArea("javascript", id as "variables" | "conditions").tasks.map((t) => t.id),
              bossDefeated: true,
            },
          ]),
        ),
      },
    };
    await page.goto("/");
    await expect(page.locator(".language-grid .choice")).toHaveCount(4);
    await page.evaluate(
      (s) => localStorage.setItem("codequest:adventures:v1", JSON.stringify({ version: 1, adventures: [s] })),
      state,
    );
    await page.reload();
    await page.locator(".title-adventure-row").first().click();
    const pod = () =>
      page.evaluate(() => {
        const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot"),
          p = scene.children.getByName("city-transit-pod") as Phaser.GameObjects.Container;
        return { x: p.x, alpha: p.alpha, service: p.getData("service") };
      });
    expect(await pod()).toEqual({ x: 1040, alpha: 0.35, service: "offline" });
    await openAdventureTool(page, "Learning adventures");
    await page.getByRole("button", { name: "Open Restore the city", exact: true }).click();
    await page.getByRole("button", { name: "Restore City tram", exact: true }).click();
    await page.getByRole("button", { name: "Close panel", exact: true }).click();
    await expect.poll(async () => (await pod()).x, { timeout: 8000 }).not.toBe(1040);
    expect((await pod()).service).toBe("online");
    expect((await pod()).alpha).toBe(1);
  });
});
