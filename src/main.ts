import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene";
import type { Lang } from "./runners/types";
import "./style.css";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#1b1b2f",
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene],
});

// Test hooks for Playwright, only in `vite build --mode e2e` (see tests/e2e).
if (import.meta.env.MODE === "e2e") {
  import("./runners/worker-host").then(({ WorkerHost }) => {
    (window as unknown as { __codequest: unknown }).__codequest = {
      game,
      createRunner: (lang: Lang) => new WorkerHost(lang),
    };
  });
}
