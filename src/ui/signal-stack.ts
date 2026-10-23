import { button, el } from "./dom";

export type SignalStackHost = {
  name: string;
  best: number;
  panel(title: string, subtitle: string, wide?: boolean): HTMLElement;
  record(score: number): void;
  lobby(): void;
};

const WIDTH = 960;
const HEIGHT = 380;
const FLOOR = 332;
const BASE_WIDTH = 340;
const BLOCK_HEIGHT = 22;
type Block = { x: number; width: number; hue: number };

/** A free timing game: stack stable signal relays without losing coding progress. */
export function openSignalStack(host: SignalStackHost): void {
  const panel = host.panel("Signal Stack", `${host.name}'s arcade · stack the signal relays`, true);
  panel.classList.add("signal-stack");
  panel.append(
    el(
      "p",
      "arcade-intro",
      "Drop each moving relay on top of the last. A little overhang is safe; a miss ends the tower. This game never costs coding hearts or gems.",
    ),
  );
  const readout = el("div", "arcade-score-strip"),
    levelDisplay = el("strong", "arcade-score", "LEVEL 0"),
    widthDisplay = el("span", "arcade-bits", `RELAY ${BASE_WIDTH} px`),
    bestDisplay = el("span", "arcade-time", `BEST ${host.best}`);
  readout.append(levelDisplay, widthDisplay, bestDisplay);
  const canvas = el("canvas", "signal-stack-canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Signal Stack tower game with a moving cyan relay block above a glowing city grid.",
  );
  const context = canvas.getContext("2d");
  const feedback = el(
    "p",
    "arcade-feedback",
    "Start a tower, then drop the moving relay with Space, Enter, or the button.",
  );
  feedback.setAttribute("role", "status");
  const controls = el("div", "arcade-controls"),
    start = button("Start a tower", () => begin(), "button primary"),
    drop = button("Drop relay", () => place(), "button arcade-jump");
  drop.disabled = true;
  controls.append(start, drop);
  panel.append(readout, canvas, feedback, controls, button("Arcade lobby", host.lobby));

  let stack: Block[] = [];
  let movingX = (WIDTH - BASE_WIDTH) / 2;
  let movingWidth = BASE_WIDTH;
  let direction = 1;
  let speed = 205;
  let playing = false;
  let level = 0;
  let best = host.best;
  let frame = 0;
  let lastTime = 0;
  const bestLine = el("p", "arcade-best", `PERSONAL BEST · ${best}`);
  panel.append(bestLine);

  const refresh = () => {
    levelDisplay.textContent = `LEVEL ${level}`;
    widthDisplay.textContent = `RELAY ${Math.round(movingWidth)} px`;
  };
  const begin = () => {
    stack = [{ x: (WIDTH - BASE_WIDTH) / 2, width: BASE_WIDTH, hue: 180 }];
    movingX = (WIDTH - BASE_WIDTH) / 2 - 16;
    movingWidth = BASE_WIDTH;
    direction = 1;
    speed = 205;
    level = 0;
    playing = true;
    feedback.textContent = "Watch the overlap and drop when you are ready.";
    start.textContent = "Restart tower";
    drop.disabled = false;
    refresh();
  };
  const finish = (won = false) => {
    playing = false;
    drop.disabled = true;
    if (level > best) {
      best = level;
      host.record(best);
      bestLine.textContent = `NEW PERSONAL BEST · LEVEL ${best}`;
    } else bestLine.textContent = `PERSONAL BEST · LEVEL ${best}`;
    feedback.textContent = won
      ? `Signal stabilized! You stacked ${level} relays and saved the city's route.`
      : level
        ? `Tower ended at level ${level}. The city and your coding progress are safe.`
        : "That block missed. Start another tower and watch the overlap.";
    start.textContent = "Build again";
  };
  const place = () => {
    if (!playing) return;
    const top = stack[stack.length - 1];
    if (!top) return;
    const left = Math.max(top.x, movingX),
      right = Math.min(top.x + top.width, movingX + movingWidth),
      overlap = right - left;
    if (overlap < 14) {
      finish();
      return;
    }
    movingX = left;
    movingWidth = overlap;
    level++;
    stack.push({ x: left, width: overlap, hue: 178 + ((level * 23) % 115) });
    if (level > best) {
      best = level;
      host.record(best);
      bestLine.textContent = `NEW PERSONAL BEST · LEVEL ${best}`;
    }
    speed = Math.min(435, speed + 12);
    feedback.textContent = `${level} relays stable. Line up the next block.`;
    refresh();
    if (level >= 14) finish(true);
  };
  const onKeyDown = (event: KeyboardEvent) => {
    if (
      !panel.isConnected ||
      event.repeat ||
      event.target instanceof HTMLTextAreaElement ||
      event.target instanceof HTMLInputElement
    )
      return;
    if (event.code === "Space" || event.code === "Enter") {
      event.preventDefault();
      place();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  const cleanup = () => {
    cancelAnimationFrame(frame);
    window.removeEventListener("keydown", onKeyDown);
  };
  const draw = () => {
    if (!context) return;
    const ctx = context,
      sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#101b3d");
    sky.addColorStop(1, "#09243a");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.strokeStyle = "#55c9ef1a";
    for (let x = 0; x < WIDTH; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, HEIGHT);
      ctx.stroke();
    }
    for (let y = 24; y < HEIGHT; y += 36) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(WIDTH, y);
      ctx.stroke();
    }
    for (let i = 0; i < 12; i++) {
      const x = i * 84 + 15,
        height = 48 + ((i * 37) % 108);
      ctx.fillStyle = i % 2 ? "#172d48" : "#1c3552";
      ctx.fillRect(x, FLOOR - height, 49, height);
      ctx.fillStyle = "#69e7f455";
      for (let y = FLOOR - height + 12; y < FLOOR - 8; y += 17) ctx.fillRect(x + 10, y, 5, 5);
    }
    const viewOffset = Math.max(0, (stack.length + 1) * BLOCK_HEIGHT - HEIGHT * 0.56);
    for (const [index, block] of stack.entries()) {
      const y = FLOOR - (index + 1) * BLOCK_HEIGHT + viewOffset,
        tint = `hsl(${block.hue} 80% 60%)`;
      ctx.shadowColor = tint;
      ctx.shadowBlur = 15;
      ctx.fillStyle = tint;
      ctx.fillRect(block.x, y, block.width, BLOCK_HEIGHT - 2);
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#efffff77";
      ctx.fillRect(block.x + 4, y + 3, Math.max(0, block.width - 8), 2);
    }
    if (playing) {
      const y = FLOOR - (stack.length + 1) * BLOCK_HEIGHT + viewOffset,
        tint = `hsl(${178 + ((level * 23) % 115)} 90% 68%)`;
      ctx.shadowColor = tint;
      ctx.shadowBlur = 20;
      ctx.fillStyle = tint;
      ctx.fillRect(movingX, y, movingWidth, BLOCK_HEIGHT - 2);
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = "#b6d8ea";
    ctx.font = "bold 14px system-ui";
    ctx.fillText("SIGNAL RELAY TOWER", 28, 34);
    if (!playing && level === 0) {
      ctx.textAlign = "center";
      ctx.font = "bold 24px system-ui";
      ctx.fillText("STACK THE RELAYS", WIDTH / 2, 88);
      ctx.font = "15px system-ui";
      ctx.fillStyle = "#c1d9ea";
      ctx.fillText("Time your drop · keep as much signal as you can", WIDTH / 2, 117);
      ctx.textAlign = "left";
    }
  };
  const tick = (time: number) => {
    if (!panel.isConnected) {
      cleanup();
      return;
    }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, 0.05) : 0;
    lastTime = time;
    if (playing) {
      movingX += direction * speed * dt;
      if (movingX <= 0) {
        movingX = 0;
        direction = 1;
      }
      if (movingX + movingWidth >= WIDTH) {
        movingX = WIDTH - movingWidth;
        direction = -1;
      }
    }
    draw();
    frame = requestAnimationFrame(tick);
  };
  draw();
  frame = requestAnimationFrame(tick);
}
