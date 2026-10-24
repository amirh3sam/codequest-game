import type Phaser from "phaser";
import { LIGHT_COLORS, resolveLights } from "../core/map-lighting";
import type { GameState } from "../core/state";
import { BEACON_POSITION } from "./beacon-layout";
import { districtLayout } from "./district-layout";

export class CommunityBeacon {
  private group: Phaser.GameObjects.Container;
  private art: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private status: Phaser.GameObjects.Text;
  private spot: { x: number; y: number } = { ...BEACON_POSITION };
  constructor(scene: Phaser.Scene, interact: () => void) {
    this.group = scene.add.container(0, 0).setName("community-beacon");
    this.art = scene.add.graphics();
    this.title = scene.add
      .text(0, -49, "LIGHTING\nCONSOLE", {
        fontFamily: "Consolas",
        fontSize: "9px",
        fontStyle: "bold",
        align: "center",
        color: "#d6efff",
      })
      .setOrigin(0.5);
    this.status = scene.add
      .text(0, -23, "READY", { fontFamily: "Consolas", fontSize: "7px", color: "#aac9de" })
      .setOrigin(0.5);
    this.group.add([this.art, this.title, this.status]);
    this.group
      .setSize(58, 136)
      .setInteractive({ useHandCursor: true })
      .on("pointerdown", (pointer: Phaser.Input.Pointer) => {
        if (pointer.event.target === scene.game.canvas) interact();
      });
    this.sync(null);
  }
  get position() {
    return this.group.visible ? this.spot : null;
  }
  get solids() {
    return this.group.visible
      ? [{ id: "community-beacon", x: this.spot.x - 25, y: this.spot.y - 16, width: 50, height: 19 }]
      : [];
  }
  sync(state: GameState | null): void {
    const lesson = state ? districtLayout(state.currentArea).lesson : BEACON_POSITION;
    this.spot = state?.currentArea === "variables" ? { ...BEACON_POSITION } : { x: lesson.x + 83, y: lesson.y + 3 };
    const lights = state?.areas[state.currentArea].lighting;
    const command = resolveLights(lights, "all");
    const tint = command.power === "online" ? LIGHT_COLORS[command.color] : 0x66798b;
    this.group
      .setPosition(this.spot.x, this.spot.y)
      .setDepth(this.spot.y)
      .setVisible(Boolean(state))
      .setData({ choice: state?.discoveries?.beacon ?? null, restored: Boolean(lights), available: true });
    this.art.clear();
    this.art.fillStyle(0x0b2033, 0.35).fillEllipse(0, 0, 61, 18);
    this.art.fillStyle(0x314b61).fillRoundedRect(-23, -15, 46, 15, 4);
    this.art.fillStyle(0x506e81).fillRect(-4, -31, 8, 21);
    this.art.fillStyle(0x13263e).fillRoundedRect(-29, -70, 58, 52, 6);
    this.art.lineStyle(2, tint).strokeRoundedRect(-29, -70, 58, 52, 6);
    this.art.fillStyle(tint, 0.12).fillRoundedRect(-24, -65, 48, 39, 3);
    this.art.fillStyle(tint).fillCircle(-17, -7, 2).fillCircle(17, -7, 2);
    this.status.setText(lights ? (command.power === "online" ? "LIGHTS ON" : "LIGHTS OFF") : "READY / FREE");
  }
}
