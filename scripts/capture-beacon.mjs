import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const origin = process.env.CODEQUEST_SCREENSHOT_URL ?? "http://127.0.0.1:5173";
const directory = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const errors = [];
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  await page.getByRole("textbox", { name: "Developer name", exact: true }).fill("Nova");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.getByRole("button", { name: "Mission", exact: true }).click();
  await page.getByRole("button", { name: "Create the training badge", exact: true }).click();
  await page.getByLabel("Your code", { exact: true }).fill('const heroName = "Ada";\nconsole.log(heroName);');
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback.success")).toBeVisible();
  await page.getByRole("button", { name: "Next task →", exact: true }).click();
  await page.getByLabel("Your code", { exact: true }).fill("let battery = 3;\nbattery += 9;\nconsole.log(battery);");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback.success")).toBeVisible();
  // Stage the camera near the discovery after earning its prerequisite through real submissions.
  await page.evaluate(() => {
    const key = "codequest:v1:javascript",
      state = JSON.parse(localStorage.getItem(key));
    state.position = { x: 866, y: 330 };
    state.updatedAt = new Date(Math.max(Date.now(), Date.parse(state.updatedAt) + 1)).toISOString();
    localStorage.setItem(key, JSON.stringify(state));
  });
  // A fresh context avoids the old page's pagehide position save replacing the camera staging.
  const storageState = await page.context().storageState();
  await page.context().close();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    storageState,
  });
  const scene = await context.newPage();
  scene.on("pageerror", (error) => errors.push(error.message));
  await scene.goto(origin);
  await scene.getByRole("button", { name: "Continue adventure", exact: true }).click();
  await scene.keyboard.press("e");
  await scene
    .getByLabel("Beacon code", { exact: true })
    .fill('let eventName = "Garden night";\nconsole.log(eventName);');
  await scene.getByRole("button", { name: "Run beacon preview", exact: true }).click();
  await expect(scene.getByRole("button", { name: "Light the beacon", exact: true })).toBeEnabled();
  await scene.screenshot({ path: `${directory}/community-beacon.png` });
  await scene.getByRole("button", { name: "Light the beacon", exact: true }).click();
  await scene.getByRole("button", { name: "See the courtyard", exact: true }).click();
  await scene.waitForTimeout(600);
  await scene.screenshot({ path: `${directory}/community-courtyard.png` });
  await scene.setViewportSize({ width: 390, height: 844 });
  await scene.getByRole("button", { name: "Tasks", exact: true }).click();
  await scene.getByRole("button", { name: "Optional discovery · Community beacon", exact: true }).click();
  await expect(scene.getByLabel("Beacon code", { exact: true })).toBeVisible();
  const overflow = await scene.evaluate(() => {
    const panel = document.querySelector(".beacon-quest");
    return panel.scrollWidth > panel.clientWidth + 1;
  });
  if (overflow) throw new Error("Narrow beacon panel overflows horizontally");
  expect(errors).toEqual([]);
  console.log(
    JSON.stringify({
      screenshots: ["community-beacon.png", "community-courtyard.png"],
      narrowLayout: "passed",
      errors,
    }),
  );
} finally {
  await browser.close();
}
