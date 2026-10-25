import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, devices, expect, webkit } from "@playwright/test";

const origin = process.env.CODEQUEST_SCREENSHOT_URL ?? "http://localhost:4317";
const directory = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
const reports = fileURLToPath(new URL("../test-results/button-polish/", import.meta.url));
await mkdir(directory, { recursive: true });
await mkdir(reports, { recursive: true });
const errors = [];
const audits = [];

async function click(page, name) {
  await page.getByRole("button", { name, exact: true }).click();
}
async function menu(page, name) {
  if (name && (await page.getByRole("button", { name, exact: true }).isVisible())) {
    await click(page, name);
    return;
  }
  const close = page.getByRole("button", { name: "Close panel", exact: true });
  if (await close.isVisible()) await close.click();
  const desktop = page.getByRole("button", { name: "Menu", exact: true });
  if (await desktop.isVisible()) await desktop.click();
  else
    await page
      .locator('.mobile-menu-toggle:visible, .rotate-prompt:not([hidden]) button:has-text("Open game menu")')
      .first()
      .click();
  if (name) await click(page, name);
}
async function audit(page, label) {
  await page.locator(".panel").waitFor({ state: "visible" });
  await page.mouse.move(0, 0);
  await page.waitForTimeout(220);
  const result = await page.locator(".panel").evaluate((panel) => {
    const nodes = [
      ...panel.querySelectorAll("button.button, button.close-button, button.studio-project-action"),
    ].filter((b) => {
      const r = b.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && !b.closest("[hidden]") && getComputedStyle(b).visibility !== "hidden";
    });
    const issues = [];
    for (const name of panel.querySelectorAll(".studio-entry-name")) {
      if (name.parentElement.getBoundingClientRect().width && name.getBoundingClientRect().width < 12)
        issues.push(`${name.textContent.trim()}: filename crowded by controls`);
    }
    for (const b of nodes) {
      const r = b.getBoundingClientRect(),
        css = getComputedStyle(b);
      if (r.height < 43.5) issues.push(`${b.textContent.trim()}: height ${r.height}`);
      if (css.backgroundColor === "rgba(0, 0, 0, 0)" && css.backgroundImage === "none" && css.borderStyle === "none")
        issues.push(`${b.textContent.trim()}: missing button styling`);
      for (const other of nodes) {
        if (b === other || b.parentElement !== other.parentElement || nodes.indexOf(other) < nodes.indexOf(b)) continue;
        const q = other.getBoundingClientRect();
        const dx = Math.max(0, r.left - q.right, q.left - r.right);
        const dy = Math.max(0, r.top - q.bottom, q.top - r.bottom);
        if (Math.hypot(dx, dy) < 7.5)
          issues.push(`${b.textContent.trim()} / ${other.textContent.trim()}: gap ${Math.hypot(dx, dy).toFixed(1)}`);
      }
    }
    return { count: nodes.length, issues, overflow: panel.scrollWidth > panel.clientWidth + 1 };
  });
  audits.push({ label, ...result });
  if (result.issues.length || result.overflow) console.log(JSON.stringify({ label, ...result }));
}
async function capture(page, name) {
  await page.waitForTimeout(300);
  await page.screenshot({ path: `${directory}/${name}.png`, animations: "disabled" });
}
async function run(page, name) {
  const control = page.getByRole("button", { name, exact: true });
  await control.click();
  await expect(control).toBeEnabled({ timeout: 60000 });
}

const phoneOnly = process.argv.includes("--phone-only");
if (!phoneOnly) {
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
    page.setDefaultTimeout(30000);
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(origin);
    await page.getByLabel("Developer name", { exact: true }).fill("Nova");
    await click(page, "Start adventure");
    await page.locator(".path-current[data-path-step='basics']").waitFor();
    await page.locator(".toast.visible").waitFor({ state: "hidden" });
    await capture(page, "guided-adventure");
    await audit(page, "guided adventure");
    await click(page, "Close panel");
    await page.waitForTimeout(2500);
    await capture(page, "current-city");

    for (const name of ["Help & controls", "Save & profile", "City activities", "Progress", "World map"]) {
      await menu(page, name);
      await audit(page, `desktop ${name}`);
      if (name === "Help & controls") {
        await page.screenshot({ path: `${reports}/help-desktop.png`, animations: "disabled" });
        await click(page, "Accessibility & controls");
        await audit(page, "desktop accessibility");
      }
    }
    await menu(page, "My adventure");
    await click(page, "Begin the guided robot rescue");
    for (const name of ["Move to supplies", "Collect the kit", "Deliver to clinic"]) await click(page, name);
    await run(page, "Run instructions");
    await click(page, "Next lesson →");
    await page.getByLabel("Beginner code", { exact: true }).fill('const robotName = "NovaBot";');
    await run(page, "Run my code");
    await expect(page.getByRole("button", { name: "Next lesson →", exact: true })).toBeEnabled();
    await capture(page, "robot-rescue");
    await audit(page, "robot rescue");
    await click(page, "Save & explore city");

    await click(page, "Tablet");
    await page.locator(".monaco-editor").waitFor();
    await page.getByRole("tab", { name: "Projects", exact: true }).click();
    await click(page, "Start Arcade Builder");
    await click(page, "Open project files");
    await page.locator('.studio-file[title="src/GameRules.js"]').click();
    const editor = page.getByLabel("Code editor: src/GameRules.js", { exact: true });
    await editor.fill((await editor.inputValue()).replace("My Byte Run", "Byte Run"));
    await run(page, "Run practice code");
    await page.getByRole("button", { name: "Play my game", exact: true }).waitFor();
    await capture(page, "coding-workspace");
    await audit(page, "desktop tablet");
    const close = await page.getByRole("button", { name: "Close panel", exact: true }).boundingBox();
    const help = await page.getByRole("button", { name: "Tablet help", exact: true }).boundingBox();
    if (!close || !help || close.x <= help.x || close.width < 90 || close.height < 44)
      throw new Error("Tablet close control is not prominent and rightmost");
    await click(page, "Play my game");
    await click(page, "Save game & play");
    await page.locator(".grid-game-canvas").waitFor();
    await capture(page, "created-game");
    await audit(page, "created game");
    await click(page, "Close panel");
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.clock.install({ time: new Date("2026-10-25T12:00:00Z") });
    await page.clock.pauseAt(new Date("2026-10-25T12:00:01Z"));
    await page.keyboard.press("t");
    await page.locator('.tablet-cinematic[data-art-ready="true"]').waitFor();
    await page.clock.runFor(1450);
    await capture(page, "tablet-cinematic");
    await page.clock.fastForward(2500);
  } finally {
    await browser.close();
  }
}

const phoneBrowser = await webkit.launch();
try {
  const page = await phoneBrowser.newPage({
    ...devices["iPhone 13"],
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    reducedMotion: "reduce",
  });
  page.setDefaultTimeout(30000);
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(origin);
  await click(page, "Start adventure");
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await menu(page, "Help & controls");
    await audit(page, `phone help ${viewport.width}`);
    await page.screenshot({ path: `${reports}/help-phone-${viewport.width}.png`, animations: "disabled" });
    await menu(page, "Tablet");
    await page.locator(".monaco-editor").waitFor();
    await audit(page, `phone tablet ${viewport.width}`);
    await page.screenshot({ path: `${reports}/tablet-phone-${viewport.width}.png`, animations: "disabled" });
    await page.getByRole("button", { name: "Close panel", exact: true }).click();
    await page.screenshot({ path: `${reports}/city-phone-${viewport.width}.png` });
  }
} finally {
  await phoneBrowser.close();
}
console.log(
  JSON.stringify({
    captures: phoneOnly
      ? []
      : ["guided-adventure", "current-city", "robot-rescue", "coding-workspace", "created-game", "tablet-cinematic"],
    audits,
    errors,
  }),
);
if (errors.length || audits.some((a) => a.issues.length || a.overflow)) process.exitCode = 1;
