import { expect, test } from "@playwright/test";
import { chargeInstruction } from "../../src/content/first-program";
import { openAdventureTool } from "./helpers/adventure-tools";
import { beginnerState, seedBeginner } from "./helpers/beginner";

test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "reduce" });
test.setTimeout(150_000);
for (const lang of ["javascript", "java"] as const) {
  test(`${lang}: phone learners can code, see their robot and finish after rotation`, async ({ page }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await seedBeginner(page, lang);
    await page.getByLabel("Beginner code", { exact: true }).fill(chargeInstruction(lang, 7));
    const run = page.getByRole("button", { name: "Test my rescue code", exact: true });
    await run.tap();
    await expect(run).toBeEnabled({ timeout: 60_000 });
    await expect(page.locator(".zero-feedback")).toContainText("Rescue successful");
    expect(await page.locator(".zero-shell").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(true);
    await expect(page.locator(".zero-scene")).toBeInViewport();
    const label = await page.locator(".zero-clinic small").boundingBox();
    const antenna = await page.locator(".zero-antenna").boundingBox();
    expect(label && antenna && label.y + label.height <= antenna.y - 4).toBe(true);
    await page.screenshot({ path: info.outputPath(`beginner-phone-${lang}.png`) });
    await page.getByRole("button", { name: "Next lesson →", exact: true }).tap();
    await page.setViewportSize({ width: 844, height: 390 });
    await page.getByRole("button", { name: "6 cells", exact: true }).tap();
    const example = page.getByRole("button", { name: "Run working example", exact: true });
    await example.tap();
    await expect(example).toBeEnabled({ timeout: 60_000 });
    await expect(page.locator(".zero-achievement")).toBeVisible();
    await page.getByRole("button", { name: "Explore the city", exact: true }).tap();
    await page.getByRole("button", { name: "Open game menu", exact: true }).tap();
    await openAdventureTool(page, "Start from zero");
    await expect(page.locator(".zero-achievement")).toBeVisible();
    expect((await beginnerState(page)).beginner?.status).toBe("complete");
    expect(errors).toEqual([]);
  });
}
