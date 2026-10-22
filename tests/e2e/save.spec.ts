import { expect, test } from "@playwright/test";

type SaveWindow = Window & {
  __codequest: Pick<typeof import("../../src/core/save"), "loadGame" | "saveGame"> &
    Pick<typeof import("../../src/core/state"), "createGame">;
};

test("language slots retain progress after a browser reload", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => "__codequest" in window);
  const before = await page.evaluate(() => {
    const { createGame, saveGame } = (window as unknown as SaveWindow).__codequest;
    return ["java", "javascript", "typescript", "python"].map((language) => {
      const lang = language as "java" | "javascript" | "typescript" | "python";
      const base = createGame(lang, { kind: "girl", name: "Ada" }, "2026-10-21T18:00:00.000Z");
      const state = {
        ...base,
        position: { x: 64, y: 96 },
        areas: {
          ...base.areas,
          variables: {
            ...base.areas.variables,
            solved: ["variables-1"],
            gems: 1,
            hearts: 2,
            lessonsFound: true,
            drafts: { "variables-2": "console.log('saved');" },
          },
        },
      };
      return { state, result: saveGame(state) };
    });
  });
  expect(before.map((entry) => entry.result)).toEqual(Array.from({ length: 4 }, () => ({ status: "saved" })));

  await page.reload();
  await page.waitForFunction(() => "__codequest" in window);
  const after = await page.evaluate(() => {
    const { loadGame } = (window as unknown as SaveWindow).__codequest;
    return (["java", "javascript", "typescript", "python"] as const).map((lang) => loadGame(lang));
  });
  expect(after).toEqual(before.map(({ state }) => ({ status: "loaded", state })));
});

test("corrupt and unsupported saves are preserved without affecting another language", async ({ page }) => {
  await page.goto("/");
  await page.waitForFunction(() => "__codequest" in window);
  const result = await page.evaluate(() => {
    const { createGame, loadGame, saveGame } = (window as unknown as SaveWindow).__codequest;
    const python = createGame("python", { kind: "boy", name: "Linus" }, "2026-10-21T18:00:00.000Z");
    const saved = saveGame(python);
    localStorage.setItem("codequest:v1:java", "{");
    const unsupported = JSON.stringify({ version: 99 });
    localStorage.setItem("codequest:v1:typescript", unsupported);
    return {
      saved,
      corrupt: loadGame("java"),
      unsupported: loadGame("typescript"),
      untouchedCorrupt: localStorage.getItem("codequest:v1:java"),
      untouchedVersion: localStorage.getItem("codequest:v1:typescript"),
      python: loadGame("python"),
      expectedPython: python,
    };
  });
  expect(result.saved).toEqual({ status: "saved" });
  expect(result.corrupt).toEqual({ status: "corrupt" });
  expect(result.unsupported).toEqual({ status: "unsupported-version", version: 99 });
  expect(result.untouchedCorrupt).toBe("{");
  expect(result.untouchedVersion).toBe('{"version":99}');
  expect(result.python).toEqual({ status: "loaded", state: result.expectedPython });
});
