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
  root.name = `developer-${kind}`;
  const cloth = material(kind === "girl" ? 0x65499d : 0x285e9f),
    darkCloth = material(kind === "girl" ? 0x352550 : 0x193756);
  const skin = material(0xd5a17e, 0, 0.66),
    hair = material(0x251b1e),
    pants = material(0x182d42);
  const sole = material(0xd5e0e5),
    shoe = material(0x273440),
    strap = material(0x142334);
  const deviceMetal = material(0x334959, 0.8, 0.3),
    lightMetal = material(0x8fa9b8, 0.65, 0.28);
  const cyan = new THREE.MeshStandardMaterial({
    color: 0x8beaff,
    emissive: 0x34bfeb,
    emissiveIntensity: 2,
    roughness: 0.3,
  });
  box(root, [0.67, 0.71, 0.37], [0, 1.23, 0], cloth, 0.12);
  box(root, [0.62, 0.1, 0.37], [0, 0.89, 0], darkCloth, 0.035);
  box(root, [0.39, 0.17, 0.035], [0, 1.03, 0.198], darkCloth, 0.04);
  for (const x of [-0.15, 0.15]) {
    box(root, [0.024, 0.24, 0.025], [x, 1.39, 0.2], sole, 0.01);
    box(root, [0.025, 0.035, 0.03], [x, 1.255, 0.2], lightMetal, 0.009);
  }
  sphere(root, [0.35, 0.19, 0.24], [0, 1.52, -0.12], darkCloth);
  box(root, [0.54, 0.61, 0.23], [0, 1.22, -0.29], strap, 0.09);
  box(root, [0.42, 0.09, 0.06], [0, 1.38, -0.43], deviceMetal, 0.025);
  box(root, [0.24, 0.025, 0.01], [0, 1.28, -0.414], cyan, 0.008);
  for (const x of [-0.23, 0.23]) box(root, [0.06, 0.48, 0.045], [x, 1.3, 0.21], strap, 0.018);
  for (const x of [-0.175, 0.175]) {
    box(root, [0.245, 0.72, 0.26], [x, 0.49, 0], pants, 0.06);
    box(root, [0.26, 0.055, 0.37], [x, 0.06, 0.06], sole, 0.018);
    box(root, [0.25, 0.13, 0.36], [x, 0.13, 0.06], shoe, 0.045);
    box(root, [0.12, 0.014, 0.13], [x, 0.201, 0.09], sole, 0.006);
  }
  sphere(root, [0.105, 0.14, 0.11], [0, 1.66, 0], skin);
  const head = new THREE.Group();
  head.name = "head-gaze";
  head.position.set(0, 1.73, 0);
  root.add(head);
  sphere(head, [0.215, 0.265, 0.205], [0, 0.17, 0], skin);
  for (const x of [-0.214, 0.214]) sphere(head, [0.038, 0.065, 0.035], [x, 0.16, 0], skin);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.237, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.53), hair);
  cap.position.set(0, 0.285, -0.02);
  cap.scale.set(1, 0.8, 0.94);
  head.add(cap);
  for (let i = 0; i < 5; i++) {
    const tuft = sphere(head, [0.075, 0.06, 0.07], [-0.15 + i * 0.065, 0.36 + Math.sin(i) * 0.018, 0.12], hair);
    tuft.rotation.z = -0.3;
  }
  if (kind === "girl") {
    sphere(head, [0.225, 0.32, 0.125], [0, 0.11, -0.14], hair);
    for (const x of [-0.205, 0.205]) sphere(head, [0.055, 0.25, 0.08], [x, 0.03, -0.02], hair);
  }
  const pupils: THREE.Mesh[] = [];
  for (const x of [-0.082, 0.082]) {
    sphere(head, [0.041, 0.027, 0.014], [x, 0.2, 0.189], sole);
    pupils.push(sphere(head, [0.016, 0.02, 0.012], [x, 0.2, 0.201], hair));
    box(head, [0.075, 0.016, 0.02], [x, 0.255, 0.188], hair, 0.007);
  }
  sphere(head, [0.028, 0.04, 0.035], [0, 0.135, 0.21], skin);
  box(head, [0.064, 0.012, 0.013], [0, 0.075, 0.191], material(0x926052), 0.006);
  const left = arm(root, -0.39, cloth, darkCloth, skin),
    right = arm(root, 0.39, cloth, darkCloth, skin);
  left.shoulder.name = "tablet-shoulder";
  left.elbow.name = "tablet-forearm";
  const device = new THREE.Group();
  device.name = "wrist-tablet";
  device.position.set(0, -0.22, 0.145);
  device.rotation.x = 0.35;
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
    root.rotation.y = -0.1 * (1 - motion.enter);
    left.shoulder.rotation.set(-0.12 - motion.lift * 0.78, 0, motion.lift * 0.34);
    left.elbow.rotation.set(-0.12 - motion.lift * 0.74, 0, motion.lift * 0.12);
    right.shoulder.rotation.set(-0.08 - motion.lift * 0.72 - motion.touch * 0.12, 0, -motion.lift * 0.32);
    right.elbow.rotation.set(-0.1 - motion.lift * 0.9 - motion.touch * 0.14, 0, -motion.lift * 0.25);
    right.hand.rotation.x = motion.touch * 0.2;
    head.rotation.set(motion.gaze * 0.5, -motion.gaze * 0.1, -motion.gaze * 0.03);
    for (const pupil of pupils) pupil.position.y = 0.2 - motion.gaze * 0.008;
    screenMaterial.color.setScalar(0.16 + motion.screen * 0.84);
    screenLight.intensity = motion.screen * 0.65;
    root.updateMatrixWorld(true);
  };
  return { root, head, left, right, device, screen, pose };
}
