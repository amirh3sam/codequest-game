import { expect, test } from "@playwright/test";

type AudioProbe = { contexts: number; starts: { frequency: number; type: OscillatorType }[]; ended: number };
type ProbeWindow = Window & { audioProbe: AudioProbe };
test.use({ reducedMotion: "reduce" });

test("effects unlock on interaction, follow walking, stop when muted and remember the preference", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    const probe: AudioProbe = { contexts: 0, starts: [], ended: 0 };
    (window as unknown as ProbeWindow).audioProbe = probe;
    const NativeAudioContext = window.AudioContext;
    window.AudioContext = class extends NativeAudioContext {
      constructor(options?: AudioContextOptions) {
        super(options);
        probe.contexts++;
      }
      override createOscillator(): OscillatorNode {
        const node = super.createOscillator(),
          start = node.start.bind(node);
        node.start = (when?: number) => {
          probe.starts.push({ frequency: node.frequency.value, type: node.type });
          start(when);
        };
        node.addEventListener("ended", () => probe.ended++);
        return node;
      }
    };
  });
  const probe = () => page.evaluate(() => (window as unknown as ProbeWindow).audioProbe);
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Mute sound effects", exact: true })).toBeVisible();
  expect((await probe()).contexts).toBe(0);
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.keyboard.down("d");
  await page.waitForTimeout(500);
  await page.keyboard.up("d");
  expect((await probe()).contexts).toBe(1);
  expect((await probe()).starts.some((note) => note.type === "sine")).toBe(true);
  await page.getByRole("button", { name: "Tablet", exact: true }).click();
  await page.getByLabel("Practice code", { exact: true }).fill("console.log(42);");
  await page.getByRole("button", { name: "Run practice code", exact: true }).click();
  await expect(page.getByLabel("Practice output", { exact: true })).toHaveText("42\n");
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "Mute sound effects", exact: true }).click();
  await expect
    .poll(async () => {
      const p = await probe();
      return p.ended === p.starts.length;
    })
    .toBe(true);
  const mutedCount = (await probe()).starts.length;
  await page.keyboard.down("d");
  await page.waitForTimeout(350);
  await page.keyboard.up("d");
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  expect((await probe()).starts.length).toBe(mutedCount);
  await page.reload();
  await expect(page.getByRole("button", { name: "Enable sound effects", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Continue adventure", exact: true }).click();
  expect((await probe()).contexts).toBe(0);
  await page.getByRole("button", { name: "Enable sound effects", exact: true }).click();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect.poll(async () => (await probe()).starts.length).toBeGreaterThan(0);
  expect((await probe()).contexts).toBe(1);
  expect(errors).toEqual([]);
});

test("missing audio support leaves the game and preference controls usable", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(window, "AudioContext", { value: undefined }));
  await page.goto("/");
  await page.getByRole("button", { name: "Start adventure", exact: true }).click();
  await page.getByRole("button", { name: "Mute sound effects", exact: true }).click();
  await page.getByRole("button", { name: "Enable sound effects", exact: true }).click();
  await page.getByRole("button", { name: "Tasks", exact: true }).click();
  await expect(page.getByRole("heading", { name: "District missions", exact: true })).toBeVisible();
});
