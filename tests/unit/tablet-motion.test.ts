import * as THREE from "three";
import { expect, it } from "vitest";
import { TABLET_SHOT_MS, tabletMotion } from "../../src/game/tablet-motion";
import { createTabletRig } from "../../src/game/tablet-rig";

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

for (const kind of ["boy", "girl"] as const) {
  it(`${kind}: keeps the wrist screen facing the wearer's eyes and both hands attached`, () => {
    const texture = new THREE.Texture(),
      rig = createTabletRig(kind, texture);
    rig.pose(tabletMotion(0));
    rig.pose(tabletMotion(1400));
    const raised = rig.screen.getWorldPosition(new THREE.Vector3());
    expect(rig.device.parent).toBe(rig.left.elbow);
    expect(rig.root.children).toEqual([rig.left.shoulder, rig.right.shoulder]);
    expect(raised.z).toBeGreaterThan(rig.eye.z);
    expect(raised.y).toBeLessThan(rig.eye.y);
    const screenNormal = new THREE.Vector3(0, 0, 1).transformDirection(rig.screen.matrixWorld);
    expect(screenNormal.dot(rig.eye.clone().sub(raised).normalize())).toBeGreaterThan(0.8);
    for (const time of [0, 700, 1400, TABLET_SHOT_MS]) {
      rig.pose(tabletMotion(time));
      for (const arm of [rig.left, rig.right]) {
        const shoulder = arm.shoulder.getWorldPosition(new THREE.Vector3()),
          elbow = arm.elbow.getWorldPosition(new THREE.Vector3()),
          hand = arm.hand.getWorldPosition(new THREE.Vector3());
        expect(shoulder.distanceTo(elbow)).toBeCloseTo(0.39);
        expect(elbow.distanceTo(hand)).toBeCloseTo(0.38);
      }
    }
    rig.root.traverse((node) => {
      if (!(node instanceof THREE.Mesh)) return;
      node.geometry.dispose();
      for (const surface of Array.isArray(node.material) ? node.material : [node.material]) surface.dispose();
    });
    texture.dispose();
  });
}
