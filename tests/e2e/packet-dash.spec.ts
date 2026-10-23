import { expect, test } from "@playwright/test";

type Harness = { __codequest: { position(): { x: number; y: number } } };

test.use({ reducedMotion: "reduce" });

test("finds the city arcade and plays a round of Packet Dash", async ({ page }, testInfo) => {
  test.setTimeout(60_000);
  await page.goto("/");
  await page.locator('[data-language="javascript"]').click();
  await page.getByLabel("Developer name").fill("Runner");
  await page.getByRole("button", { name: "Start adventure" }).click();

  const position = () => page.evaluate(() => (window as unknown as Harness).__codequest.position());
  await expect.poll(async () => (await position()).y).toBeGreaterThan(600);

  // Walk the west path around the guide stand, staying within the real collision map.
  await page.keyboard.down("w");
  await expect.poll(async () => (await position()).y).toBeLessThan(400);
  await page.keyboard.up("w");
  await page.keyboard.down("d");
  await expect.poll(async () => Math.hypot((await position()).x - 211, (await position()).y - 350)).toBeLessThan(68);
  await page.keyboard.up("d");
  await expect.poll(async () => Math.hypot((await position()).x - 211, (await position()).y - 350)).toBeLessThan(68);
  await page.addStyleTag({ content: ".toast { display: none !important; }" });
  await page.screenshot({ path: testInfo.outputPath("codequest-arcade-map.png") });
  await page.keyboard.press("e");

  await expect(page.getByRole("heading", { name: "Packet Dash" })).toBeVisible();
  await expect(page.getByLabel(/Packet Dash runner/)).toBeVisible();
  await page.getByRole("button", { name: "Start 60-second run" }).click();
  await expect(page.locator(".arcade-feedback")).toContainText("Run!");
  await page.locator(".packet-dash").screenshot({ path: testInfo.outputPath("packet-dash-view.png") });
  await page.keyboard.press("Space");
  await expect(page.locator(".arcade-feedback")).toContainText("jump");
  await expect(page.locator(".arcade-score")).toContainText("SCORE");
});
