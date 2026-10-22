import { expect, test } from "@playwright/test";
import { loadVariables } from "../../src/content/loader";
import { grade } from "../../src/grader/grade";
import { openRunner } from "./runner-helpers";

// Compile the large language runtimes one at a time; other UI files can still run in parallel.
test.describe.configure({ mode: "default" });

for (const lang of ["javascript", "typescript", "python", "java"] as const) {
  test(`${lang}: all village solutions pass the real runner and grader`, async ({ browser }) => {
    test.setTimeout(120_000);
    const { page, run } = await openRunner(browser, lang);
    try {
      const area = loadVariables(lang);
      const runner = { run: async (code: string, stdin?: string) => ({ ...(await run(code, stdin)), id: 0 }) };
      for (const task of [...area.tasks, area.boss]) {
        const result = await grade(task, task.solution, runner);
        expect(result.passed, `${task.id}: ${result.message}\n${result.output}`).toBe(true);
      }
    } finally {
      await page.close();
    }
  });
}
