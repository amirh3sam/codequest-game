import { button, el } from "./dom";

type PacketDashHost = {
  name: string;
  best: number;
  runner: HTMLCanvasElement;
  panel(title: string, subtitle: string, wide?: boolean): HTMLElement;
  record(score: number): void;
};

const WIDTH = 960;
const HEIGHT = 340;
const GROUND = 276;
const ROUND_SECONDS = 60;

type Hazard = { x: number; width: number; height: number; passed: boolean };
type Bit = { x: number; y: number; taken: boolean; pulse: number };

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

/** A free, standalone city runner. It uses no code, hearts, gems or outside assets. */
export function openPacketDash(host: PacketDashHost): void {
  const panel = host.panel("Packet Dash", `${host.name}'s city arcade · a quick 2D runner`, true);
  panel.classList.add("packet-dash");
  const intro = el(
    "p",
    "arcade-intro",
    "Jump the signal glitches, scoop up data bits, and see how far you can run. Your coding hearts and gems are never at risk.",
  );
  const scoreStrip = el("div", "arcade-score-strip");
  const scoreDisplay = el("strong", "arcade-score", "DISTANCE 0");
  const bitDisplay = el("span", "arcade-bits", "DATA 0");
  const livesDisplay = el("span", "arcade-lives", "SHIELDS 3");
  const timeDisplay = el("span", "arcade-time", "60 SEC");
  scoreStrip.append(scoreDisplay, bitDisplay, livesDisplay, timeDisplay);
  const canvas = el("canvas", "packet-dash-canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  canvas.setAttribute("role", "img");
  canvas.setAttribute(
    "aria-label",
    "Packet Dash runner. Jump over purple signal glitches and collect golden data bits.",
  );
  const context = canvas.getContext("2d");
  const feedback = el("p", "arcade-feedback", "Press Space, ↑, or Jump to start. On mobile, tap Jump.");
  feedback.setAttribute("role", "status");
  const controls = el("div", "arcade-controls");
  const start = button("Start 60-second run", () => begin(), "button primary");
  const jump = button(
    "Jump",
    () => {
      if (!playing) begin();
      else leap();
    },
    "button arcade-jump",
  );
  jump.setAttribute("aria-label", "Jump over the signal glitches");
  controls.append(start, jump);
  const best = el("p", "arcade-best", `PERSONAL BEST · ${host.best}`);
  panel.append(intro, scoreStrip, canvas, feedback, controls, best);

  let frameId = 0;
  let lastFrame = 0;
  let playing = false;
  let finished = false;
  let distance = 0;
  let collected = 0;
  let shields = 3;
  let elapsed = 0;
  let jumpHeight = 0;
  let jumpVelocity = 0;
  let invulnerable = 0;
  let hazardTimer = 0.9;
  let bitTimer = 0.55;
  let scroll = 0;
  let hazards: Hazard[] = [];
  let bits: Bit[] = [];
  let personalBest = host.best;

  const currentScore = () => Math.floor(distance / 14) + collected * 50;
  const refreshReadout = () => {
    scoreDisplay.textContent = `DISTANCE ${Math.floor(distance / 10)} m · SCORE ${currentScore()}`;
    bitDisplay.textContent = `DATA ${collected}`;
    livesDisplay.textContent = `SHIELDS ${"◆".repeat(shields)}${"◇".repeat(3 - shields)}`;
    timeDisplay.textContent = `${Math.max(0, ROUND_SECONDS - Math.floor(elapsed))} SEC`;
  };
  const begin = () => {
    if (!panel.isConnected) return;
    playing = true;
    finished = false;
    distance = 0;
    collected = 0;
    shields = 3;
    elapsed = 0;
    jumpHeight = 0;
    jumpVelocity = 0;
    invulnerable = 0;
    hazardTimer = 0.8;
    bitTimer = 0.45;
    scroll = 0;
    hazards = [];
    bits = [];
    feedback.textContent = "Run! Tap Jump or press Space / ↑ to leap. A missed landing only costs an arcade shield.";
    start.textContent = "Restart run";
    refreshReadout();
  };
  const leap = () => {
    if (!playing || jumpHeight > 1) return;
    jumpVelocity = 485;
    feedback.textContent = "Nice jump! Keep moving and grab the data bits.";
  };
  const finish = () => {
    playing = false;
    finished = true;
    const score = currentScore();
    if (score > personalBest) {
      personalBest = score;
      host.record(score);
      best.textContent = `NEW PERSONAL BEST · ${score}`;
      feedback.textContent = `Run over · ${score} points. New record saved with ${host.name}'s adventure!`;
    } else {
      best.textContent = `PERSONAL BEST · ${personalBest}`;
      feedback.textContent = `Run over · ${score} points. Try another run to beat ${personalBest}.`;
    }
    start.textContent = "Run again";
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (!panel.isConnected || event.repeat) return;
    if (event.code === "Space" || event.code === "ArrowUp") {
      event.preventDefault();
      if (!playing) begin();
      else leap();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  const cleanup = () => {
    cancelAnimationFrame(frameId);
    window.removeEventListener("keydown", onKeyDown);
    document.removeEventListener("visibilitychange", onVisibility);
  };
  const onVisibility = () => {
    lastFrame = 0;
    if (document.hidden) {
      playing = false;
      feedback.textContent = "Run paused while this tab is away. Start another run when you’re back.";
      start.textContent = "Resume with a new run";
    }
  };
  document.addEventListener("visibilitychange", onVisibility);

  const draw = () => {
    if (!context) return;
    const ctx = context;
    const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    sky.addColorStop(0, "#091427");
    sky.addColorStop(0.68, "#173855");
    sky.addColorStop(1, "#183242");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // City blocks slide at different rates to give the runner a clear sense of speed.
    for (let index = 0; index < 15; index++) {
      const blockWidth = 46 + ((index * 23) % 43);
      const x = ((((index * 83 - scroll * 0.19) % (WIDTH + 110)) + WIDTH + 110) % (WIDTH + 110)) - 55;
      const blockHeight = 56 + ((index * 37) % 104);
      ctx.fillStyle = index % 3 === 0 ? "#254762" : "#1c3854";
      ctx.fillRect(x, GROUND - blockHeight, blockWidth, blockHeight);
      ctx.fillStyle = index % 2 ? "#71d4ef55" : "#ffd37a66";
      for (let windowY = GROUND - blockHeight + 15; windowY < GROUND - 10; windowY += 19)
        for (let windowX = x + 9; windowX < x + blockWidth - 5; windowX += 17)
          if ((Math.floor(windowX + windowY) + index) % 3 !== 0) ctx.fillRect(windowX, windowY, 5, 7);
    }
    ctx.fillStyle = "#0d1f32";
    ctx.fillRect(0, GROUND, WIDTH, HEIGHT - GROUND);
    ctx.fillStyle = "#49d5e9";
    ctx.fillRect(0, GROUND, WIDTH, 4);
    ctx.fillStyle = "#83eaff55";
    for (let stripe = 0; stripe < 13; stripe++) {
      const x = ((((stripe * 95 - scroll * 0.8) % (WIDTH + 50)) + WIDTH + 50) % (WIDTH + 50)) - 25;
      ctx.fillRect(x, GROUND + 24, 38, 3);
    }

    for (const bit of bits) {
      if (bit.taken) continue;
      bit.pulse += 0.09;
      const glow = 9 + Math.sin(bit.pulse) * 2;
      ctx.save();
      ctx.translate(bit.x, bit.y);
      ctx.rotate(Math.sin(bit.pulse * 0.6) * 0.12);
      ctx.shadowColor = "#ffd35d";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#ffcf54";
      roundedRect(ctx, -glow / 2, -glow / 2, glow, glow, 2);
      ctx.fill();
      ctx.fillStyle = "#fff3b3";
      ctx.fillRect(-1, -3, 2, 6);
      ctx.restore();
    }
    for (const hazard of hazards) {
      ctx.shadowColor = "#d47dff";
      ctx.shadowBlur = 14;
      const gradient = ctx.createLinearGradient(hazard.x, GROUND - hazard.height, hazard.x, GROUND);
      gradient.addColorStop(0, "#ed92ff");
      gradient.addColorStop(1, "#7049df");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.moveTo(hazard.x, GROUND);
      ctx.lineTo(hazard.x + 9, GROUND - hazard.height * 0.62);
      ctx.lineTo(hazard.x + hazard.width * 0.32, GROUND - hazard.height);
      ctx.lineTo(hazard.x + hazard.width * 0.58, GROUND - hazard.height * 0.68);
      ctx.lineTo(hazard.x + hazard.width, GROUND - hazard.height * 0.9);
      ctx.lineTo(hazard.x + hazard.width, GROUND);
      ctx.closePath();
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffe1ff";
      ctx.fillRect(hazard.x + hazard.width * 0.35, GROUND - hazard.height * 0.65, 5, 4);
    }

    const playerX = 126;
    const playerW = 72;
    const playerH = 78;
    const playerY = GROUND - playerH - jumpHeight;
    if (host.runner.width >= 96 * 6 && host.runner.height >= 112 * 3) {
      ctx.save();
      ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable * 13) % 2 === 0 ? 0.5 : 1;
      ctx.shadowColor = "#54e0ff";
      ctx.shadowBlur = 12;
      const runFrame = Math.floor(scroll / 24) % 6;
      ctx.drawImage(host.runner, runFrame * 96, 2 * 112, 96, 112, playerX - 10, playerY - 7, playerW, playerH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#73daf2";
      roundedRect(ctx, playerX, playerY, playerW, playerH, 8);
      ctx.fill();
    }
    ctx.fillStyle = "#a6eaff88";
    ctx.fillRect(playerX - 20, GROUND - 4, 74, 4);
    if (!playing && !finished) {
      ctx.fillStyle = "#e6f5ff";
      ctx.textAlign = "center";
      ctx.font = "bold 22px system-ui";
      ctx.fillText("PACKET DASH", WIDTH / 2, 75);
      ctx.font = "15px system-ui";
      ctx.fillStyle = "#bdd0e5";
      ctx.fillText("Collect the golden data · jump the purple glitches", WIDTH / 2, 103);
    }
  };

  const tick = (time: number) => {
    if (!panel.isConnected) {
      cleanup();
      return;
    }
    const dt = lastFrame ? Math.min((time - lastFrame) / 1000, 0.05) : 0;
    lastFrame = time;
    if (playing && !document.hidden) {
      elapsed += dt;
      invulnerable = Math.max(0, invulnerable - dt);
      const speed = 255 + Math.min(190, elapsed * 4.2);
      scroll += speed * dt;
      distance += speed * dt;
      jumpVelocity -= 1260 * dt;
      jumpHeight = Math.max(0, jumpHeight + jumpVelocity * dt);
      if (jumpHeight === 0) jumpVelocity = 0;
      hazardTimer -= dt;
      bitTimer -= dt;
      if (hazardTimer <= 0) {
        const height = 31 + Math.random() * 15;
        hazards.push({ x: WIDTH + 28, width: 28 + Math.random() * 15, height, passed: false });
        hazardTimer = Math.max(0.78, 1.38 - elapsed * 0.006) + Math.random() * 0.42;
      }
      if (bitTimer <= 0) {
        const y = GROUND - 48 - Math.random() * 55;
        bits.push({ x: WIDTH + 14, y, taken: false, pulse: 0 });
        bitTimer = 0.72 + Math.random() * 0.63;
      }
      for (const hazard of hazards) {
        hazard.x -= speed * dt;
        const playerLeft = 126 + 7;
        const playerRight = 126 + 38;
        const playerBottom = GROUND - jumpHeight - 2;
        const playerTop = playerBottom - 49;
        if (
          invulnerable <= 0 &&
          playerRight > hazard.x + 4 &&
          playerLeft < hazard.x + hazard.width - 4 &&
          playerBottom > GROUND - hazard.height + 4 &&
          playerTop < GROUND
        ) {
          shields--;
          invulnerable = 1.05;
          hazard.x = -100;
          feedback.textContent = shields
            ? `Glitch hit · ${shields} shields left. Keep running!`
            : "All shields are gone. Your code adventure is safe; try another run.";
          if (shields <= 0) finish();
        }
      }
      for (const bit of bits) {
        bit.x -= speed * dt;
        const centerX = 148;
        if (!bit.taken && Math.abs(bit.x - centerX) < 30 && Math.abs(bit.y - (GROUND - jumpHeight - 30)) < 38) {
          bit.taken = true;
          collected++;
        }
      }
      hazards = hazards.filter((hazard) => hazard.x + hazard.width > -20);
      bits = bits.filter((bit) => bit.x > -20 && !bit.taken);
      if (elapsed >= ROUND_SECONDS) finish();
      refreshReadout();
    }
    draw();
    frameId = requestAnimationFrame(tick);
  };
  if (context) draw();
  frameId = requestAnimationFrame(tick);
}
