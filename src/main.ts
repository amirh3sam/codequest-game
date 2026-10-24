import Phaser from "phaser";
import { loadGame, saveGame } from "./core/save";
import { createGame } from "./core/state";
import { canStandAt, moveWithCollisions } from "./game/collision";
import { findWalkingRoute } from "./game/navigation";
import { BootScene } from "./game/scenes/BootScene";
import type { Lang } from "./runners/types";
import { WorkerHost } from "./runners/worker-host";
import { GameApp } from "./ui/app";
import "./style.css";

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 540,
  backgroundColor: "#1b1b2f",
  pixelArt: true,
  audio: { noAudio: true }, // Effects use the single, gesture-unlocked Web Audio context in game/audio.ts.
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene],
});

game.events.once("village-ready", () => {
  const root = document.getElementById("ui");
  if (root) new GameApp(root, game.scene.getScene("boot") as BootScene);
});

// Test hooks for Playwright, only in `vite build --mode e2e` (see tests/e2e).
if (import.meta.env.MODE === "e2e") {
  (window as unknown as { __codequest: unknown }).__codequest = {
    game,
    createRunner: (lang: Lang) => new WorkerHost(lang),
    createGame,
    position: () => (game.scene.getScene("boot") as BootScene).getPosition(),
    loadGame,
    saveGame,
    navigation: { plan: findWalkingRoute, move: moveWithCollisions, stand: canStandAt },
  };
}
