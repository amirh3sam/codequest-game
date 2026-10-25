import { expect, test } from "@playwright/test";
import type Phaser from "phaser";
import { openAdventureTool } from "./helpers/adventure-tools";

type Harness = { __codequest: { game: Phaser.Game } };
test.use({ reducedMotion: "reduce" });
for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: real loops and lists produce a persistent city delivery route`, async ({ page }, info) => {
    test.setTimeout(120000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.locator(`.language-grid [data-language="${lang}"]`).click();
    await page.getByRole("button", { name: "Start adventure", exact: true }).click();
    await openAdventureTool(page, "Learning adventures");
    await page.getByRole("button", { name: "Open Robot companion", exact: true }).click();
    const run = async () => {
      const b = page.getByRole("button", { name: "Test delivery program", exact: true });
      await b.click();
      await expect(b).toBeEnabled({ timeout: 60000 });
    };
    await run();
    await expect(page.getByLabel("Delivery output"), await page.locator(".feedback").innerText()).toContainText(
      "1\n2\n3",
    );
    await page.getByRole("button", { name: "Load delivery list", exact: true }).click();
    await expect(page.getByRole("button", { name: "Deploy route in city", exact: true })).toBeDisabled();
    await run();
    await expect(page.getByLabel("Delivery output")).toContainText("2\n1\n3");
    await page.getByRole("button", { name: "Deploy route in city", exact: true }).click();
    if (lang === "javascript") {
      // Observe ordinary scene frames, with its actual collisions, rather than simulating arrival callbacks.
      await expect
        .poll(
          () =>
            page.evaluate(
              () =>
                JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0].journey.companion
                  .trips,
            ),
          { timeout: 45000 },
        )
        .toBe(1);
      const root = await page.evaluate(() => {
        const scene = (window as unknown as Harness).__codequest.game.scene.getScene("boot");
        const robot = scene.children.getByName("robot-companion") as Phaser.GameObjects.Container;
        return { visible: robot.visible, next: robot.getData("delivery-next") };
      });
      expect(root).toEqual({ visible: true, next: 3 });
      await page.screenshot({ path: info.outputPath("city-companion.png") });
    }
    await page.reload();
    await page.locator(".title-adventure-row").first().click();
    await openAdventureTool(page, "Learning adventures");
    await page.getByRole("button", { name: "Open Robot companion", exact: true }).click();
    await expect(page.getByLabel("Delivery program")).toHaveValue(/deliveries/);
    const state = await page.evaluate(
      () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0],
    );
    expect(state.journey.companion.trip.stops).toEqual([2, 1, 3]);
    expect(state.areas.variables.solved).toEqual([]);
    const invalid = {
      javascript: "const = ;",
      typescript: "const = ;",
      python: "def broken(:",
      java: "public class Main { public static void main(String[] args) { int = ; } }",
    };
    await page.getByLabel("Delivery program").fill(invalid[lang]);
    await run();
    await expect(page.getByLabel("Delivery output")).toContainText(/unexpected|expected|syntax|error|illegal/i);
    await expect(page.getByRole("button", { name: "Deploy route in city", exact: true })).toBeDisabled();
    expect(errors).toEqual([]);
  });
}
