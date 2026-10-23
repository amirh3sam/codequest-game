import { expect, it } from "vitest";
import { TABLET_ART, tabletFrame } from "../../src/game/tablet-frame";
import { TABLET_SHOT_MS, tabletMotion } from "../../src/game/tablet-motion";

it("zooms through the city before a first-person look down and screen entry", () => {
  expect([-50, 800, 1400, 2400, TABLET_SHOT_MS].map((time) => tabletMotion(time).phase)).toEqual([
    "approach",
    "first-person",
    "look",
    "enter",
    "ready",
  ]);
  expect(tabletMotion(-10).lift).toBe(0);
  expect(tabletMotion(500).reveal).toBe(0);
  expect(tabletMotion(800).reveal).toBe(1);
  expect(tabletMotion(600).enter).toBe(0);
  expect(tabletMotion(3000).lift).toBe(1);
  expect(tabletMotion(3000).gaze).toBe(1);
  expect(tabletMotion(TABLET_SHOT_MS).enter).toBe(1);
  for (let time = 0; time <= TABLET_SHOT_MS; time += 37) {
    const state = tabletMotion(time);
    for (const value of [state.reveal, state.lift, state.gaze, state.touch, state.enter, state.screen]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  }
});

for (const [width, height] of [
  [1440, 900],
  [390, 844],
  [1024, 768],
  [844, 390],
]) {
  it(`${width}x${height}: keeps the illustrated sleeve in frame and enters a screen covering the viewport`, () => {
    const resting = tabletFrame(width, height, tabletMotion(1450));
    const artBottom = resting.y + (TABLET_ART.height - resting.pivotY) * resting.scale;
    expect(artBottom).toBeGreaterThan(height);
    const final = tabletFrame(width, height, tabletMotion(TABLET_SHOT_MS));
    const left = final.x + (TABLET_ART.screen.x - final.pivotX) * final.scale;
    const top = final.y + (TABLET_ART.screen.y - final.pivotY) * final.scale;
    expect(left).toBeLessThanOrEqual(0);
    expect(top).toBeLessThanOrEqual(0);
    expect(left + TABLET_ART.screen.width * final.scale).toBeGreaterThanOrEqual(width);
    expect(top + TABLET_ART.screen.height * final.scale).toBeGreaterThanOrEqual(height);
    expect(TABLET_ART.screen.x + TABLET_ART.screen.width).toBeLessThan(TABLET_ART.width);
    expect(TABLET_ART.screen.y + TABLET_ART.screen.height).toBeLessThan(TABLET_ART.height);
  });
}
