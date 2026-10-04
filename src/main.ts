import Phaser from "phaser";
import { BootScene } from "./game/scenes/BootScene";
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

// Test hook for Playwright (see tests/e2e).
(window as unknown as { __codequest: { game: Phaser.Game } }).__codequest = { game };
