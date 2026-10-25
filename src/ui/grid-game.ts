import { type GameDesign, moveGrid, newGridRound } from "../core/arcade-creation";
import { gameAudio } from "../game/audio";
import { button, el } from "./dom";
import "./grid-game.css";

export function openGridGame(host: {
  design: GameDesign;
  best: number;
  panel(): HTMLElement;
  record(score: number, won: boolean): void;
  library(): void;
  adventure?(): void;
}): () => void {
  const d = host.design,
    panel = host.panel();
  panel.classList.add("grid-game-panel");
  const canvas = el("canvas", "grid-game-canvas");
  canvas.width = 600;
  canvas.height = 400;
  canvas.tabIndex = 0;
  canvas.setAttribute(
    "aria-label",
    `${d.name} game board. Use arrow keys, WASD or the direction buttons to collect all data gems. Walls block movement.`,
  );
  const ctx = canvas.getContext("2d"),
    status = el("p", "grid-game-status"),
    hint = el(
      "p",
      "muted",
      `Collect ${d.goal} gems · ${d.points} points each · ${d.speed} steps/second · No time limit`,
    );
  status.setAttribute("role", "status");
  let round = newGridRound(d),
    alive = true,
    paused = false,
    frame = 0,
    last = 0,
    best = host.best,
    held: readonly [number, number] | null = null;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function paint(time = 0) {
    if (!ctx) return;
    ctx.fillStyle = d.theme === "garden" ? "#143c34" : "#0a162b";
    ctx.fillRect(0, 0, 600, 400);
    for (let y = 0; y < 8; y++)
      for (let x = 0; x < 12; x++) {
        ctx.strokeStyle = d.theme === "garden" ? "#286151" : "#17334c";
        ctx.strokeRect(x * 50 + 2, y * 50 + 2, 46, 46);
      }
    for (const n of round.walls) {
      const x = (n % 12) * 50,
        y = Math.floor(n / 12) * 50;
      ctx.fillStyle = "#42617c";
      ctx.fillRect(x + 5, y + 5, 40, 40);
      ctx.fillStyle = "#88b4cb";
      ctx.fillRect(x + 9, y + 9, 32, 4);
    }
    for (const n of round.items) {
      const x = (n % 12) * 50 + 25,
        y = Math.floor(n / 12) * 50 + 25;
      ctx.fillStyle = "#f7d279";
      ctx.beginPath();
      ctx.moveTo(x, y - 10);
      ctx.lineTo(x + 9, y);
      ctx.lineTo(x, y + 10);
      ctx.lineTo(x - 9, y);
      ctx.closePath();
      ctx.fill();
    }
    const x = (round.player % 12) * 50 + 25,
      y = Math.floor(round.player / 12) * 50 + 25;
    const bounce = !reduced && held ? Math.sin(time / 90) * 2 : 0;
    ctx.fillStyle = "#050c1b";
    ctx.fillRect(x - 16, y + 8, 8, 13);
    ctx.fillRect(x + 8, y + 8, 8, 13);
    ctx.fillStyle = d.playerColor;
    ctx.fillRect(x - 15, y - 14 + bounce, 30, 29);
    ctx.fillStyle = "#102139";
    ctx.fillRect(x - 10, y - 9 + bounce, 20, 10);
    ctx.fillStyle = "#c8fcff";
    ctx.fillRect(x - 7, y - 6 + bounce, 4, 4);
    ctx.fillRect(x + 3, y - 6 + bounce, 4, 4);
    status.textContent = round.won
      ? `You built it. You beat it! ${round.collected * d.points} points · Best ${best}`
      : `${paused ? "Paused · " : ""}${round.collected}/${d.goal} gems · ${round.collected * d.points} points · Best ${best} · Row ${Math.floor(round.player / 12) + 1}, column ${(round.player % 12) + 1}`;
  }
  function step(dx: number, dy: number) {
    if (paused || !alive || round.won) return;
    const next = moveGrid(round, dx, dy);
    if (next.collected > round.collected) gameAudio.play(next.won ? "victory" : "beacon");
    if (next !== round) {
      round = next;
      best = Math.max(best, round.collected * d.points);
      host.record(round.collected * d.points, round.won);
      if (round.won) panel.querySelector<HTMLButtonElement>(".grid-continue")?.removeAttribute("hidden");
      paint();
    }
  }
  const directions: Record<string, readonly [number, number]> = {
    ArrowUp: [0, -1],
    w: [0, -1],
    ArrowDown: [0, 1],
    s: [0, 1],
    ArrowLeft: [-1, 0],
    a: [-1, 0],
    ArrowRight: [1, 0],
    d: [1, 0],
  };
  const down = (e: KeyboardEvent) => {
    const dir = directions[e.key];
    if (dir && !(e.target instanceof Element && e.target.closest("input,textarea,select"))) {
      e.preventDefault();
      if (!e.repeat) {
        held = dir;
        step(...dir);
        last = performance.now();
      }
    }
  };
  const up = () => {
    held = null;
  };
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", up);
  const visibility = () => {
    if (document.hidden) {
      paused = true;
      held = null;
      pause.textContent = "Resume game";
      paint();
    }
  };
  document.addEventListener("visibilitychange", visibility);
  function tick(t: number) {
    if (!alive) return;
    if (held && !paused && t - last >= 1000 / d.speed) {
      step(...held);
      last = t;
    }
    if (!reduced && held) paint(t);
    frame = requestAnimationFrame(tick);
  }
  const controls = el("div", "grid-game-controls");
  for (const [label, dir] of [
    ["Up", [0, -1]],
    ["Left", [-1, 0]],
    ["Down", [0, 1]],
    ["Right", [1, 0]],
  ] as const) {
    const b = button(label, () => step(dir[0], dir[1]));
    controls.append(b);
  }
  const pause = button("Pause game", () => {
    paused = !paused;
    held = null;
    pause.textContent = paused ? "Resume game" : "Pause game";
    paint();
  });
  panel.append(
    hint,
    canvas,
    status,
    controls,
    pause,
    button("Restart game", () => {
      round = newGridRound(d);
      paused = false;
      held = null;
      pause.textContent = "Pause game";
      paint();
    }),
    button("My arcade", host.library),
  );
  paint();
  if (host.adventure) {
    const next = button("Continue my adventure", host.adventure, "button primary grid-continue");
    next.hidden = true;
    panel.append(next);
  }
  frame = requestAnimationFrame(tick);
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", up);
    document.removeEventListener("visibilitychange", visibility);
  };
}
