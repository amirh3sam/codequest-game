import { expect, test } from "@playwright/test";
import type Phaser from "phaser";
import { loadVariables } from "../../src/content/loader";

test("two players opening the same link retain separate characters, missions and tablet drafts", async ({
  browser,
}) => {
  test.setTimeout(90_000);
  const alpha = await browser.newContext({ reducedMotion: "reduce" }),
    beta = await browser.newContext({ reducedMotion: "reduce" });
  try {
    const first = await alpha.newPage(),
      second = await beta.newPage();
    for (const [page, name, hero] of [
      [first, "Nova", "Boy hero"],
      [second, "Luna", "Girl hero"],
    ] as const) {
      await page.goto("/");
      await page.getByRole("button", { name: hero, exact: true }).click();
      await page.getByRole("textbox", { name: "Developer name", exact: true }).fill(name);
      await page.getByRole("button", { name: "Start adventure", exact: true }).click();
      await page.evaluate(() =>
        (window as unknown as { __codequest: { game: Phaser.Game } }).__codequest.game.loop.sleep(),
      );
    }
    await first.getByRole("button", { name: "Progress", exact: true }).click();
    await first.getByRole("button", { name: /1\. Set your display name/ }).click();
    await first.getByLabel("Your code", { exact: true }).fill(loadVariables("javascript").tasks[0]?.solution ?? "");
    await first.getByRole("button", { name: "Submit answer", exact: true }).click();
    await expect(first.locator(".feedback")).toContainText("Correct!");
    await first.getByRole("button", { name: "Back to district", exact: true }).click();
    for (const [page, draft] of [
      [first, 'console.log("Nova");'],
      [second, 'console.log("Luna");'],
    ] as const) {
      await page.keyboard.press("t");
      await page.getByLabel("Practice code", { exact: true }).fill(draft);
      await page.reload();
      await page.locator(".title-adventure-row").first().click();
      await page.keyboard.press("t");
      await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue(draft);
    }
    await expect(first.locator(".hero-name")).toHaveText("Nova");
    await expect(second.locator(".hero-name")).toHaveText("Luna");
    await expect(first.getByTestId("gems")).toContainText("1");
    await expect(second.getByTestId("gems")).toContainText("0");
    const read = () => JSON.parse(localStorage.getItem("codequest:v1:javascript") ?? "{}");
    const one = await first.evaluate(read),
      two = await second.evaluate(read);
    expect(one.hero.kind).toBe("boy");
    expect(two.hero.kind).toBe("girl");
    expect(one.areas.variables.solved).toEqual(["variables-1"]);
    expect(two.areas.variables.solved).toEqual([]);
  } finally {
    await alpha.close();
    await beta.close();
  }
});
