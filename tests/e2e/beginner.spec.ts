import { expect, test } from "@playwright/test";
import { beginnerStarter, chargeInstruction } from "../../src/content/first-program";
import { BEGINNER_STEPS } from "../../src/core/beginner";
import { openAdventureTool } from "./helpers/adventure-tools";
import { beginnerState, nextBeginner, runBeginner, seedBeginner } from "./helpers/beginner";

declare const Buffer: { from(input: string): Uint8Array };
test.use({ reducedMotion: "reduce" });
test.setTimeout(180_000);
for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: a complete novice can finish the robot rescue using real code without spending city resources`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.locator(`[data-language="${lang}"]`).click();
    await page.getByRole("button", { name: "Start adventure", exact: true }).click();
    await openAdventureTool(page, "Start from zero");
    await expect(page.locator(".zero-shell")).toHaveAttribute("data-beginner-step", "instructions");
    const before = (await beginnerState(page)).areas;
    await expect(page.getByRole("button", { name: "Next lesson →", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Deliver to clinic", exact: true }).click();
    await runBeginner(page, "Run instructions");
    await expect(page.locator(".zero-feedback")).toContainText("collect the kit before");
    await page.getByRole("button", { name: "Remove instruction 1", exact: true }).click();
    for (const name of ["Move to supplies", "Collect the kit", "Deliver to clinic"])
      await page.getByRole("button", { name, exact: true }).click();
    await runBeginner(page, "Run instructions");
    await expect(page.locator(".zero-scene")).toHaveClass(/zero-delivered/);
    await nextBeginner(page, "name");
    await expect(page.locator(".zero-scene-summary")).toContainText("robot lab");
    await page
      .getByLabel("Beginner code", { exact: true })
      .fill(beginnerStarter(lang, "name").replace("Pixel", "byte"));
    await runBeginner(page, "Run my code");
    await expect(page.getByLabel("Beginner output", { exact: true })).toHaveText("byte\n");
    await expect(page.locator(".zero-robot-label")).toHaveText("byte");
    await nextBeginner(page, "predict");
    await page.getByRole("button", { name: "2 cells", exact: true }).click();
    await runBeginner(page, "Run working example");
    await expect(page.locator(".zero-feedback")).toContainText("You chose 2; the program printed 5");
    await expect(page.getByRole("meter", { name: "Robot energy cells", exact: true })).toHaveAttribute(
      "aria-valuenow",
      "5",
    );
    await nextBeginner(page, "investigate");
    const step = page.getByRole("button", { name: "Step through next line", exact: true });
    for (const value of ["2", "5", "5"]) {
      await step.click();
      await expect(page.getByRole("meter", { name: "Robot energy cells", exact: true })).toHaveAttribute(
        "aria-valuenow",
        value,
      );
    }
    await page.getByRole("button", { name: "Replace it with 3", exact: true }).click();
    await expect(page.getByRole("button", { name: "Next lesson →", exact: true })).toBeDisabled();
    await page.getByRole("button", { name: "Add to the stored value", exact: true }).click();
    await nextBeginner(page, "charge");
    await runBeginner(page, "Run my code");
    await expect(page.locator(".zero-feedback")).toContainText("produced 5; the goal is 8");
    await page.getByLabel("Beginner code", { exact: true }).fill(chargeInstruction(lang, 6));
    await runBeginner(page, "Run my code");
    await expect(page.getByLabel("Beginner output", { exact: true })).toHaveText("8\n");
    await nextBeginner(page, "rescue");
    await page.getByLabel("Beginner code", { exact: true }).fill(`battery = 10${lang === "python" ? "" : ";"}`);
    await runBeginner(page, "Test my rescue code");
    await expect(page.locator(".zero-feedback")).toContainText("instead of replacing its value");
    await expect(page.getByRole("button", { name: "Next lesson →", exact: true })).toBeDisabled();
    await page.getByLabel("Beginner code", { exact: true }).fill(chargeInstruction(lang, 7));
    await runBeginner(page, "Test my rescue code");
    await expect(page.getByLabel("Beginner output", { exact: true })).toContainText("Starting at 4:\n11");
    await expect(page.locator(".zero-feedback")).toContainText("Rescue successful");
    await page.screenshot({ path: info.outputPath(`robot-rescue-${lang}.png`) });
    await nextBeginner(page, "transfer");
    await expect(page.locator(".zero-robot-label")).toHaveText("Relay");
    await expect(page.locator(".zero-robot")).toHaveClass(/other/);
    await page.getByRole("button", { name: "4 cells", exact: true }).click();
    await runBeginner(page, "Run working example");
    await expect(page.locator(".zero-achievement")).toHaveCount(0);
    await page.getByRole("button", { name: "6 cells", exact: true }).click();
    await runBeginner(page, "Run working example");
    await expect(page.locator(".zero-achievement")).toContainText("byte made its first rescue");
    const saved = await beginnerState(page);
    expect(saved.beginner).toMatchObject({ status: "complete", robotName: "byte", completed: [...BEGINNER_STEPS] });
    expect(saved.areas).toEqual(before);
    await page.getByRole("button", { name: "Explore the city", exact: true }).click();
    await expect(page.locator(".overlay")).toBeHidden();
    await openAdventureTool(page, "Progress");
    await expect(page.locator(".adventure-badge.earned").filter({ hasText: "Rescue Coder" })).toBeVisible();
    expect(errors).toEqual([]);
  });
}

test("chapter resumes after refresh, keeps its own drafts and restores them from a real downloaded backup", async ({
  page,
}) => {
  await seedBeginner(page, "javascript", "charge");
  const draft = "battery += 4;";
  await page.getByLabel("Beginner code", { exact: true }).fill(draft);
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await expect(page.locator(".zero-shell")).toHaveAttribute("data-beginner-step", "charge");
  await expect(page.getByLabel("Beginner code", { exact: true })).toHaveValue(draft);
  await page.getByRole("button", { name: "Ask for a clue", exact: true }).click();
  await expect(page.locator(".zero-hint")).toContainText("gap from 2 to 8");
  await page.getByRole("button", { name: "Ask for a clue", exact: true }).click();
  await page.getByRole("button", { name: "Ask for a clue", exact: true }).click();
  await expect(page.locator(".zero-hint")).toContainText("Add 6 cells");
  await expect(page.getByLabel("Beginner code", { exact: true })).toHaveValue(draft);
  await page.getByRole("button", { name: "Save & explore city", exact: true }).click();
  expect((await beginnerState(page)).beginner?.status).toBe("paused");
  await page.evaluate(() => {
    const original = URL.createObjectURL;
    URL.createObjectURL = (blob) => {
      (window as unknown as { __zeroBackup: Promise<string> }).__zeroBackup = (blob as Blob).text();
      return original(blob);
    };
  });
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  const download = page.waitForEvent("download");
  await openAdventureTool(page, "Save backup file");
  expect((await download).suggestedFilename()).toContain(".json");
  const source = await page.evaluate(() => (window as unknown as { __zeroBackup: Promise<string> }).__zeroBackup);
  expect(JSON.parse(source).state.beginner.drafts.charge).toBe(draft);
  const chooser = page.waitForEvent("filechooser");
  await openAdventureTool(page, "Load backup file");
  await (await chooser).setFiles({
    name: "robot-rescue.json",
    mimeType: "application/json",
    buffer: Buffer.from(source),
  });
  await expect(page.locator(".overlay")).toBeHidden();
  await openAdventureTool(page, "Start from zero");
  await expect(page.getByLabel("Beginner code", { exact: true })).toHaveValue(draft);
  const library = await page.evaluate(() => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}"));
  expect(library.adventures).toHaveLength(2);
  expect(library.adventures[0].adventureId).not.toBe(library.adventures[1].adventureId);
});

test("closing a running lesson cancels it and leaves the tablet ready for real code", async ({ page }) => {
  await seedBeginner(page);
  await page.getByLabel("Beginner code", { exact: true }).fill("while (true) {}");
  await page.getByRole("button", { name: "Test my rescue code", exact: true }).click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".zero-shell")).toHaveCount(0);
  await page.keyboard.press("t");
  await page.getByLabel("Practice code", { exact: true }).fill('console.log("Ready again");');
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await expect(page.getByLabel("Practice output", { exact: true })).toHaveText("Ready again\n", { timeout: 30_000 });
  expect((await beginnerState(page)).beginner?.completed).toHaveLength(5);
});
