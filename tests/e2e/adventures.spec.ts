import { expect, type Page, test } from "@playwright/test";
import { loadVariables } from "../../src/content/loader";
import { createGame } from "../../src/core/state";

test.use({ reducedMotion: "reduce" });
async function library(page: Page) {
  await page.getByRole("button", { name: "Menu", exact: true }).click();
  await page.getByRole("button", { name: "Switch adventure", exact: true }).click();
}
async function start(page: Page, lang: string, name: string) {
  await page.locator(`.language-grid [data-language="${lang}"]`).click();
  await page.getByRole("textbox", { name: "Developer name", exact: true }).fill(name);
  await page.getByRole("button", { name: /^Start (a new )?adventure$/ }).click();
}

test("switches between Java and two JavaScript adventures with independent progress and tablet drafts", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto("/");
  await start(page, "java", "Nova");
  await page.keyboard.press("t");
  const draft = 'public class Main { public static void main(String[] args) { System.out.println("Nova"); } }';
  await page.getByLabel("Practice code", { exact: true }).fill(draft);
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await expect(page.getByLabel("Practice output", { exact: true })).toHaveText("Nova\n", { timeout: 40_000 });
  await page.keyboard.press("Escape");
  await library(page);
  await page.getByRole("button", { name: "Start another adventure", exact: true }).click();
  await start(page, "javascript", "Ada");
  await page.getByRole("button", { name: "Progress", exact: true }).click();
  await page.getByRole("button", { name: /1\. Set your display name/ }).click();
  await page.getByLabel("Your code", { exact: true }).fill(loadVariables("javascript").tasks[0]?.solution ?? "");
  await page.getByRole("button", { name: "Submit answer", exact: true }).click();
  await expect(page.locator(".feedback.success")).toBeVisible();
  await page.keyboard.press("Escape");
  await page.keyboard.press("t");
  await page.getByLabel("Practice code", { exact: true }).fill('console.log("Ada draft");');
  await page.keyboard.press("Escape");
  await library(page);
  await page.getByRole("button", { name: "Start another adventure", exact: true }).click();
  await start(page, "javascript", "Ari");
  await expect(page.getByTestId("gems")).toContainText("0");
  await page.keyboard.press("t");
  await expect(page.getByLabel("Practice code", { exact: true })).not.toHaveValue('console.log("Ada draft");');
  await page.getByLabel("Practice code", { exact: true }).fill('console.log("Ari draft");');
  await page.keyboard.press("Escape");
  await page.reload();
  await expect(page.getByRole("heading", { name: "Your adventures · 3 saved" })).toBeVisible();
  await expect(page.locator(".title-adventure-row")).toHaveCount(3);
  await expect(page.locator(".title-language-saves")).toHaveCount(2);
  await page.getByRole("button", { name: "Manage adventures", exact: true }).click();
  await expect(page.locator(".adventure-card")).toHaveCount(3);
  for (const [name, language, code, gems] of [
    ["Nova", "Java", draft, "0"],
    ["Ada", "JavaScript", 'console.log("Ada draft");', "1"],
    ["Ari", "JavaScript", 'console.log("Ari draft");', "0"],
  ]) {
    await page.getByRole("button", { name: `Resume ${name} · ${language}`, exact: true }).click();
    await expect(page.locator(".hero-name")).toHaveText(name ?? "");
    await expect(page.getByTestId("gems")).toContainText(gems ?? "");
    await page.keyboard.press("t");
    await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue(code ?? "");
    await page.keyboard.press("Escape");
    await library(page);
  }
});

test("an existing version-one adventure and practice draft remain available after starting another", async ({
  page,
}) => {
  const state = createGame("javascript", { kind: "boy", name: "Legacy" }, "2026-10-22T12:00:00Z");
  await page.goto("/");
  await page.evaluate((state) => {
    localStorage.setItem("codequest:v1:javascript", JSON.stringify(state));
    localStorage.setItem("codequest:tablet:v1:javascript", 'console.log("original");');
  }, state);
  await page.reload();
  await start(page, "javascript", "Newcomer");
  await library(page);
  await page.getByRole("button", { name: "Resume Legacy · JavaScript", exact: true }).click();
  await page.keyboard.press("t");
  await expect(page.getByLabel("Practice code", { exact: true })).toHaveValue('console.log("original");');
  await page.keyboard.press("Escape");
  await library(page);
  await expect(page.locator(".adventure-card")).toHaveCount(2);
});
