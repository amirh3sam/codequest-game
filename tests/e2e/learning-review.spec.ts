import { expect, test } from "@playwright/test";
import { reviewLesson } from "../../src/core/learning-review";
import { openAdventureTool } from "./helpers/adventure-tools";

test.use({ reducedMotion: "reduce" });
for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: reviews reject fixed answers, verify fresh inputs and preserve personal drafts`, async ({
    page,
  }, info) => {
    test.setTimeout(180000);
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.locator(`.language-grid [data-language="${lang}"]`).click();
    await page.getByRole("button", { name: "Start adventure", exact: true }).click();
    const hub = async () => {
      await openAdventureTool(page, "Learning adventures");
      await page.getByRole("button", { name: "Open 6 · Review adventures", exact: true }).click();
    };
    const run = async () => {
      const b = page.getByRole("button", { name: "Test my review repair", exact: true });
      await b.click();
      await expect(page.locator(".zero-feedback")).not.toContainText(/Checking/, { timeout: 90000 });
    };
    await hub();
    await page.getByRole("button", { name: "Review variables", exact: true }).click();
    const wrong = `parcels = 99${lang === "python" ? "" : ";"}`;
    await page.getByLabel("Review repair code", { exact: true }).fill(wrong);
    await run();
    await expect(page.locator(".review-scene")).toHaveClass(/review-bad/);
    await page.reload();
    await page.locator(".title-adventure-row").first().click();
    await hub();
    await expect(page.locator("[data-review-topic]").first()).toHaveAttribute("data-review-topic", "variables");
    await expect(page.locator("[data-review-topic='variables']")).toContainText("AN IDEA TO REVISIT");
    await page.getByRole("button", { name: "Review variables", exact: true }).click();
    await expect(page.getByLabel("Review repair code", { exact: true })).toHaveValue(wrong);
    await page.getByLabel("Review repair code", { exact: true }).fill(reviewLesson("variables", 0, lang).solution);
    await run();
    await expect(page.locator(".zero-feedback")).toContainText("Review complete");
    await page.getByRole("button", { name: "Try a new example", exact: true }).click();
    await expect(page.getByRole("heading", { name: "Library returns", exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Review adventures", exact: true }).click();
    for (const topic of ["conditions", "loops"] as const) {
      await page.getByRole("button", { name: `Review ${topic}`, exact: true }).click();
      const lesson = reviewLesson(topic, 0, lang);
      const draft =
        topic === "conditions"
          ? "temperature > limit "
          : lang === "python"
            ? "print(1)\nprint(2)\nprint(3)"
            : lang === "java"
              ? "System.out.println(1);\nSystem.out.println(2);\nSystem.out.println(3);"
              : "console.log(1);\nconsole.log(2);\nconsole.log(3);";
      await page.getByLabel("Review repair code", { exact: true }).fill(draft);
      await run();
      await expect(page.locator(".review-scene")).toHaveClass(/review-bad/);
      await page.getByLabel("Review repair code", { exact: true }).fill(lesson.solution);
      await run();
      await expect(page.locator(".zero-feedback")).toContainText("Review complete");
      if (topic === "conditions") {
        await page.getByRole("button", { name: "Replay Occupied room · 5°", exact: true }).click();
        await expect(page.locator(".review-scene")).toHaveClass(/review-cooling/);
        await page.screenshot({ path: info.outputPath("review-cooling.png") });
      }
      await page.getByRole("button", { name: "Review adventures", exact: true }).click();
    }
    const state = await page.evaluate(
      () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0],
    );
    for (const topic of ["variables", "conditions", "loops"]) {
      expect(state.journey.reviews[topic]).toMatchObject({ wins: 1, variant: 1, needsReview: false, misses: 1 });
    }
    expect(state.areas.variables.solved).toEqual([]);
    expect(state.areas.variables.hearts).toBe(3);
    expect(errors).toEqual([]);
  });
}
test("a wrong Smart Gate prediction recommends conditions and syntax errors leave its need unchanged", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await openAdventureTool(page, "Learning adventures");
  await page.getByRole("button", { name: "Open 2 · The Smart Gate", exact: true }).click();
  const gateRun = page.getByRole("button", { name: "Run gate example", exact: true });
  await gateRun.click();
  await expect(gateRun).toBeEnabled();
  await page.getByRole("button", { name: "Next lesson →", exact: true }).click();
  await page.getByRole("button", { name: "Predict OPEN", exact: true }).click();
  await gateRun.click();
  await expect(gateRun).toBeEnabled();
  await page.getByRole("button", { name: "Save & explore city", exact: true }).click();
  await openAdventureTool(page, "Learning adventures");
  await page.getByRole("button", { name: "Open 6 · Review adventures", exact: true }).click();
  await expect(page.locator("[data-review-topic]").first()).toHaveAttribute("data-review-topic", "conditions");
  await page.getByRole("button", { name: "Review conditions", exact: true }).click();
  await page.getByLabel("Review repair code", { exact: true }).fill(") invalid");
  const run = page.getByRole("button", { name: "Test my review repair", exact: true });
  await run.click();
  await expect(run).toBeEnabled();
  const review = await page.evaluate(
    () => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0].journey.reviews.conditions,
  );
  expect(review.misses).toBe(1);
  expect(review.needsReview).toBe(true);
});
