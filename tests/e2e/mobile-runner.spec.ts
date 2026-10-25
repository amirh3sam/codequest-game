import { expect, type Page, test } from "@playwright/test";
import type { Lang } from "../../src/runners/types";
import { emulateManualRotation } from "./helpers/mobile";

test.beforeEach(({ page }) => emulateManualRotation(page));

const CODE: Record<Lang, string> = {
  javascript: 'console.log("Mobile run OK");',
  typescript: 'const message: string = "Mobile run OK"; console.log(message);',
  python: 'print("Mobile run OK")',
  java: 'public class Main { public static void main(String[] args) { System.out.println("Mobile run OK"); } }',
};

async function start(page: Page, lang: Lang) {
  await page.goto("/");
  await page.locator(`[data-language="${lang}"]`).tap();
  await page.getByRole("button", { name: "Start adventure", exact: true }).tap();
  await page.getByRole("button", { name: "Open game menu", exact: true }).tap();
  await page.getByRole("button", { name: "Tablet", exact: true }).tap();
}

async function runTablet(page: Page, lang: Lang) {
  await page.getByLabel("Practice code", { exact: true }).fill(CODE[lang]);
  // A real touch must reach Run; forcing a click would hide status-bar overlaps.
  await page.getByRole("button", { name: "Run practice code", exact: true }).tap();
  const output = page.getByLabel("Practice output", { exact: true });
  await expect(output).toHaveText("Mobile run OK\n", { timeout: 60_000 });
  await output.scrollIntoViewIfNeeded();
  await expect(output).toBeVisible();
  const bounds = await output.boundingBox(),
    status = await page.locator(".studio-status").boundingBox();
  expect((bounds?.y ?? 0) + (bounds?.height ?? 0)).toBeLessThanOrEqual((status?.y ?? 0) + 1);
}

test.use({
  viewport: { width: 844, height: 390 },
  isMobile: true,
  hasTouch: true,
  reducedMotion: "reduce",
});

for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang} runs from both the tablet and a task with real touch input`, async ({ page }) => {
    test.setTimeout(120_000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await start(page, lang);
    await runTablet(page, lang);
    await page.getByRole("button", { name: "Close panel", exact: true }).tap();
    await page.getByRole("button", { name: "Open game menu", exact: true }).tap();
    await page.getByRole("button", { name: "Progress", exact: true }).tap();
    await page.locator(".task-row").first().tap();
    await page.getByLabel("Your code", { exact: true }).fill(CODE[lang]);
    await page.getByRole("button", { name: "Run code", exact: true }).tap();
    await expect(page.locator(".task-console-shell .output")).toHaveText("Mobile run OK", { timeout: 60_000 });
    await expect(page.locator(".feedback")).toContainText("Run complete");
    expect(errors).toEqual([]);
  });
}

test("Java recovers from a streamed-compiler TypeError using the same compiler's bytes", async ({ page }) => {
  test.setTimeout(120_000);
  let requests = 0;
  await page.route("**/runtimes/java/compiler.wasm", async (route) => {
    requests++;
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: { ...response.headers(), "content-type": "application/octet-stream" },
    });
  });
  await start(page, "java");
  await runTablet(page, "java");
  expect(requests).toBe(2);
});
