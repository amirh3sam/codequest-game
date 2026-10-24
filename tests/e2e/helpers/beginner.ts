import { expect, type Page } from "@playwright/test";
import { ADVENTURES_KEY } from "../../../src/core/adventures";
import {
  BEGINNER_STEPS,
  type BeginnerStep,
  completeBeginnerStep,
  createBeginnerProgress,
} from "../../../src/core/beginner";
import { createGame, type GameState } from "../../../src/core/state";
import type { Lang } from "../../../src/runners/types";

export async function seedBeginner(page: Page, lang: Lang = "javascript", step: BeginnerStep = "rescue") {
  let progress = createBeginnerProgress();
  const index = BEGINNER_STEPS.indexOf(step);
  for (const id of BEGINNER_STEPS.slice(0, index)) progress = completeBeginnerStep(progress, id);
  progress.step = index;
  progress.robotName = "byte";
  const state: GameState = {
    ...createGame(lang, { name: "Ada", kind: "girl" }, new Date().toISOString()),
    adventureId: `zero-${lang}`,
    training: { districts: [] },
    beginner: progress,
  };
  await page.goto("/");
  await page.evaluate(
    ({ key, state }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [state] })),
    { key: ADVENTURES_KEY, state },
  );
  await page.reload();
  await page.locator(".title-adventure-row").first().click();
  await expect(page.locator(".zero-shell")).toHaveAttribute("data-beginner-step", step);
}
export async function beginnerState(page: Page): Promise<GameState> {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").adventures[0], ADVENTURES_KEY);
}
export async function nextBeginner(page: Page, step: BeginnerStep) {
  await page.getByRole("button", { name: "Next lesson →", exact: true }).click();
  await expect(page.locator(".zero-shell")).toHaveAttribute("data-beginner-step", step);
}
export async function runBeginner(page: Page, label: string) {
  const run = page.getByRole("button", { name: label, exact: true });
  await run.click();
  await expect(run).toBeEnabled({ timeout: 60_000 });
}
