import type { Page } from "@playwright/test";

/** Rotate with viewport emulation rather than native fullscreen window bounds. */
export async function emulateManualRotation(page: Page): Promise<void> {
  await page.addInitScript(() =>
    Object.defineProperty(screen.orientation, "lock", { configurable: true, value: undefined }),
  );
}
