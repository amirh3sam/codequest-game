import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4317",
    trace: "on-first-retry",
    // Existing journeys represent players who chose to skip the optional tour.
    // training.spec.ts uses an empty browser to exercise first-visit behavior.
    storageState: {
      cookies: [],
      origins: [
        {
          origin: "http://localhost:4317",
          localStorage: [
            {
              name: "codequest:training:v1",
              value: JSON.stringify({
                version: 1,
                welcome: "skipped",
                chapter: "welcome",
                completed: [],
                autoDistricts: false,
              }),
            },
          ],
        },
      ],
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    {
      name: "mobile-webkit",
      testMatch: ["**/mobile-runner.spec.ts", "**/training-mobile.spec.ts"],
      use: { ...devices["iPhone 13"], browserName: "webkit" },
    },
  ],
  webServer: {
    command: "npm run build:e2e && npm run preview -- --port 4317 --strictPort",
    url: "http://localhost:4317",
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
