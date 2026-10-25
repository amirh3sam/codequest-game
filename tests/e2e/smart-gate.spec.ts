import { expect, test } from "@playwright/test";
import { openAdventureTool } from "./helpers/adventure-tools";

test.use({ reducedMotion: "reduce" });
test.setTimeout(180_000);
for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: Smart Gate teaches branches and verifies delivery badges with real programs`, async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/");
    await page.locator(`.language-grid [data-language="${lang}"]`).click();
    await page.getByRole("button", { name: "Start adventure", exact: true }).click();
    await openAdventureTool(page, "Learning adventures");
    await page.getByRole("button", { name: "Open 2 · The Smart Gate", exact: true }).click();
    const read = () =>
      page.evaluate(() => JSON.parse(localStorage.getItem("codequest:adventures:v1") ?? "{}").adventures[0]);
    const before = (await read()).areas;
    const run = async (label: string) => {
      const control = page.getByRole("button", { name: label, exact: true });
      await control.click();
      await expect(control).toBeEnabled({ timeout: 90_000 });
    };
    const next = async (id: string) => {
      await page.getByRole("button", { name: "Next lesson →", exact: true }).click();
      await expect(page.locator(".zero-shell")).toHaveAttribute("data-lesson", id);
    };
    await run("Run gate example");
    await expect(page.locator(".gate-scene")).toHaveClass(/gate-open/);
    await next("predict");
    await page.getByRole("button", { name: "Predict OPEN", exact: true }).click();
    await run("Run gate example");
    await expect(page.locator(".zero-feedback")).toContainText("program printed CLOSED");
    await next("branches");
    for (let i = 0; i < 3; i++)
      await page.getByRole("button", { name: "Step through the decision", exact: true }).click();
    await page.getByRole("button", { name: "The else branch", exact: true }).click();
    await next("modify");
    await run("Test gate condition");
    await expect(page.locator(".gate-results")).toContainText("4 cells: CLOSED · expected OPEN");
    await expect(page.locator(".gate-scene")).toHaveClass(/gate-unsafe/);
    await expect(page.getByRole("button", { name: "Next lesson →", exact: true })).toBeDisabled();
    await page.getByLabel("Gate condition", { exact: true }).fill("battery >= 4");
    await run("Test gate condition");
    await next("challenge");
    await run("Test gate condition");
    await expect(page.locator(".gate-results")).toContainText("Visitor · 6 cells: OPEN · expected CLOSED");
    await expect(page.locator(".lesson-finished")).toHaveCount(0);
    await page
      .getByLabel("Gate condition", { exact: true })
      .fill(lang === "python" ? "isDelivery and battery >= 4" : "isDelivery && battery >= 4");
    await run("Test gate condition");
    await expect(page.locator(".lesson-finished")).toContainText("Gatekeeper earned");
    const saved = await read();
    expect(saved.journey.gate.status).toBe("complete");
    expect(saved.areas).toEqual(before);
    await page.reload();
    await page.locator(".title-adventure-row").first().click();
    await openAdventureTool(page, "Learning adventures");
    await page.getByRole("button", { name: "Open 2 · The Smart Gate", exact: true }).click();
    await expect(page.locator(".lesson-finished")).toContainText("Gatekeeper earned");
    expect(errors).toEqual([]);
  });
}
