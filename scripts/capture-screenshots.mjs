import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const origin = process.env.CODEQUEST_SCREENSHOT_URL ?? "http://127.0.0.1:5173";
const directory = fileURLToPath(new URL("../docs/screenshots/", import.meta.url));
await mkdir(directory, { recursive: true });
const browser = await chromium.launch();
const errors = [];
try {
  const initial = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
  await initial.goto(origin);
  await initial.getByRole("textbox", { name: "Developer name", exact: true }).fill("Nova");
  await initial.getByRole("button", { name: "Start adventure", exact: true }).click();
  const state = await initial.evaluate(() => JSON.parse(localStorage.getItem("codequest:v1:javascript")));
  state.position = { x: 660, y: 440 };
  await initial.context().close();
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: "reduce",
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(origin).origin,
          localStorage: [{ name: "codequest:v1:javascript", value: JSON.stringify(state) }],
        },
      ],
    },
  });
  const page = await context.newPage();
  page.on("pageerror", (error) => errors.push(error.message));
  const capture = async (name) => {
    await page.waitForTimeout(400);
    await page.screenshot({ path: `${directory}/${name}.png` });
  };
  await page.goto(origin);
  await page.getByRole("button", { name: "Continue adventure", exact: true }).click();
  await page.waitForTimeout(4700);
  await capture("tech-city");
  await page.getByRole("button", { name: "Mission", exact: true }).click();
  await page.getByRole("button", { name: "Create the training badge", exact: true }).click();
  await page.getByLabel("Your code", { exact: true }).fill('const heroName = "Ada";\nconsole.log(heroName);');
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await page.locator(".feedback.success").waitFor();
  await page.getByRole("button", { name: "Continue with Kai", exact: true }).click();
  await page.getByRole("button", { name: "5 cells", exact: true }).click();
  await page.getByRole("button", { name: "Run example", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('[role="meter"]')?.getAttribute("aria-valuenow") === "5");
  await capture("drone-lesson");
  await page.getByRole("button", { name: "Try changing the charge", exact: true }).click();
  await page.getByLabel("Charge to add", { exact: true }).fill("9");
  await page.getByRole("button", { name: "Preview charge", exact: true }).click();
  await page.getByRole("button", { name: "Build the repair", exact: true }).click();
  await page.getByLabel("Your code", { exact: true }).fill("let battery = 3;\nbattery += 9;\nconsole.log(battery);");
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  await page.waitForFunction(() => document.querySelector(".feedback")?.textContent.includes("Run complete"));
  await capture("code-repair");
  await page.getByRole("button", { name: "Close panel", exact: true }).click();
  await page.keyboard.press("t");
  await page
    .getByLabel("Practice code", { exact: true })
    .fill(
      'const project = "My next adventure";\nconst ideas = 3;\nconsole.log(project);\nconsole.log("Ready to build", ideas, "new ideas!");',
    );
  await capture("developer-tablet");
  await page.keyboard.press("Escape");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.clock.install({ time: new Date("2026-10-22T12:00:00Z") });
  await page.clock.pauseAt(new Date("2026-10-22T12:00:01Z"));
  await page.keyboard.press("t");
  await page.locator(".tablet-cinematic-canvas").waitFor({ timeout: 15_000 });
  await page.clock.fastForward(2450);
  await page.screenshot({ path: `${directory}/tablet-cinematic.png` });
  await page.clock.fastForward(2500);
  await page.getByRole("dialog", { name: "Developer tablet", exact: true }).waitFor({ timeout: 20_000 });
  if (errors.length) throw new Error(errors.join("\n"));
  console.log("Captured five screenshots from the real game; no page errors.");
} finally {
  await browser.close();
}
