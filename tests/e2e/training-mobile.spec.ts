import { expect, test } from "@playwright/test";
import { openAdventureTool } from "./helpers/adventure-tools";

test.use({
  storageState: { cookies: [], origins: [] },
  reducedMotion: "reduce",
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
});
test("portrait and landscape have reachable training and mobile replay controls", async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).tap();
  await openAdventureTool(page, "Training");
  await expect(page.locator(".training-shell")).toBeVisible();
  // Orientation changes are simulated here; fullscreen itself is covered by mobile-layout.
  await page.evaluate(() =>
    Object.defineProperty(document.documentElement, "requestFullscreen", { value: async () => {} }),
  );
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    const details = page.locator(".training-contents");
    if (!(await details.evaluate((node) => (node as HTMLDetailsElement).open))) await details.locator("summary").tap();
    await page.locator(".training-chapter").filter({ hasText: "Run first. Submit when ready." }).tap();
    await expect(page.getByLabel("Training code", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Run training code", exact: true }).tap();
    await expect(page.getByLabel("Training output", { exact: true })).toHaveText("Signal ready\n", { timeout: 30_000 });
    await page.getByRole("button", { name: "Next chapter", exact: true }).tap();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`training-${size.width}.png`) });
  }
  await page.getByRole("button", { name: "Skip training", exact: true }).tap();
  await page.getByRole("button", { name: "Open game menu", exact: true }).tap();
  await openAdventureTool(page, "Training");
  await expect(page.locator(".training-shell")).toBeVisible();
  await page.getByRole("button", { name: "Skip training", exact: true }).tap();
  await expect(page.locator(".training-overlay")).toHaveCount(0);
  expect(errors).toEqual([]);
});
