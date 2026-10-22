import * as THREE from "three";
import { expect, it } from "vitest";
import { TABLET_SHOT_MS, tabletMotion } from "../../src/game/tablet-motion";
import { createTabletRig } from "../../src/game/tablet-rig";

it("orders the camera approach, arm raise, gaze and screen entry without frame-rate dependence", () => {
  expect([-50, 900, 2300, 3700, TABLET_SHOT_MS].map((time) => tabletMotion(time).phase)).toEqual([
    "approach",
    "raise",
    "look",
    "enter",
    "ready",
  ]);
  expect(tabletMotion(-10).lift).toBe(0);
  expect(tabletMotion(600).enter).toBe(0);
  expect(tabletMotion(3000).lift).toBe(1);
  expect(tabletMotion(3000).gaze).toBe(1);
  expect(tabletMotion(TABLET_SHOT_MS).enter).toBe(1);
  for (let time = 0; time <= TABLET_SHOT_MS; time += 37) {
    const state = tabletMotion(time);
    for (const value of [
      state.reveal,
      state.approach,
      state.lift,
      state.gaze,
      state.touch,
      state.enter,
      state.screen,
    ]) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    }
  }
});

for (const kind of ["boy", "girl"] as const) {
  it(`${kind}: raises an attached device and turns the face toward its visible screen`, () => {
    const texture = new THREE.Texture(),
      rig = createTabletRig(kind, texture);
    rig.pose(tabletMotion(0));
    const resting = rig.screen.getWorldPosition(new THREE.Vector3());
    rig.pose(tabletMotion(2600));
    const raised = rig.screen.getWorldPosition(new THREE.Vector3());
    expect(raised.y).toBeGreaterThan(resting.y + 0.3);
    expect(rig.device.parent).toBe(rig.left.elbow);
    const face = rig.head.localToWorld(new THREE.Vector3(0, 0.17, 0.21));
    const gaze = new THREE.Vector3(0, 0, 1).transformDirection(rig.head.matrixWorld);
    const towardScreen = raised.clone().sub(face).normalize();
    expect(gaze.dot(towardScreen)).toBeGreaterThan(0.8);
    const screenNormal = new THREE.Vector3(0, 0, 1).transformDirection(rig.screen.matrixWorld);
    expect(screenNormal.dot(face.clone().sub(raised).normalize())).toBeGreaterThan(0);
    for (const time of [0, 1000, 2000, 3500]) {
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
