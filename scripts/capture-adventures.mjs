import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium, expect } from "@playwright/test";

const origin = process.env.CODEQUEST_SCREENSHOT_URL ?? "http://127.0.0.1:5173";
const directory = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
const variables = JSON.parse(
  await readFile(new URL("../src/content/data/javascript/01-variables.json", import.meta.url), "utf8"),
);
const browser = await chromium.launch(),
  errors = [];
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(origin);
  for (const [lang, name] of [
    ["java", "Nova"],
    ["javascript", "Ada"],
    ["python", "Milo"],
  ]) {
    await page.locator(`[data-language="${lang}"]`).click();
    await page.getByRole("textbox", { name: "Developer name", exact: true }).fill(name);
    await page.getByRole("button", { name: /^Start (a new )?adventure$/ }).click();
    await page.getByRole("button", { name: "Menu", exact: true }).click();
    await page.getByRole("button", { name: "Switch adventure", exact: true }).click();
    if (lang !== "python") await page.getByRole("button", { name: "Start another adventure", exact: true }).click();
  }
  await expect(page.locator(".adventure-card")).toHaveCount(3);
  await page.waitForTimeout(4600);
  await page.screenshot({ path: `${directory}/adventure-library.png` });
  await page.getByRole("button", { name: "Resume Ada · JavaScript", exact: true }).click();
  // Use a valid completed-first-district fixture to frame the second map. These are isolated capture saves.
  await page.evaluate((variables) => {
    const state = JSON.parse(localStorage.getItem("codequest:v1:javascript"));
    state.areas.variables.solved = variables.tasks.map((task) => task.id);
    state.areas.variables.gems = variables.tasks.reduce(
      (total, task) => total + { easy: 1, normal: 2, hard: 3 }[task.difficulty],
      0,
    );
    state.areas.variables.bossDefeated = true;
    state.currentArea = "conditions";
    state.position = { x: 580, y: 420 };
    state.updatedAt = new Date(Math.max(Date.now(), Date.parse(state.updatedAt) + 1)).toISOString();
    localStorage.setItem("codequest:v1:javascript", JSON.stringify(state));
    const library = JSON.parse(localStorage.getItem("codequest:adventures:v1"));
    library.adventures = library.adventures.map((entry) => (entry.adventureId === state.adventureId ? state : entry));
    localStorage.setItem("codequest:adventures:v1", JSON.stringify(library));
  }, variables);
  const storageState = await context.storageState();
  await context.close();
  const framed = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    storageState,
  });
  const scene = await framed.newPage();
  scene.on("pageerror", (error) => errors.push(error.message));
  await scene.goto(origin);
  await scene.getByRole("button", { name: "Continue adventure", exact: true }).click();
  await expect(scene.locator(".location-name")).toHaveText("Logic Junction");
  await scene.waitForTimeout(4600);
  await scene.screenshot({ path: `${directory}/logic-junction.png` });
  await scene.setViewportSize({ width: 390, height: 844 });
  await scene.getByRole("button", { name: "Menu", exact: true }).click();
  await scene.getByRole("button", { name: "Switch adventure", exact: true }).click();
  await expect(scene.locator(".adventure-card")).toHaveCount(3);
  const overflow = await scene.evaluate(() => {
    const panel = document.querySelector('[role="dialog"]');
    return panel.scrollWidth > panel.clientWidth + 1;
  });
  expect(overflow).toBe(false);
  expect(errors).toEqual([]);
  console.log(
    JSON.stringify({ captures: ["adventure-library.png", "logic-junction.png"], narrowLibrary: "passed", errors }),
  );
} finally {
  await browser.close();
}
