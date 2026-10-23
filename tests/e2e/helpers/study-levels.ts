import type { Page } from "@playwright/test";
import { loadArea } from "../../../src/content/loader";
import { ADVENTURES_KEY } from "../../../src/core/adventures";
import { AREA_IDS } from "../../../src/core/rules";
import { createAreaState, createGame } from "../../../src/core/state";
import type { Lang } from "../../../src/runners/types";

export async function startAfterAbstractionCloud(page: Page, lang: Lang): Promise<void> {
  const base = createGame(lang, { kind: "girl", name: "Nova" }, new Date().toISOString());
  const areas = Object.fromEntries(
    AREA_IDS.map((id) => {
      const solved =
        id === "variables" || id === "conditions"
          ? loadArea(lang, id).tasks.map(({ id: taskId }) => taskId)
          : Array.from({ length: 8 }, (_, index) => `${id}-task-${index + 1}`);
      return [id, { ...createAreaState(), solved, bossDefeated: true }];
    }),
  ) as unknown as typeof base.areas;
  const state = { ...base, adventureId: `study-${lang}-level-gates`, areas };
  await page.goto("/");
  await page.evaluate(
    ({ key, game }) => localStorage.setItem(key, JSON.stringify({ version: 1, adventures: [game] })),
    { key: ADVENTURES_KEY, game: state },
  );
  await page.reload();
  await page.locator(".title-adventure-row").filter({ hasText: "Nova" }).first().click();
}
