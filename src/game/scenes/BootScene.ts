import Phaser from "phaser";

/** Placeholder first scene; replaced by the real Title screen in M1. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, "CodeQuest", { fontFamily: "monospace", fontSize: "48px", color: "#ffd166" })
      .setOrigin(0.5);
  }
}
