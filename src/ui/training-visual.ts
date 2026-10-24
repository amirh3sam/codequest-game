import type { TrainingScene } from "../content/training";
import type { Position } from "../core/state";
import { findWalkingRoute } from "../game/navigation";
import { TABLET_ART } from "../game/tablet-frame";
import { el } from "./dom";

export type TrainingArtwork = { hero: CanvasImageSource; courier: CanvasImageSource; city: CanvasImageSource };
export function trainingVisual(art: TrainingArtwork) {
  const canvas = el("canvas", "training-canvas");
  canvas.width = 900;
  canvas.height = 350;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Animated city training preview");
  const ctx = canvas.getContext("2d");
  const motion = matchMedia("(prefers-reduced-motion: reduce)");
  const wrist = new Image();
  wrist.src = TABLET_ART.url;
  const world = {
    bounds: { left: 35, right: 865, top: 100, bottom: 335 },
    solids: [{ id: "training-building", x: 350, y: 155, width: 145, height: 95 }],
  };
  let scene: TrainingScene = "city",
    hero: Position = { x: 180, y: 290 },
    route: Position[] = [],
    destination: Position | null = null;
  let row = 0,
    stride = 0,
    frame = 0,
    previous = 0,
    clock = 0,
    alive = true,
    paused = false;
  const state = {
    powered: false,
    text: "CITY LINK · TRAINING",
    tab: "Code",
    color: "#67dffa",
    lights: true,
    circuit: "All routes",
    file: "Main",
    unlocked: false,
    jump: 0,
    tower: 1,
    saved: false,
    browserLost: false,
    loaded: false,
    projectSaved: false,
    contrast: false,
  };
  function box(x: number, y: number, w: number, h: number, fill: string, border = "#42607d", radius = 14) {
    if (!ctx) return;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = border;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  function text(value: string, x: number, y: number, size = 19, color = "#dcecf9") {
    if (!ctx) return;
    ctx.fillStyle = color;
    ctx.font = `600 ${size}px system-ui`;
    ctx.fillText(value, x, y);
  }
  function person(image: CanvasImageSource, x: number, y: number, direction = 0, walking = false, scale = 1) {
    if (!ctx) return;
    ctx.fillStyle = "#050e2188";
    ctx.beginPath();
    ctx.ellipse(x, y, 23 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.drawImage(
      image,
      (walking ? Math.floor(stride) % 6 : 0) * 96,
      direction * 112,
      96,
      112,
      x - 48 * scale,
      y - 106 * scale,
      96 * scale,
      112 * scale,
    );
  }
  function move(x = 730, y = 275) {
    const plan = findWalkingRoute(hero, { x, y }, world);
    route = plan?.points.slice() ?? [];
    destination = plan?.destination ?? null;
    if (motion.matches && destination) {
      hero = { ...destination };
      route = [];
    }
    draw();
  }
  function draw() {
    if (!ctx || !alive) return;
    ctx.clearRect(0, 0, 900, 350);
    const gradient = ctx.createLinearGradient(0, 0, 0, 350);
    gradient.addColorStop(0, state.contrast ? "#000" : "#102641");
    gradient.addColorStop(1, "#071326");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 900, 350);
    ctx.save();
    ctx.globalAlpha = 0.16;
    ctx.drawImage(art.city, 0, 0, 900, 350);
    ctx.restore();
    ctx.strokeStyle = "#4d78962b";
    ctx.lineWidth = 1;
    for (let x = 0; x < 900; x += 45) {
      ctx.beginPath();
      ctx.moveTo(x, 100);
      ctx.lineTo(x, 350);
      ctx.stroke();
    }
    for (let y = 110; y < 350; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(900, y);
      ctx.stroke();
    }
    text("CODEQUEST / TRAINING SIMULATOR", 28, 34, 14, "#87b7d5");
    text(state.text, 28, 64, 20);
    if (["city", "walk", "courier", "map", "lighting", "settings"].includes(scene)) {
      if (scene === "walk") {
        box(350, 126, 145, 124, "#233951");
        box(366, 143, 112, 34, "#0b192e");
        text("DATA LAB", 376, 166, 16, "#74e6e6");
        for (let x = 368; x < 480; x += 34) box(x, 192, 22, 25, "#5295ab", "#a2d9e2", 3);
        if (route.length) {
          ctx.strokeStyle = "#7be6ff";
          ctx.lineWidth = 3;
          ctx.setLineDash([3, 9]);
          ctx.beginPath();
          ctx.moveTo(hero.x, hero.y);
          for (const p of route) ctx.lineTo(p.x, p.y);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (destination) {
          ctx.strokeStyle = "#8df4eb";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(destination.x, destination.y, 18 + Math.sin(clock * 4) * 3, 0, Math.PI * 2);
          ctx.stroke();
        }
        person(art.hero, hero.x, hero.y, row, route.length > 0);
        text("Click the ground · walk around the lab", 275, 330, 16, "#a8cddd");
      } else if (scene === "map") {
        for (let i = 0; i < 5; i++) {
          const x = 180 + i * 145;
          box(x - 48, 150, 96, 70, i === 0 || (state.unlocked && i === 1) ? "#204f55" : "#253246");
          text(i === 0 ? "TASK 1" : i === 1 ? "BOSS" : "LOCKED", x - 34, 192, 15);
        }
        box(370, 250, 170, 53, "#153450", "#5ba5bb");
        text("TRANSIT ONLINE", 385, 282, 16, "#8af3db");
        person(art.hero, state.unlocked ? 560 : 115, 297);
      } else if (scene === "courier") {
        person(art.hero, 255, 305, 2, false, 1.5);
        person(art.courier, 610, 305, 1, false, 1.5);
        box(295, 110, 315, 85, "#17344d", "#79d9db");
        text(state.powered ? "Let's build your training badge!" : "Hi, developer. Ready to repair?", 314, 147, 17);
        text(state.powered ? "Read → Run → Submit" : "Use E / Space to talk", 314, 175, 16, "#8adbd5");
      } else {
        for (let i = 0; i < 8; i++) {
          const color =
            state.circuit === "All routes" || state.circuit === `Task ${i + 1}`
              ? state.lights
                ? state.color
                : "#334052"
              : "#67dffa";
          const x = 145 + i * 85;
          box(x, 175, 55, 65, "#23364b", color, 7);
          text(`${i + 1}`, x + 21, 205, 16);
          ctx.strokeStyle = color;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(x - 2, 260);
          ctx.lineTo(x + 55, 260);
          ctx.moveTo(x - 2, 270);
          ctx.lineTo(x + 55, 270);
          ctx.stroke();
          if (!motion.matches && color !== "#334052") {
            ctx.fillStyle = "#ecffff";
            ctx.fillRect(x + ((clock * 35) % 52), 258, 4, 4);
          }
        }
        person(art.hero, 95, 300);
        text(
          scene === "lighting"
            ? `${state.circuit} · ${state.lights ? "ONLINE" : "OFFLINE"}`
            : state.powered
              ? "NETWORK CONNECTED · Your adventure awaits"
              : "8 TASKS → BOSS → NEXT DISTRICT",
          250,
          315,
          18,
          state.lights ? state.color : "#9dacc0",
        );
      }
    } else if (scene === "tablet" && wrist.complete && wrist.naturalWidth) {
      const x = 190,
        y = 68 + (motion.matches ? 0 : Math.max(0, 1 - clock) * 150),
        w = 540,
        h = 360;
      ctx.drawImage(wrist, x, y, w, h);
      const screen = TABLET_ART.screen,
        sx = x + (screen.x / TABLET_ART.width) * w,
        sy = y + (screen.y / TABLET_ART.height) * h;
      box(
        sx,
        sy,
        (screen.width / TABLET_ART.width) * w,
        (screen.height / TABLET_ART.height) * h,
        "#071b2e",
        "#68d7e8",
        4,
      );
      text(`> ${state.tab}`, sx + 15, sy + 30, 17, "#8df4e0");
      text("Your developer workspace", sx + 15, sy + 57, 12);
      text("T / TABLET", 40, 170, 21, "#89dfef");
    } else if (scene === "arcade") {
      box(70, 100, 490, 205, "#102b45", "#63cbd3");
      text("PACKET DASH · JUMP", 92, 131, 17);
      ctx.fillStyle = "#61d1d8";
      ctx.fillRect(90, 275, 440, 5);
      person(art.hero, 220, 273 - Math.sin(Math.min(1, state.jump) * Math.PI) * 100, 2, state.jump > 0);
      box(390 - ((clock * 50) % 220), 247, 24, 27, "#e87991", "#fca5b7", 4);
      box(595, 100, 235, 205, "#142839");
      text("SIGNAL STACK", 615, 132, 17);
      for (let i = 0; i < state.tower; i++)
        box(625 + i * 3, 278 - i * 18, 165 - i * 5, 15, i % 2 ? "#a78bfa" : "#71e0c6", "#bfdde9", 3);
    } else if (scene === "save") {
      box(125, 130, 230, 150, "#203d57");
      text("BROWSER AUTOSAVE", 143, 160, 17);
      if (state.browserLost) {
        text("SITE DATA CLEARED", 145, 210, 17, "#ff9cab");
        text("No local progress", 152, 240, 15);
      } else {
        person(art.hero, 242, 266, 0, false, 0.7);
        text(state.loaded ? "PROGRESS RESTORED" : "PROGRESS SAVED", 143, 300, 17, "#9debc7");
      }
      text(state.loaded ? "← LOAD FILE" : "SAVE FILE →", 386, 195, 18, "#8ae5c9");
      if (state.saved) {
        ctx.fillStyle = "#a2eddb";
        const p = motion.matches ? 0.5 : clock % 1;
        ctx.fillRect(state.loaded ? 550 - p * 180 : 370 + p * 180, 220, 16, 10);
      }
      box(575, 130, 225, 150, "#173f43", "#75d6b4");
      text("DOWNLOADS / HARD DRIVE", 588, 160, 15, "#91dfc7");
      text(state.saved ? "adventure.json ✓" : "No backup yet", 599, 205, 19);
      text(state.saved ? "Kept when browser data is lost" : "Download a snapshot first", 586, 236, 13);
      box(589, 251, 195, 15, "#183044", "#4f7b8f", 4);
      ctx.fillStyle = state.saved ? "#9af0bc" : "#6b899a";
      ctx.fillRect(764, 256, 5, 5);
      text(
        state.projectSaved ? "project.json ✓ · separate file backup" : "Coding files? Export project separately.",
        520,
        312,
        15,
      );
    } else {
      box(150, 90, 600, 210, "#253a50", "#91bacb", 20);
      box(165, 105, 570, 175, "#071523", "#4f6a83", 8);
      ctx.fillStyle = "#476179";
      ctx.fillRect(425, 300, 50, 15);
      box(355, 315, 190, 10, "#3d5872", "#7096ac", 5);
      if (scene === "files") {
        ctx.fillStyle = "#0e2337";
        ctx.fillRect(168, 108, 155, 169);
        text("EXPLORER", 184, 135, 14, "#8cc8d4");
        text("▾ src", 184, 170, 17);
        text(`  ${state.file}`, 184, 203, 14);
        text(`${state.file}    ×`, 345, 138, 16);
        text("class / function / module", 345, 183, 18, "#bfacf7");
        text("OUTPUT  > Signal ready", 345, 252, 16, "#8ce9c6");
      } else {
        text("MISSION TERMINAL / SAFE PREVIEW", 190, 138, 16, "#8ec9da");
        text("01  Read the goal", 194, 180, 21);
        text("02  Run your code", 194, 215, 21, "#9c9cf5");
        text(
          state.powered ? "03  SIGNAL RESTORED ✓" : "03  Inspect output, then Submit",
          194,
          250,
          21,
          state.powered ? "#89e7bb" : "#9ccad7",
        );
      }
    }
    ctx.fillStyle = state.powered ? "#90edbd" : "#69d8e9";
    ctx.beginPath();
    ctx.arc(865, 31, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  function tick(time: number) {
    if (!alive) return;
    const dt = Math.min(0.04, Math.max(0, (time - previous) / 1000));
    previous = time;
    if (!document.hidden && !motion.matches && !paused) {
      clock += dt;
      state.jump = Math.max(0, state.jump - dt * 1.5);
      const point = route[0];
      if (point) {
        const dx = point.x - hero.x,
          dy = point.y - hero.y,
          gap = Math.hypot(dx, dy),
          step = Math.min(gap, dt * 240);
        if (gap) {
          hero = { x: hero.x + (dx / gap) * step, y: hero.y + (dy / gap) * step };
          row = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 2 : 1) : dy > 0 ? 0 : 3;
          stride += step / 12;
        }
        if (gap <= step + 0.01) route.shift();
      }
      draw();
    }
    frame = requestAnimationFrame(tick);
  }
  canvas.addEventListener("click", (event) => {
    if (scene !== "walk") return;
    const rect = canvas.getBoundingClientRect();
    move(((event.clientX - rect.left) / rect.width) * 900, ((event.clientY - rect.top) / rect.height) * 350);
  });
  canvas.addEventListener("keydown", (event) => {
    if (scene !== "walk") return;
    const offset: Record<string, Position> = {
      ArrowUp: { x: 0, y: -55 },
      ArrowDown: { x: 0, y: 55 },
      ArrowLeft: { x: -55, y: 0 },
      ArrowRight: { x: 55, y: 0 },
    };
    const p = offset[event.key];
    if (p) {
      event.preventDefault();
      move(hero.x + p.x, hero.y + p.y);
    }
  });
  wrist.onload = () => draw();
  frame = requestAnimationFrame(tick);
  return {
    canvas,
    state,
    move,
    draw,
    pause(value: boolean) {
      paused = value;
    },
    replay() {
      clock = 0;
      hero = { x: 180, y: 290 };
      if (scene === "walk") move();
      draw();
    },
    setScene(value: TrainingScene, label: string) {
      scene = value;
      clock = 0;
      state.text = label;
      route = [];
      destination = null;
      canvas.tabIndex = value === "walk" ? 0 : -1;
      canvas.setAttribute(
        "aria-label",
        value === "walk"
          ? "Practice movement: click ground or use arrow keys. Your developer walks around the data lab."
          : `${label}: animated 2D training preview`,
      );
      draw();
    },
    destroy() {
      alive = false;
      cancelAnimationFrame(frame);
      wrist.onload = null;
    },
  };
}
