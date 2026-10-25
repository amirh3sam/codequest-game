import { expect, type Page, test } from "@playwright/test";
import { beginnerStarter, chargeInstruction } from "../../src/content/first-program";
import { loadVariables } from "../../src/content/loader";
import { DEFAULT_DESIGN } from "../../src/core/arcade-creation";
import { reviewLesson } from "../../src/core/learning-review";
import { createGame } from "../../src/core/state";
import { openAdventureTool } from "./helpers/adventure-tools";
import { nextBeginner, runBeginner } from "./helpers/beginner";
import { collectGridGems } from "./helpers/grid-game";

test.use({ storageState: { cookies: [], origins: [] }, reducedMotion: "reduce" });
async function run(page: Page, label: string) {
  const b = page.getByRole("button", { name: label, exact: true });
  await b.click();
  await expect(b).toBeEnabled({ timeout: 90000 });
}
test("a first-time learner follows one complete ordered adventure without choosing between learning menus", async ({
  page,
}, info) => {
  test.setTimeout(300000);
  page.setDefaultTimeout(20000);
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByLabel("How would you like to play?")).toHaveValue("guided", { timeout: 30000 });
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await expect(page.locator(".path-current")).toHaveAttribute("data-path-step", "basics");
  await expect(page.locator(".guide-tour")).toHaveCount(0);
  await expect(page.locator(".training-shell")).toHaveCount(0);
  await page.screenshot({ path: info.outputPath("one-clear-first-step.png") });
  await page.getByRole("button", { name: "Begin the guided robot rescue", exact: true }).click();
  for (const label of ["Move to supplies", "Collect the kit", "Deliver to clinic"])
    await page.getByRole("button", { name: label, exact: true }).click();
  await runBeginner(page, "Run instructions");
  await nextBeginner(page, "name");
  await page
    .getByLabel("Beginner code", { exact: true })
    .fill(beginnerStarter("javascript", "name").replace("Pixel", "Nova"));
  await runBeginner(page, "Run my code");
  await nextBeginner(page, "predict");
  await page.getByRole("button", { name: "5 cells", exact: true }).click();
  await runBeginner(page, "Run working example");
  await nextBeginner(page, "investigate");
  for (let i = 0; i < 3; i++) await page.getByRole("button", { name: "Step through next line", exact: true }).click();
  await page.getByRole("button", { name: "Add to the stored value", exact: true }).click();
  await nextBeginner(page, "charge");
  await page.getByLabel("Beginner code", { exact: true }).fill(chargeInstruction("javascript", 6));
  await runBeginner(page, "Run my code");
  await nextBeginner(page, "rescue");
  await page.getByLabel("Beginner code", { exact: true }).fill(chargeInstruction("javascript", 7));
  await runBeginner(page, "Test my rescue code");
  await nextBeginner(page, "transfer");
  await page.getByRole("button", { name: "6 cells", exact: true }).click();
  await runBeginner(page, "Run working example");
  await page.getByRole("button", { name: "Continue: Make your first city repair", exact: true }).click();
  await page.getByRole("button", { name: "Create the training badge", exact: true }).click();
  await page.getByLabel("Your code", { exact: true }).fill(loadVariables("javascript").tasks[0].solution);
  await page.getByRole("button", { name: "Run code", exact: true }).click();
  await expect(page.getByRole("button", { name: "Submit answer", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await page.getByRole("button", { name: "Continue my adventure", exact: true }).click();
  await run(page, "Run gate example");
  await page.getByRole("button", { name: "Next lesson →", exact: true }).click();
  await page.getByRole("button", { name: "Predict CLOSED", exact: true }).click();
  await run(page, "Run gate example");
  await page.getByRole("button", { name: "Next lesson →", exact: true }).click();
  for (let i = 0; i < 3; i++)
    await page.getByRole("button", { name: "Step through the decision", exact: true }).click();
  await page.getByRole("button", { name: "The else branch", exact: true }).click();
  await page.getByRole("button", { name: "Next lesson →", exact: true }).click();
  await page.getByLabel("Gate condition", { exact: true }).fill("battery >= 4");
  await run(page, "Test gate condition");
  await page.getByRole("button", { name: "Next lesson →", exact: true }).click();
  await page.getByLabel("Gate condition", { exact: true }).fill("isDelivery && battery >= 4");
  await run(page, "Test gate condition");
  await page.getByRole("button", { name: "Continue: Program a city delivery", exact: true }).click();
  await run(page, "Test delivery program");
  await page.getByRole("button", { name: "Deploy route in city", exact: true }).click();
  await expect
    .poll(
      () =>
        page.evaluate(
          () =>
            JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0].journey.companion.trips,
        ),
      { timeout: 45000 },
    )
    .toBe(1);
  await expect(page.locator(".objective")).toContainText("Build and beat your own game");
  await page.getByRole("button", { name: "Continue this step", exact: true }).click();
  const rule = page.getByLabel("Code editor: src/GameRules.js", { exact: true });
  await expect(rule).toBeVisible();
  const template = await rule.inputValue();
  await rule.fill(template.replace("My Byte Run", "Byte Run"));
  await run(page, "Run game project");
  await rule.fill(template.replace("My Byte Run", "Byte Run").replace("goal = 5", "goal = 8"));
  await run(page, "Run game project");
  await page.getByRole("button", { name: "Play my game", exact: true }).click();
  await page.getByRole("button", { name: "Save game & play", exact: true }).click();
  await collectGridGems(page, { ...DEFAULT_DESIGN, name: "Byte Run", goal: 8 });
  await expect(page.locator(".grid-game-status")).toContainText("You beat it!");
  await page.getByRole("button", { name: "Continue my adventure", exact: true }).click();
  await expect(page.locator(".path-current")).toHaveAttribute("data-path-step", "city");
  await page.getByRole("button", { name: "Restore my city services", exact: true }).click();
  for (const service of ["Developer workshop", "City tram", "Data exchange"])
    await page.getByRole("button", { name: `Restore ${service}`, exact: true }).click();
  await page.getByRole("button", { name: "Continue my adventure", exact: true }).click();
  for (const topic of ["variables", "conditions", "loops"] as const) {
    await page.getByLabel("Review repair code", { exact: true }).fill(reviewLesson(topic, 0, "javascript").solution);
    await page.getByRole("button", { name: "Test my review repair", exact: true }).click();
    await expect(page.locator(".zero-feedback")).toContainText("Review complete");
    await page.getByRole("button", { name: /^Continue:/ }).click();
  }
  await page.getByRole("button", { name: "Wear amber hoodie", exact: true }).click();
  await page.getByRole("button", { name: "Continue my adventure", exact: true }).click();
  await expect(page.locator(".path-progress")).toContainText("8/8");
  await expect(page.getByRole("button", { name: "Continue my next city mission", exact: true })).toBeVisible();
  await page.screenshot({ path: info.outputPath("first-adventure-complete.png") });
  await openAdventureTool(page, "Menu");
  await expect(page.locator(".adventure-menu-primary>button")).toHaveCount(7);
  for (const name of ["Training", "Lesson", "Start from zero", "Mission", "Guide tour"])
    await expect(page.getByRole("button", { name, exact: true })).toHaveCount(0);
  expect(errors).toEqual([]);
});
test("the fresh-start link downloads a backup and opens Step 1 while keeping original saves and projects", async ({
  page,
}) => {
  page.setDefaultTimeout(20000);
  const at = new Date().toISOString(),
    original = {
      ...createGame("javascript", { name: "Amir", kind: "boy" }, at),
      adventureId: "keep-amir",
      games: { packetDashBest: 90 },
    },
    other = { ...createGame("python", { name: "Ava", kind: "girl" }, at), adventureId: "keep-ava" };
  await page.goto("/");
  await expect(page.locator(".language-grid .choice")).toHaveCount(4, { timeout: 30000 });
  await page.evaluate(
    ({ original, other }) => {
      localStorage.setItem("codequest:adventures:v1", JSON.stringify({ version: 1, adventures: [original, other] }));
      localStorage.setItem("codequest:workspace:v1:keep-amir", "my files stay");
      localStorage.setItem(
        "codequest:training:v1",
        JSON.stringify({ version: 1, welcome: "complete", chapter: "welcome", completed: [], autoDistricts: false }),
      );
    },
    { original, other },
  );
  await page.goto("/?first-time=1");
  await expect(page.locator(".fresh-guided-start")).toContainText("Amir", { timeout: 30000 });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Start fresh guided adventure", exact: true }).click();
  expect((await download).suggestedFilename()).toContain("Amir");
  await expect(page.locator(".path-current")).toHaveAttribute("data-path-step", "basics");
  await expect(page.locator(".path-coach")).toContainText("Welcome, Amir");
  const data = await page.evaluate(() => ({
    states: JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures,
    project: localStorage.getItem("codequest:workspace:v1:keep-amir"),
  }));
  expect(data.states).toHaveLength(3);
  expect(data.states.find((s: { adventureId: string }) => s.adventureId === "keep-amir")).toEqual(original);
  expect(data.states.find((s: { adventureId: string }) => s.adventureId === "keep-ava")).toEqual(other);
  expect(data.project).toBe("my files stay");
  const fresh = data.states.find((s: { adventureId: string }) => !["keep-amir", "keep-ava"].includes(s.adventureId));
  expect(fresh.areas.variables.solved).toEqual([]);
  expect(fresh.beginner).toBeUndefined();
  expect(fresh.journey.path.mode).toBe("guided");
  await page.getByRole("button", { name: "Begin the guided robot rescue", exact: true }).click();
  await expect(page.locator(".zero-shell")).toHaveAttribute("data-beginner-step", "instructions");
});

test("experienced players can explore without an automatic lesson or controls tour, including after refresh", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Help & controls", exact: true }).click();
  await page.getByRole("button", { name: "Accessibility & controls", exact: true }).click();
  await page.getByRole("button", { name: "Back to help", exact: true }).click();
  await page.getByRole("button", { name: "Back to title", exact: true }).click();
  await page.getByLabel("How would you like to play?").selectOption("free");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await expect(page.getByRole("button", { name: "Tablet", exact: true })).toBeVisible();
  await expect(page.locator(".guide-tour, .training-shell, .adventure-path-panel, .zero-shell")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("How would you like to play?")).toHaveValue("free", { timeout: 30000 });
  await page.locator(".title-adventure-row").first().click();
  await expect(page.getByRole("button", { name: "Tablet", exact: true })).toBeVisible();
  await expect(page.locator(".guide-tour, .training-shell, .adventure-path-panel, .zero-shell")).toHaveCount(0);
  await openAdventureTool(page, "My adventure");
  await expect(page.locator(".path-current")).toHaveAttribute("data-path-step", "basics");
});
