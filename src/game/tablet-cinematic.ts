import * as THREE from "three";
import { TABLET_SHOT_MS, tabletMotion } from "./tablet-motion";
import { createTabletDisplay, createTabletRig, type DeveloperKind } from "./tablet-rig";

function cityStage(scene: THREE.Scene): void {
  scene.background = new THREE.Color(0x0c1c2c);
  scene.fog = new THREE.Fog(0x0c1c2c, 4, 15);
  scene.add(new THREE.HemisphereLight(0xb9e8ff, 0x314662, 2.5));
  const key = new THREE.DirectionalLight(0xffddbc, 3.3);
  key.position.set(-3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x51bfff, 4.2);
  rim.position.set(3, 3, -3);
  scene.add(rim);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 40),
    new THREE.MeshStandardMaterial({ color: 0x1c3448, roughness: 0.7, metalness: 0.3 }),
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);
  const shadow = new THREE.Mesh(
    new THREE.CircleGeometry(0.5, 32),
    new THREE.MeshBasicMaterial({ color: 0x071321, transparent: true, opacity: 0.42 }),
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.003;
  shadow.scale.set(1, 0.8, 1);
  scene.add(shadow);
  const grid = new THREE.GridHelper(30, 30, 0x34738b, 0x274153);
  grid.position.y = 0.002;
  scene.add(grid);
  const glass = new THREE.MeshStandardMaterial({ color: 0x244865, metalness: 0.58, roughness: 0.34 });
  const trim = new THREE.MeshBasicMaterial({ color: 0x62cbdc });
  for (const [x, z, height, width] of [
    [-3, -3, 4.8, 2.4],
    [2.9, -4, 6, 2.3],
    [-5, -1, 3.2, 1.9],
    [5, -1.8, 4, 2.2],
  ]) {
    if (x === undefined || z === undefined || height === undefined || width === undefined) continue;
    const building = new THREE.Mesh(new THREE.BoxGeometry(width, height, 1.6), glass);
    building.position.set(x, height / 2, z);
    scene.add(building);
    for (let y = 0.5; y < height; y += 0.6) {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(width * 0.83, 0.027, 0.02), trim);
      strip.position.set(x, y, z + 0.82);
      scene.add(strip);
    }
  }
  const trail = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 30), new THREE.MeshBasicMaterial({ color: 0x55cbe9 }));
  trail.rotation.x = -Math.PI / 2;
  trail.position.set(-1.2, 0.006, 0);
  scene.add(trail);
  const second = trail.clone();
  second.position.x = 1.2;
  scene.add(second);
}

/** Short-lived WebGL scene. No model downloads, game state mutations or player code. */
export function playTabletCinematic(
  container: HTMLElement,
  kind: DeveloperKind,
  name: string,
  done: () => void,
): () => void {
  const canvas = document.createElement("canvas");
  canvas.className = "tablet-cinematic-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "low-power" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  container.prepend(canvas);
  const scene = new THREE.Scene();
  cityStage(scene);
  const rig = createTabletRig(kind, createTabletDisplay(name));
  scene.add(rig.root);
  const camera = new THREE.PerspectiveCamera(40, 1, 0.015, 40);
  const wide = new THREE.Vector3(2.6, 1.95, 4.2),
    close = new THREE.Vector3(1.6, 1.8, 2.8);
  const center = new THREE.Vector3(),
    screenRotation = new THREE.Quaternion(),
    normal = new THREE.Vector3(),
    screenUp = new THREE.Vector3();
  const end = new THREE.Vector3(),
    target = new THREE.Vector3(),
    defaultTarget = new THREE.Vector3(0, 1.34, 0.08);
  const resize = () => {
    const width = Math.max(1, container.clientWidth),
      height = Math.max(1, container.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  let frame = 0,
    disposed = false,
    elapsed = 0,
    previous = performance.now();
  const visibility = () => {
    previous = performance.now();
  };
  document.addEventListener("visibilitychange", visibility);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    observer.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    canvas.removeEventListener("webglcontextlost", contextLost);
    const geometries = new Set<THREE.BufferGeometry>(),
      materials = new Set<THREE.Material>(),
      textures = new Set<THREE.Texture>();
    scene.traverse((node) => {
      if (!(node instanceof THREE.Mesh) && !(node instanceof THREE.LineSegments)) return;
      geometries.add(node.geometry);
      for (const surface of Array.isArray(node.material) ? node.material : [node.material]) {
        materials.add(surface);
        if ("map" in surface && surface.map instanceof THREE.Texture) textures.add(surface.map);
      }
    });
    for (const geometry of geometries) geometry.dispose();
    for (const surface of materials) surface.dispose();
    for (const texture of textures) texture.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  };
  const contextLost = (event: Event) => {
    event.preventDefault();
    dispose();
    done();
  };
  canvas.addEventListener("webglcontextlost", contextLost);
  const animate = (now: number) => {
    if (disposed) return;
    if (!container.isConnected) {
      dispose();
      return;
    }
    if (!document.hidden) elapsed += Math.max(0, now - previous);
    previous = now;
    const motion = tabletMotion(elapsed);
    container.dataset.phase = motion.phase;
    container.dataset.character = kind;
    canvas.style.opacity = String(motion.reveal);
    rig.pose(motion);
    rig.screen.getWorldPosition(center);
    rig.screen.getWorldQuaternion(screenRotation);
    normal.set(0, 0, 1).applyQuaternion(screenRotation);
    screenUp.set(0, 1, 0).applyQuaternion(screenRotation);
    const distance =
      (Math.min(0.51 / camera.aspect, 0.319) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)))) * 0.97;
    end.copy(center).addScaledVector(normal, distance);
    camera.position.lerpVectors(wide, close, motion.approach).lerp(end, motion.enter);
    camera.up.set(0, 1, 0).lerp(screenUp, motion.enter).normalize();
    target.lerpVectors(defaultTarget, center, motion.enter);
    camera.lookAt(target);
    renderer.render(scene, camera);
    if (elapsed >= TABLET_SHOT_MS) {
      dispose();
      done();
      return;
    }
    frame = requestAnimationFrame(animate);
  };
  frame = requestAnimationFrame(animate);
  return dispose;
}
