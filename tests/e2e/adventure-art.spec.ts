import { expect, type Page, test } from "@playwright/test";
import content from "../../src/content/data/javascript/01-variables.json" with { type: "json" };
import village from "../../src/content/village.json" with { type: "json" };

type World = {
  getPosition(): { x: number; y: number };
  children: { list: { texture?: { key: string }; frame?: { name: string | number } }[] };
};

async function walk(page: Page, key: string, axis: "x" | "y", target: number, facingRow: number): Promise<void> {
  await page.keyboard.down(key);
  await page.waitForFunction(
    ({ axis, target, key }) => {
      const world = (
        window as unknown as { __codequest: { game: { scene: { getScene(key: string): World } } } }
      ).__codequest.game.scene.getScene("boot");
      const position = world.getPosition()[axis];
      return key === "a" || key === "w" ? position <= target : position >= target;
    },
    { axis, target, key },
  );
  await page.keyboard.up(key);
  await page.waitForFunction((facingRow) => {
    const world = (
      window as unknown as { __codequest: { game: { scene: { getScene(key: string): World } } } }
    ).__codequest.game.scene.getScene("boot");
    const hero = world.children.list.find((node) => node.texture?.key.startsWith("hero-"));
    return Number(hero?.frame?.name) === facingRow * 4;
  }, facingRow);
}

test("hoodie developer turns in four directions and reaches every coding terminal in the city", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await walk(page, "d", "x", village.spawn.x + 32, 2);
  await walk(page, "w", "y", village.spawn.y - 24, 3);
  await walk(page, "a", "x", village.spawn.x, 1);
  await walk(page, "s", "y", village.spawn.y, 0);
  await page.screenshot({ path: testInfo.outputPath("tech-city-developer.png") });
  for (const [index, task] of content.tasks.entries()) {
    const spot = village.tasks[index];
    if (!spot) throw new Error("Missing chest location");
    if (index === 0) {
      await walk(page, "w", "y", spot.y - 40, 3);
      await walk(page, "d", "x", spot.x + 64, 2);
      await walk(page, "s", "y", spot.y + 30, 0);
      await walk(page, "a", "x", spot.x, 1);
    } else if (index === 4) {
      await walk(page, "d", "x", spot.x + 64, 2);
      await walk(page, "w", "y", spot.y + 30, 3);
      await walk(page, "a", "x", spot.x, 1);
    } else await walk(page, "d", "x", spot.x, 2);
    await page.keyboard.press("e");
    await expect(page.getByLabel("Your code")).toBeVisible();
    await page.getByLabel("Your code").fill(task.solution);
    await page.getByRole("button", { name: "Submit answer", exact: true }).click();
    await expect(page.locator(".feedback")).toContainText("Correct!");
    await page.getByRole("button", { name: "Back to district", exact: true }).click();
  }
  await expect(page.getByRole("progressbar", { name: "District tasks completed" })).toHaveAttribute(
    "aria-valuenow",
    "8",
  );
  await walk(page, "d", "x", village.boss.x, 2);
  await walk(page, "w", "y", village.boss.y + 30, 3);
  await page.keyboard.press("e");
  await expect(page.getByRole("heading", { name: "Restore the data hub", exact: true })).toBeVisible();
  await page.getByLabel("Repair code").fill("let power = 5;\npower += 3;\npower -= 2;\nconsole.log(power);");
  await page.getByRole("button", { name: "Run repair preview", exact: true }).click();
  await expect(page.locator(".hub-finale .feedback")).toContainText("Preview passed");
  await page.getByRole("button", { name: "Restore power", exact: true }).click();
  await page
    .getByLabel("Repair code")
    .fill('const operatorName = "Ada";\nconst signal = "Ready, " + operatorName + "!";\nconsole.log(signal);');
  await page.getByRole("button", { name: "Run repair preview", exact: true }).click();
  await expect(page.locator(".hub-finale .feedback")).toContainText("Preview passed");
  await page.getByRole("button", { name: "Connect operator signal", exact: true }).click();
  await page.getByRole("button", { name: "Open final repair", exact: true }).click();
  await expect(page.getByRole("heading", { name: "The Firewall", exact: true })).toBeVisible();
  await page.getByLabel("Your code").fill(content.boss.solution);
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Variable District is online!" })).toBeVisible();
  expect(errors).toEqual([]);
});
