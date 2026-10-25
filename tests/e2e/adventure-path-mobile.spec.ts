import { expect, test } from "@playwright/test";
import { openAdventureTool } from "./helpers/adventure-tools";
import { emulateManualRotation } from "./helpers/mobile";

test.beforeEach(({ page }) => emulateManualRotation(page));

test.use({
  storageState: { cookies: [], origins: [] },
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  isMobile: true,
  reducedMotion: "reduce",
});
test("phone newcomers get one ordered first step and resume it through the same compact menu", async ({
  page,
}, info) => {
  test.setTimeout(90000);
  page.setDefaultTimeout(20000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await expect(page.locator(".path-current")).toHaveAttribute("data-path-step", "basics");
  expect(await page.locator(".adventure-path-panel").evaluate((n) => n.scrollWidth <= n.clientWidth + 1)).toBe(true);
  await page.screenshot({ path: info.outputPath("phone-next-step.png") });
  await page.getByRole("button", { name: "Begin the guided robot rescue", exact: true }).click();
  for (const label of ["Move to supplies", "Collect the kit", "Deliver to clinic"])
    await page.getByRole("button", { name: label, exact: true }).click();
  await page.getByRole("button", { name: "Run instructions", exact: true }).click();
  await expect(page.getByRole("button", { name: "Next lesson →", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Next lesson →", exact: true }).click();
  await page.getByRole("button", { name: "Save & explore city", exact: true }).click();
  await openAdventureTool(page, "My adventure");
  await expect(page.getByRole("button", { name: "Continue my robot rescue", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue my robot rescue", exact: true }).click();
  await expect(page.locator(".zero-shell")).toHaveAttribute("data-beginner-step", "name");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.getByRole("button", { name: "Save & explore city", exact: true }).click();
  await openAdventureTool(page, "Menu");
  await expect(page.locator(".adventure-menu-primary>button")).toHaveCount(7);
  await page.getByRole("button", { name: "Help & controls", exact: true }).click();
  await expect(page.getByRole("button", { name: "Show controls tour", exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});
