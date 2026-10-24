import type Phaser from "phaser";
import village from "../content/village.json" with { type: "json" };
import { hubStage } from "../core/finale";
import type { GameState } from "../core/state";

// Keep all three indicators below the transit building and the nearby tree canopy.
const SIGNAL_ROW_Y = 175;
const SIGNAL_ROW_X = 16;

/** Inlaid status lights are part of the ground; the existing hub remains a solid foreground object. */
export class HubSignals {
  private scene: Phaser.Scene;
  private group: Phaser.GameObjects.Container;
  private art: Phaser.GameObjects.Graphics;
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.add.container(village.boss.x, village.boss.y).setDepth(2).setName("hub-restoration");
    this.art = scene.add.graphics();
    this.group.add(this.art);
    for (const [index, text] of ["POWER", "SIGNAL", "CORE"].entries()) {
      this.group.add(
        scene.add
          .text((index - 1) * 58 + SIGNAL_ROW_X, SIGNAL_ROW_Y + 20, text, {
            fontFamily: "Consolas",
            fontSize: "9px",
            color: "#e0f5ff",
            backgroundColor: "#102238e6",
            padding: { x: 5, y: 3 },
          })
          .setOrigin(0.5),
      );
    }
    this.sync(null);
  }
  reboot(): void {
    this.scene.tweens.killTweensOf(this.group);
    this.group.setAlpha(0.35);
    this.scene.tweens.add({
      targets: this.group,
      alpha: 1,
      duration: 340,
      yoyo: true,
      repeat: 3,
      onComplete: () => this.group.setAlpha(1),
    });
  }
  sync(state: GameState | null): void {
    const stage = state ? hubStage(state) : 0;
    this.group.setVisible(state?.currentArea === "variables").setData("stage", stage);
    this.art.clear();
    for (let index = 0; index < 3; index++) {
      const x = (index - 1) * 58 + SIGNAL_ROW_X,
        active = index < stage,
        color = active ? 0x86efd2 : 0x46596f;
      this.art
        .lineStyle(active ? 3 : 2, color, active ? 0.75 : 0.4)
        .lineBetween(x, SIGNAL_ROW_Y, x, SIGNAL_ROW_Y - 24)
        .lineBetween(x, SIGNAL_ROW_Y - 24, 0, 8);
      this.art.fillStyle(0x132a40, 0.85).fillCircle(x, SIGNAL_ROW_Y, 10);
      this.art.lineStyle(2, color).strokeCircle(x, SIGNAL_ROW_Y, 10);
      this.art.fillStyle(color, active ? 1 : 0.35).fillCircle(x, SIGNAL_ROW_Y, 4);
      if (active) this.art.fillStyle(color, 0.12).fillCircle(x, SIGNAL_ROW_Y, 17);
    }
  }
}
