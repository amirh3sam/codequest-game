import { type DeveloperKind, TABLET_ART, tabletFrame } from "./tablet-frame";
import { TABLET_SHOT_MS, tabletMotion } from "./tablet-motion";

function display(name: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tablet display needs a canvas");
  ctx.fillStyle = "#091723";
  ctx.fillRect(0, 0, 1024, 500);
  ctx.fillStyle = "#1a3445";
  ctx.fillRect(0, 0, 1024, 75);
  ctx.font = "bold 22px monospace";
  ctx.fillStyle = "#8ae5eb";
  ctx.fillText("CODEQUEST / FIELD LINK", 32, 46);
  ctx.font = "18px monospace";
  ctx.fillStyle = "#b8d3df";
  ctx.fillText(name.toUpperCase(), 735, 44, 255);
  ctx.fillStyle = "#122837";
  ctx.fillRect(0, 77, 205, 380);
  ctx.font = "16px monospace";
  ctx.fillStyle = "#799db1";
  ctx.fillText("EXPLORER", 25, 122);
  ctx.fillStyle = "#b0dce7";
  for (const [i, item] of ["practice", "missions", "city guide"].entries()) ctx.fillText(item, 25, 177 + i * 45);
  ctx.font = "20px monospace";
  ctx.fillStyle = "#8ad8ef";
  ctx.fillText("// Build, test, explore.", 245, 145);
  ctx.fillStyle = "#c3deea";
  ctx.font = "bold 27px monospace";
  ctx.fillText("Your next idea starts here.", 245, 190);
  ctx.fillStyle = "#8eafc0";
  ctx.font = "18px monospace";
  ctx.fillText("Opening your personal workspace", 245, 235);
  ctx.fillStyle = "#294557";
  ctx.fillRect(245, 278, 730, 2);
  ctx.fillStyle = "#6ddcb7";
  ctx.fillText("OUTPUT", 245, 320);
  ctx.fillText("Ready to build.", 245, 360);
  ctx.fillStyle = "#16364b";
  ctx.fillRect(0, 452, 1024, 48);
  ctx.fillStyle = "#a1cad8";
  ctx.font = "16px monospace";
  ctx.fillText("EDITOR     EXAMPLES     MISSIONS     GUIDE", 30, 483);
  return canvas;
}

/** Illustrated foreground animation over the real city; no separate 3D scene. */
export function playTabletCinematic(
  container: HTMLElement,
  kind: DeveloperKind,
  name: string,
  done: () => void,
): () => void {
  const canvas = document.createElement("canvas");
  canvas.className = "tablet-cinematic-canvas";
  canvas.setAttribute("aria-hidden", "true");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Tablet animation needs a 2D canvas");
  const screen = display(name);
  const art = new Image();
  container.dataset.view = "first-person";
  container.dataset.renderer = "2d";
  container.dataset.character = kind;
  container.prepend(canvas);
  let width = 1,
    height = 1,
    frame = 0,
    disposed = false,
    elapsed = 0,
    previous = 0;
  const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
  const resize = () => {
    width = Math.max(1, container.clientWidth);
    height = Math.max(1, container.clientHeight);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);
  resize();
  const visibility = () => {
    previous = performance.now();
  };
  document.addEventListener("visibilitychange", visibility);
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    cancelAnimationFrame(frame);
    clearTimeout(loadTimer);
    observer.disconnect();
    document.removeEventListener("visibilitychange", visibility);
    canvas.removeEventListener("contextlost", fail);
    art.onload = art.onerror = null;
    canvas.width = canvas.height = 1;
    canvas.remove();
  };
  const fail = () => {
    if (disposed) return;
    dispose();
    done();
  };
  canvas.addEventListener("contextlost", fail);
  const loadTimer = window.setTimeout(fail, 6000);
  const animate = (now: number) => {
    if (disposed) return;
    if (!container.isConnected) {
      dispose();
      return;
    }
    if (!document.hidden) elapsed += Math.max(0, now - previous);
    previous = now;
    const motion = tabletMotion(elapsed);
    const pose = tabletFrame(width, height, motion);
    container.dataset.phase = motion.phase;
    canvas.style.opacity = String(motion.reveal);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(pose.x, pose.y);
    ctx.rotate(pose.angle);
    ctx.scale(pose.scale, pose.scale);
    ctx.translate(-pose.pivotX, -pose.pivotY);
    ctx.drawImage(art, 0, 0, TABLET_ART.width, TABLET_ART.height);
    const area = TABLET_ART.screen;
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(area.x, area.y, area.width, area.height, 14);
    ctx.clip();
    ctx.fillStyle = "#091723";
    ctx.fillRect(area.x, area.y, area.width, area.height);
    ctx.globalAlpha = motion.screen;
    ctx.drawImage(screen, area.x, area.y, area.width, area.height);
    ctx.fillStyle = "#74e1c4";
    ctx.fillRect(area.x + area.width * 0.24, area.y + area.height * 0.79, area.width * 0.64 * motion.screen, 3);
    ctx.restore();
    ctx.restore();
    if (elapsed >= TABLET_SHOT_MS) {
      dispose();
      done();
      return;
    }
    frame = requestAnimationFrame(animate);
  };
  art.onload = () => {
    if (disposed) return;
    clearTimeout(loadTimer);
    container.dataset.artReady = "true";
    previous = performance.now();
    frame = requestAnimationFrame(animate);
  };
  art.onerror = fail;
  art.src = TABLET_ART.url;
  return dispose;
}
