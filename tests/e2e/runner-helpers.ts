import type { Browser, Page } from "@playwright/test";

export type Result = {
  stdout: string;
  stderr: string;
  compileErrors?: { line: number; column?: number; message: string }[];
  runtimeError?: string;
  timedOut?: "compile" | "run";
  runnerError?: string;
  compileMs?: number;
  runMs: number;
};

type Runner = { warmup(): Promise<void>; run(code: string, stdin?: string): Promise<Result> };
type TestWindow = Window & {
  __cqRunner: Runner;
  __codequest: {
    createRunner(lang: string): Runner;
    game: { scene: { isActive(key: string): boolean }; loop: { sleep(): void } };
  };
};

/** Opens the game in a new page, creates a warm runner for `lang`, and returns a `run` helper. */
export async function openRunner(browser: Browser, lang: string) {
  const page: Page = await browser.newPage();
  await page.goto("/");
  await page.waitForFunction(() => (window as unknown as TestWindow).__codequest?.game.scene.isActive("boot"));
  // These tests exercise real workers, so keep the completed scene still instead
  // of spending compiler CPU on the title screen's continuous rendering.
  await page.evaluate(() => (window as unknown as TestWindow).__codequest.game.loop.sleep());
  const warmMs = await page.evaluate(async (l) => {
    const w = window as unknown as TestWindow;
    w.__cqRunner = w.__codequest.createRunner(l);
    const t = performance.now();
    await w.__cqRunner.warmup();
    return performance.now() - t;
  }, lang);
  console.log(`[${lang}] runtime load: ${Math.round(warmMs)} ms`);
  const run = (code: string, stdin?: string) =>
    page.evaluate(([c, s]) => (window as unknown as TestWindow).__cqRunner.run(c, s), [code, stdin] as const);
  return { page, run };
}
