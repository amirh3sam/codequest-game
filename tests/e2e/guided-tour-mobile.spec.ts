import { expect, test } from "@playwright/test";
import { cityGuide } from "../../src/content/guided-tour";
import { openAdventureTool } from "./helpers/adventure-tools";

test.use({
  storageState: { cookies: [], origins: [] },
  reducedMotion: "reduce",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
});

test("phone guided tour shows real targets and keeps captions/navigation reachable after rotation", async ({
  page,
}, info) => {
  test.setTimeout(180_000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).tap();
  await openAdventureTool(page, "Guide tour");
  await expect(page.locator(".guide-tour")).toBeVisible();
  await page.evaluate(() =>
    Object.defineProperty(document.documentElement, "requestFullscreen", { value: async () => {} }),
  );
  for (const size of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(size);
    for (const id of [
      "status",
      "movement",
      "tools",
      "tablet",
      "code",
      "files",
      "run",
      "projects",
      "map",
      "save",
      "character",
    ]) {
      await page
        .getByLabel("Guide tour topic", { exact: true })
        .selectOption(String(cityGuide("Kai").findIndex((step) => step.id === id)));
      await expect(page.locator(".guide-tour")).toHaveAttribute("data-target", id);
      await expect(page.locator(".guide-ring")).toBeVisible();
      const bounds = await page.locator(".guide-card").boundingBox();
      expect(bounds).not.toBeNull();
      if (!bounds) throw new Error("Guide card unavailable");
      expect(bounds.x).toBeGreaterThanOrEqual(0);
      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(size.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(size.height);
      const highlight = await page.locator(".guide-ring").boundingBox();
      if (!highlight) throw new Error("Highlight unavailable");
      expect(
        bounds.x + bounds.width <= highlight.x ||
          highlight.x + highlight.width <= bounds.x ||
          bounds.y + bounds.height <= highlight.y ||
          highlight.y + highlight.height <= bounds.y,
      ).toBe(true);
      await expect(page.getByRole("button", { name: "Next →", exact: true })).toBeInViewport();
    }
    if (size.width === 390) {
      await page.getByRole("region", { name: "Tour caption", exact: true }).focus();
      await page.keyboard.press("ArrowDown");
      await expect.poll(() => page.locator(".guide-copy").evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
    }
    await page.screenshot({ path: info.outputPath(`guided-phone-${size.width}.png`), animations: "disabled" });
  }
  await page.getByRole("button", { name: "Skip tour", exact: true }).tap();
  await expect(page.locator(".guide-tour")).toHaveCount(0);
  await expect(page.locator("#ui")).toHaveJSProperty("inert", false);
  await page.getByRole("button", { name: "Open game menu", exact: true }).tap();
  await openAdventureTool(page, "Guide tour");
  await expect(page.locator(".guide-tour")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.locator(".guide-tour")).toHaveCount(0);
  expect(errors).toEqual([]);
});
