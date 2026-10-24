import { expect, type Page, test } from "@playwright/test";
import { serializeWorkspaceShare } from "../../src/ui/local-workspace";

declare const Buffer: { from(input: string): Uint8Array };

test.use({ reducedMotion: "reduce" });
test.setTimeout(90_000);
async function start(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  const skip = page.getByRole("button", { name: "Skip guide", exact: true });
  if (await skip.isVisible()) await skip.click();
}
async function tablet(page: Page) {
  await page.keyboard.press("t");
  await expect(page.locator(".monaco-editor")).toBeVisible({ timeout: 20_000 });
}
async function dragOutput(page: Page, delta: number) {
  const divider = page.getByRole("separator", { name: "Resize output panel" });
  await divider.scrollIntoViewIfNeeded();
  const box = await divider.boundingBox();
  if (!box) throw new Error("Output divider missing");
  const x = box.x + box.width / 2,
    y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + delta, { steps: 8 });
  await page.mouse.up();
}
const outputHeight = (page: Page) =>
  page.locator(".studio-inline-console").evaluate((node) => node.getBoundingClientRect().height);

test("compact desktop bar keeps every tool available in the menu", async ({ page }, info) => {
  await start(page);
  for (const width of [1280, 900]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.locator(".hud-actions .button")).toHaveText(["Tablet", "World map", "Menu"]);
    const bounds = await page
      .locator(".hud-actions .button")
      .evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().y));
    expect(Math.max(...bounds) - Math.min(...bounds)).toBeLessThan(2);
    expect((await page.locator(".hud").boundingBox())?.height).toBeLessThan(90);
  }
  await page.screenshot({ path: info.outputPath("compact-hud.png") });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const menu = page.getByRole("dialog", { name: "Take a breath", exact: true });
  for (const name of [
    "Tablet",
    "Mission",
    "Lighting",
    "Lesson",
    "Progress",
    "World map",
    "Training",
    "Guide tour",
    "Save backup file",
    "Load backup file",
    "Manage character",
    "Accessibility & controls",
  ])
    await expect(menu.getByRole("button", { name, exact: true })).toBeVisible();
  await menu.getByRole("button", { name: "Progress", exact: true }).click();
  await expect(page.locator(".task-row")).toHaveCount(8);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Lighting", exact: true }).click();
  await expect(page.getByLabel("Lighting code", { exact: true })).toBeVisible();
});

test("output divider changes both pane sizes and remembers its height without losing code", async ({ page }, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await start(page);
  await tablet(page);
  await expect(page.getByRole("tab")).toHaveCount(7);
  await expect(page.getByRole("tab", { name: "Console", exact: true })).toHaveCount(0);
  const code = 'for (let line = 1; line <= 40; line++) console.log("Signal " + line);';
  await page.getByLabel("Practice code", { exact: true }).fill(code);
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await expect(page.getByLabel("Practice output", { exact: true })).toContainText("Signal 40", { timeout: 30_000 });
  const before = await outputHeight(page);
  const editorBefore = (await page.locator(".studio-code-grid").boundingBox())?.height ?? 0;
  await dragOutput(page, -80);
  await expect.poll(() => outputHeight(page)).toBeGreaterThan(before + 60);
  expect((await page.locator(".studio-code-grid").boundingBox())?.height).toBeLessThan(editorBefore - 60);
  const expanded = await outputHeight(page);
  const divider = page.getByRole("separator", { name: "Resize output panel" });
  await expect(divider).toHaveCSS("cursor", "row-resize");
  await page.keyboard.press("Escape");
  await tablet(page);
  await expect.poll(() => outputHeight(page)).toBe(expanded);
  await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue(code);
  await divider.focus();
  await page.keyboard.press("Home");
  await expect(divider).toHaveAttribute("aria-valuenow", "64");
  await page.keyboard.press("ArrowUp");
  await expect(divider).toHaveAttribute("aria-valuenow", "84");
  await page.keyboard.press("End");
  const maximum = Number(await divider.getAttribute("aria-valuemax"));
  await expect(divider).toHaveAttribute("aria-valuenow", String(maximum));
  expect((await page.locator(".studio-code-grid").boundingBox())?.height).toBeGreaterThanOrEqual(119);
  await page.screenshot({ path: info.outputPath("resizable-output.png") });
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await tablet(page);
  await expect(divider).toHaveAttribute("aria-valuenow", String(maximum));
  await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue(code);
  expect(errors).toEqual([]);
});

test("file formats get matching icons in Explorer and open tabs; styled backup controls still work", async ({
  page,
}, info) => {
  await start(page);
  await tablet(page);
  const types = {
    "main.js": "javascript",
    "helper.ts": "typescript",
    "Player.java": "java",
    "player.py": "python",
    "config.json": "json",
    "index.html": "html",
    "theme.css": "css",
    "README.md": "markdown",
    "notes.txt": "text",
    "preview.png": "image",
    "data.bin": "file",
  };
  const files = Object.fromEntries(
    Object.keys(types).map((path) => [`src/${path}`, path === "main.js" ? 'console.log("Icon project");' : ""]),
  );
  await page.locator(".studio-import-input").setInputFiles({
    name: "icons.codequest.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      serializeWorkspaceShare({ version: 1, files, folders: ["src"], entryPath: "src/main.js" }, "javascript"),
    ),
  });
  for (const [path, type] of Object.entries(types)) {
    const file = page.locator(`.studio-file[title="src/${path}"]`);
    await expect(file.locator(".studio-file-icon")).toHaveAttribute("data-file-type", type);
    await file.click();
    await expect(page.locator(`.studio-open-file-tab[title="src/${path}"] .studio-file-icon`)).toHaveAttribute(
      "data-file-type",
      type,
    );
  }
  for (const name of ["Open local folder", "Export project", "Import project"]) {
    const action = page.getByRole("button", { name, exact: true });
    await expect(action).toHaveCSS("border-radius", "7px");
    await expect(action.locator("svg")).toBeVisible();
  }
  await page.locator('.studio-file[title="src/main.js"]').click();
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await expect(page.getByLabel("Practice output", { exact: true })).toContainText("Icon project");
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export project", exact: true }).click();
  expect((await downloadEvent).suggestedFilename()).toMatch(/\.codequest\.json$/);
  await page.screenshot({ path: info.outputPath("file-format-icons.png") });
});

test("mobile tablet retains reachable controls while output resizes and clamps on rotation", async ({ page }, info) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await start(page);
  await tablet(page);
  const divider = page.getByRole("separator", { name: "Resize output panel" });
  await divider.scrollIntoViewIfNeeded();
  await divider.focus();
  await page.keyboard.press("Home");
  const before = await outputHeight(page);
  await dragOutput(page, -45);
  await expect.poll(() => outputHeight(page)).toBeGreaterThan(before + 20);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(divider).toHaveAttribute("aria-orientation", "horizontal");
  await page.getByLabel("Practice code", { exact: true }).fill('console.log("Mobile output");');
  const run = page.getByRole("button", { name: "Run practice code", exact: true });
  await run.scrollIntoViewIfNeeded();
  await run.click();
  await expect(page.getByLabel("Practice output", { exact: true })).toContainText("Mobile output");
  expect(await page.locator(".studio-workspace").evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBe(
    true,
  );
  await page.getByLabel("Practice output", { exact: true }).scrollIntoViewIfNeeded();
  await page.screenshot({ path: info.outputPath("mobile-output.png") });
});
