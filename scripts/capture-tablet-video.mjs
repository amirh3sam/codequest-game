import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const origin = process.env.CODEQUEST_SCREENSHOT_URL ?? "http://127.0.0.1:5173";
const directory = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
const temporary = fileURLToPath(new URL("../test-results/tablet-capture/", import.meta.url));
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
try {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    reducedMotion: "no-preference",
    recordVideo: { dir: temporary, size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.getByRole("textbox", { name: "Developer name", exact: true }).fill("Nova");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.press("t");
  await page.locator(".tablet-cinematic-canvas").waitFor({ timeout: 15_000 });
  await page.getByRole("dialog", { name: "Developer tablet", exact: true }).waitFor({ timeout: 20_000 });
  await page.waitForTimeout(900);
  const video = page.video();
  await context.close();
  if (!video) throw new Error("Browser video was unavailable");
  await video.saveAs(`${directory}/tablet-opening.webm`);
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Recorded the real 3D tablet opening to docs/screenshots/tablet-opening.webm.");
} finally {
  await browser.close();
}
