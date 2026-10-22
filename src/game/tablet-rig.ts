import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
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

function arm(parent: THREE.Group, x: number, cloth: THREE.Material, cuff: THREE.Material, skin: THREE.Material) {
  const shoulder = new THREE.Group();
  shoulder.position.set(x, 1.55, 0);
  parent.add(shoulder);
  sphere(shoulder, [0.15, 0.16, 0.15], [0, -0.03, 0], cloth);
  box(shoulder, [0.23, 0.36, 0.24], [0, -0.2, 0], cloth, 0.085);
  const elbow = new THREE.Group();
  elbow.position.y = -0.39;
  shoulder.add(elbow);
  sphere(elbow, [0.105, 0.11, 0.11], [0, 0, 0], cloth);
  box(elbow, [0.19, 0.3, 0.2], [0, -0.15, 0], cloth, 0.065);
  box(elbow, [0.2, 0.075, 0.21], [0, -0.3, 0], cuff, 0.025);
  const hand = new THREE.Group();
  hand.position.y = -0.38;
  elbow.add(hand);
  box(hand, [0.135, 0.15, 0.085], [0, -0.02, 0], skin, 0.035);
  for (const fingerX of [-0.045, -0.015, 0.015, 0.045])
    box(hand, [0.027, 0.065, 0.06], [fingerX, -0.1, 0.005], skin, 0.012);
  const thumb = box(hand, [0.05, 0.09, 0.065], [x < 0 ? 0.078 : -0.078, 0, 0.025], skin, 0.02);
  thumb.rotation.z = x < 0 ? -0.5 : 0.5;
  return { shoulder, elbow, hand };
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
  const cloth = material(kind === "girl" ? 0x65499d : 0x285e9f),
    darkCloth = material(kind === "girl" ? 0x352550 : 0x193756);
  const skin = material(0xd5a17e, 0, 0.66),
    strap = material(0x142334);
  const deviceMetal = material(0x334959, 0.8, 0.3),
    lightMetal = material(0x8fa9b8, 0.65, 0.28);
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x8beaff,
    emissive: 0x34bfeb,
    emissiveIntensity: 2,
    roughness: 0.3,
  });
  const left = arm(root, 0.39, cloth, darkCloth, skin),
    right = arm(root, -0.39, cloth, darkCloth, skin);
  left.shoulder.name = "tablet-shoulder";
  left.elbow.name = "tablet-forearm";
  const device = new THREE.Group();
  device.name = "wrist-tablet";
  device.position.set(0, -0.22, 0.145);
  device.rotation.set(-0.85, -0.6, Math.PI);
  left.elbow.add(device);
  box(device, [0.64, 0.43, 0.075], [0, 0, 0], deviceMetal, 0.04);
  box(device, [0.55, 0.35, 0.018], [0, 0, 0.045], strap, 0.018);
  const screenMaterial = new THREE.MeshBasicMaterial({ map: texture, color: 0xffffff, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(0.51, 0.319), screenMaterial);
  screen.position.z = 0.056;
  screen.name = "tablet-screen";
  device.add(screen);
  for (const x of [-0.29, 0.29])
    for (const y of [-0.18, 0.18]) sphere(device, [0.013, 0.013, 0.008], [x, y, 0.041], lightMetal);
  box(device, [0.11, 0.013, 0.012], [0, 0.19, 0.043], cyan, 0.004);
  box(device, [0.025, 0.1, 0.018], [0.293, 0, 0.047], cyan, 0.007);
  for (const y of [-0.09, 0.09]) box(device, [0.24, 0.055, 0.18], [0, y, -0.1], strap, 0.017);
  const screenLight = new THREE.PointLight(0x5de5ff, 0, 1.3, 2);
  screenLight.position.set(0, 0.16, 0.16);
  device.add(screenLight);

  const pose = (motion: Motion) => {
    left.shoulder.rotation.set(-0.7 - motion.lift * 0.18, 0, -0.32);
    left.elbow.rotation.set(-0.7 - motion.lift * 0.12, 0, -0.1);
    right.shoulder.rotation.set(-0.6 - motion.touch * 0.04, 0, 0.55);
    right.elbow.rotation.set(-1.05 - motion.touch * 0.08, 0, 0.25);
    right.hand.rotation.x = motion.touch * 0.15;
    screenMaterial.color.setScalar(0.16 + motion.screen * 0.84);
    screenLight.intensity = motion.screen * 0.65;
    root.updateMatrixWorld(true);
  };
  return { root, eye: new THREE.Vector3(0, 1.84, -0.25), left, right, device, screen, pose };
}
