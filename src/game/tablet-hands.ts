import * as THREE from "three";

/** A small woven pattern shared by the fitted hoodie sleeves. */
export function sleeveWeave(): THREE.DataTexture {
  const size = 64;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const value = 244 + (x % 4 < 2 !== y % 4 < 2 ? 7 : 0) + ((x * 13 + y * 7) % 4);
      const at = (y * size + x) * 4;
      pixels.set([value, value, value, 255], at);
    }
  }
  const texture = new THREE.DataTexture(pixels, size, size);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 12);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function oval(
  parent: THREE.Object3D,
  scale: [number, number, number],
  at: [number, number, number],
  surface: THREE.Material,
) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), surface);
  mesh.scale.set(...scale);
  mesh.position.set(...at);
  parent.add(mesh);
  return mesh;
}

function sleeve(
  parent: THREE.Object3D,
  top: number,
  bottom: number,
  length: number,
  y: number,
  surface: THREE.Material,
) {
  const geometry = new THREE.CylinderGeometry(top, bottom, length, 40, 24);
  const position = geometry.getAttribute("position");
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i),
      z = position.getZ(i),
      t = (position.getY(i) + length / 2) / length;
    const fold = 1 + Math.sin(t * Math.PI * 14 + Math.atan2(z, x) * 0.8) * Math.sin(t * Math.PI) ** 2 * 0.025;
    position.setXYZ(i, x * fold, position.getY(i), z * fold);
  }
  geometry.computeVertexNormals();
  const mesh = new THREE.Mesh(geometry, surface);
  mesh.position.y = y;
  mesh.scale.z = 0.9;
  parent.add(mesh);
  return mesh;
}

function handModel(parent: THREE.Group, side: number, skin: THREE.Material, nail: THREE.Material) {
  const hand = new THREE.Group();
  hand.position.y = -0.38;
  parent.add(hand);
  oval(hand, [0.047, 0.065, 0.023], [0, -0.047, 0], skin);
  // Continuous curved surfaces keep the finger joints soft and connected.
  for (const [i, length] of [0.073, 0.083, 0.077, 0.059].entries()) {
    const finger = new THREE.Group();
    finger.position.set(-0.033 + i * 0.022, -0.082 + (i === 3 ? 0.012 : 0), 0);
    finger.rotation.z = (1.5 - i) * 0.035;
    hand.add(finger);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(0, -length * 0.35, -length * 0.02),
      new THREE.Vector3(0, -length * 0.7, -length * 0.15),
      new THREE.Vector3(0, -length * 0.9, -length * 0.4),
    ]);
    const radius = i === 3 ? 0.0085 : 0.0105;
    const geometry = new THREE.TubeGeometry(curve, 18, radius, 12, false);
    const position = geometry.getAttribute("position");
    for (let ring = 0; ring <= 18; ring++) {
      const center = curve.getPointAt(ring / 18);
      for (let edge = 0; edge <= 12; edge++) {
        const index = ring * 13 + edge;
        const point = new THREE.Vector3().fromBufferAttribute(position, index);
        point
          .sub(center)
          .multiplyScalar(1 - (ring / 18) * 0.28)
          .add(center);
        position.setXYZ(index, point.x, point.y, point.z);
      }
    }
    geometry.computeVertexNormals();
    finger.add(new THREE.Mesh(geometry, skin));
    const tip = curve.getPoint(1);
    oval(finger, [radius * 0.72, radius * 0.72, radius * 0.72], [tip.x, tip.y, tip.z], skin);
    const nailCenter = curve.getPoint(0.88);
    const fingernail = oval(
      finger,
      [radius * 0.62, 0.009, 0.001],
      [0, nailCenter.y, nailCenter.z + radius * 0.7],
      nail,
    );
    fingernail.rotation.x = 0.55;
  }
  const thumb = new THREE.Group();
  thumb.position.set(side * 0.039, -0.022, 0.004);
  thumb.rotation.set(0.2, side * 0.18, side * 0.65);
  hand.add(thumb);
  oval(thumb, [0.016, 0.029, 0.017], [0, -0.015, 0], skin);
  oval(thumb, [0.012, 0.026, 0.013], [0, -0.05, 0.005], skin);
  oval(thumb, [0.008, 0.01, 0.0015], [0, -0.059, 0.017], nail);
  return hand;
}

/** Keep shoulders outside the focus of the view; forearms taper into real wrists. */
export function createTabletArm(
  parent: THREE.Group,
  x: number,
  cloth: THREE.Material,
  cuff: THREE.Material,
  skin: THREE.Material,
  nail: THREE.Material,
) {
  const shoulder = new THREE.Group();
  shoulder.position.set(x, 1.55, 0);
  parent.add(shoulder);
  // Continue behind the eye line so a cut-off shoulder never floats in view.
  sleeve(shoulder, 0.095, 0.07, 0.74, -0.02, cloth);
  const elbow = new THREE.Group();
  elbow.position.y = -0.39;
  shoulder.add(elbow);
  oval(elbow, [0.071, 0.075, 0.064], [0, 0, 0], cloth);
  sleeve(elbow, 0.071, 0.047, 0.3, -0.15, cloth);
  sleeve(elbow, 0.049, 0.045, 0.045, -0.322, cuff);
  for (const y of [-0.307, -0.319, -0.331]) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(0.046, 0.0015, 6, 32), cuff);
    rib.rotation.x = Math.PI / 2;
    rib.position.y = y;
    rib.scale.y = 0.9;
    elbow.add(rib);
  }
  oval(elbow, [0.03, 0.04, 0.026], [0, -0.358, 0], skin);
  const hand = handModel(elbow, x < 0 ? 1 : -1, skin, nail);
  return { shoulder, elbow, hand };
}
