import type Phaser from "phaser";
import { hubStage } from "../core/finale";
import type { GameState } from "../core/state";

// Status lights are mounted on the boss itself, without trailing wires.
const SIGNAL_ROW_Y = -24;

/** A compact front panel travels and depth-sorts with its boss building. */
export class HubSignals {
  private scene: Phaser.Scene;
  private group: Phaser.GameObjects.Container;
  private art: Phaser.GameObjects.Graphics;
  private labels: Phaser.GameObjects.Text[] = [];
  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.add.container(-4, 0).setName("hub-restoration");
    (scene.children.getByName("boss") as Phaser.GameObjects.Container).add(this.group);
    this.art = scene.add.graphics();
    this.group.add(this.art);
    for (const [index, text] of ["POWER", "SIGNAL", "CORE"].entries()) {
      const label = scene.add
        .text((index - 1) * 30, SIGNAL_ROW_Y + 12, text, {
          fontFamily: "Consolas",
          fontSize: "8px",
          color: "#e0f5ff",
        })
        .setOrigin(0.5);
      this.labels.push(label);
      this.group.add(label);
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
    this.group.setVisible(Boolean(state)).setData("stage", stage);
    this.art.clear();
    this.art.fillStyle(0x091a2b, 0.96).fillRoundedRect(-47, SIGNAL_ROW_Y - 10, 94, 30, 5);
    this.art.lineStyle(1, 0x52849d, 0.65).strokeRoundedRect(-47, SIGNAL_ROW_Y - 10, 94, 30, 5);
    const progress = state?.areas[state.currentArea];
    const statuses =
      state?.currentArea === "variables"
        ? [stage >= 1, stage >= 2, stage >= 3]
        : [true, progress?.solved.length === 8, Boolean(progress?.bossDefeated)];
    for (let index = 0; index < 3; index++) {
      const x = (index - 1) * 30,
        active = statuses[index],
        color = active ? 0x86efd2 : 0x46596f;
      this.labels[index]?.setText(
        (state?.currentArea === "variables" ? ["POWER", "SIGNAL", "CORE"] : ["POWER", "TASKS", "CORE"])[index] ?? "",
      );
      this.art.lineStyle(1, color).strokeCircle(x, SIGNAL_ROW_Y, 4);
      this.art.fillStyle(color, active ? 1 : 0.35).fillCircle(x, SIGNAL_ROW_Y, 2);
      if (active) this.art.fillStyle(color, 0.12).fillCircle(x, SIGNAL_ROW_Y, 6);
    }
  }
}
