import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { createTabletArm, sleeveWeave } from "./tablet-hands";
import type { tabletMotion } from "./tablet-motion";

export type DeveloperKind = "boy" | "girl";
type Motion = ReturnType<typeof tabletMotion>;

function material(color: number, metalness = 0, roughness = 0.8) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness });
}
function box(
  parent: THREE.Object3D,
  size: [number, number, number],
  position: [number, number, number],
  surface: THREE.Material,
  radius = 0.04,
) {
  const mesh = new THREE.Mesh(new RoundedBoxGeometry(...size, 2, radius), surface);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}
function sphere(
  parent: THREE.Object3D,
  scale: [number, number, number],
  position: [number, number, number],
  surface: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), surface);
  mesh.scale.set(...scale);
  mesh.position.set(...position);
  parent.add(mesh);
  return mesh;
}

/** Solve the support arm to the bezel while retaining both real joint lengths. */
function gripTablet(arm: ReturnType<typeof createTabletArm>, screen: THREE.Mesh, touch: number) {
  const wrist = screen.localToWorld(new THREE.Vector3(0.29, -0.25, 0.035));
  const shoulder = arm.shoulder.position;
  const direction = wrist.clone().sub(shoulder);
  const distance = THREE.MathUtils.clamp(direction.length(), 0.02, 0.769);
  direction.normalize();
  const pole = new THREE.Vector3(0, -1, -0.4);
  pole.addScaledVector(direction, -pole.dot(direction)).normalize();
  const along = (0.39 ** 2 - 0.38 ** 2 + distance ** 2) / (2 * distance);
  const elbow = shoulder
    .clone()
    .addScaledVector(direction, along)
    .addScaledVector(pole, Math.sqrt(Math.max(0, 0.39 ** 2 - along ** 2)));
  const down = new THREE.Vector3(0, -1, 0);
  arm.shoulder.quaternion.setFromUnitVectors(down, elbow.clone().sub(shoulder).normalize());
  const forearm = new THREE.Quaternion().setFromUnitVectors(down, wrist.sub(elbow).normalize());
  arm.elbow.quaternion.copy(arm.shoulder.quaternion).invert().multiply(forearm);
  const hand = screen.getWorldQuaternion(new THREE.Quaternion());
  hand.multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(touch * 0.03, 0, Math.PI)));
  arm.hand.quaternion.copy(forearm).invert().multiply(hand);
}

export function createTabletDisplay(name: string): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 640;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tablet screen needs a canvas");
  ctx.fillStyle = "#071b29";
  ctx.fillRect(0, 0, 1024, 640);
  ctx.fillStyle = "#193748";
  ctx.fillRect(0, 0, 1024, 92);
  ctx.fillStyle = "#8ae8ff";
  ctx.font = "bold 26px monospace";
  ctx.fillText("CODEQUEST / FIELD LINK", 40, 56);
  ctx.fillStyle = "#a4c7d6";
  ctx.font = "20px monospace";
  ctx.fillText(name.toUpperCase(), 720, 55, 265);
  ctx.fillStyle = "#153143";
  ctx.fillRect(0, 94, 210, 490);
  ctx.fillStyle = "#73e4cf";
  ctx.font = "17px monospace";
  ctx.fillText("EXPLORER", 26, 140);
  ctx.fillStyle = "#8db4c9";
  ctx.fillText("practice", 26, 195);
  ctx.fillText("missions", 26, 245);
  ctx.fillText("city network", 26, 295);
  ctx.fillStyle = "#9decff";
  ctx.font = "22px monospace";
  ctx.fillText("// Your ideas start here", 248, 160);
  ctx.fillText('const message = "Hello, city!";', 248, 223);
  ctx.fillStyle = "#7de4b8";
  ctx.fillText("console.log(message);", 248, 275);
  ctx.fillStyle = "#274558";
  ctx.fillRect(242, 338, 720, 2);
  ctx.fillStyle = "#8ae8ff";
  ctx.font = "18px monospace";
  ctx.fillText("PERSONAL WORKSPACE / CONNECTED", 248, 392);
  ctx.fillStyle = "#77ebc4";
  for (let i = 0; i < 12; i++) ctx.fillRect(250 + i * 54, 452, 40, 9);
  ctx.fillStyle = "#16364b";
  ctx.fillRect(0, 584, 1024, 56);
  ctx.fillStyle = "#9ed3e2";
  ctx.font = "18px monospace";
  ctx.fillText("EDITOR     EXAMPLES     CONSOLE", 36, 620);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTabletRig(kind: DeveloperKind, texture: THREE.Texture) {
  const root = new THREE.Group();
  root.name = `first-person-${kind}`;
  const cloth = material(kind === "girl" ? 0x47385e : 0x24485b, 0, 0.96),
    darkCloth = material(kind === "girl" ? 0x241b34 : 0x102634, 0, 0.95);
  cloth.map = darkCloth.map = sleeveWeave();
  const skin = material(0xb98261, 0, 0.76),
    nail = material(0xcda58a, 0, 0.63),
    strap = material(0x101a22, 0, 0.9);
  const deviceMetal = material(0x17232f, 0.65, 0.4),
    lightMetal = material(0x526779, 0.7, 0.32);
  const cyan = new THREE.MeshBasicMaterial({ color: 0x73d8e7, toneMapped: false });
  const left = createTabletArm(root, 0.39, cloth, darkCloth, skin, nail),
    right = createTabletArm(root, -0.39, cloth, darkCloth, skin, nail);
  left.shoulder.name = "tablet-shoulder";
  left.elbow.name = "tablet-forearm";
  const device = new THREE.Group();
  device.name = "wrist-tablet";
  device.position.set(0, -0.22, 0.125);
  device.rotation.set(-0.85, -0.6, Math.PI);
  left.elbow.add(device);
  box(device, [0.585, 0.386, 0.022], [0, 0, 0], lightMetal, 0.018);
  box(device, [0.575, 0.376, 0.012], [0, 0, 0.012], deviceMetal, 0.018);
  box(device, [0.536, 0.344, 0.006], [0, 0, 0.021], strap, 0.012);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 0.319), screenMaterial);
  screen.position.z = 0.025;
  screen.name = "tablet-screen";
  device.add(screen);
  sphere(device, [0.0045, 0.0045, 0.002], [0, 0.178, 0.02], strap);
  box(device, [0.019, 0.003, 0.002], [-0.25, 0.178, 0.021], cyan, 0.001);
  box(device, [0.004, 0.052, 0.009], [0.294, 0.035, 0], lightMetal, 0.002);
  for (let i = 0; i < 4; i++) box(device, [0.002, 0.009, 0.008], [-0.294, -0.05 + i * 0.017, 0], strap, 0.001);
  // The adjustable cradle meets two bands wrapped around the actual forearm.
  box(device, [0.16, 0.17, 0.052], [0, 0, -0.033], deviceMetal, 0.015);
  box(left.elbow, [0.06, 0.08, 0.04], [0, -0.235, 0.062], deviceMetal, 0.012);
  for (const y of [-0.18, -0.28]) {
    const band = new THREE.Mesh(new THREE.TorusGeometry(y === -0.18 ? 0.061 : 0.052, 0.009, 8, 40), strap);
    band.rotation.x = Math.PI / 2;
    band.position.y = y;
    band.scale.y = 0.9;
    left.elbow.add(band);
  }
  const screenLight = new THREE.PointLight(0x5de5ff, 0, 0.8, 2);
  screenLight.position.set(0, 0.1, 0.09);
  device.add(screenLight);

  const pose = (motion: Motion) => {
    left.shoulder.rotation.set(-0.7 - motion.lift * 0.18, 0, -0.32);
    left.elbow.rotation.set(-0.7 - motion.lift * 0.12, 0, -0.1);
    screenMaterial.color.setScalar(0.16 + motion.screen * 0.84);
    screenLight.intensity = motion.screen * 0.15;
    root.updateMatrixWorld(true);
    gripTablet(right, screen, motion.touch);
    root.updateMatrixWorld(true);
  };
  return { root, eye: new THREE.Vector3(0, 1.84, -0.25), left, right, device, screen, pose };
}
