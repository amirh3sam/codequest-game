import type Phaser from "phaser";
import { BEACON_EVENTS } from "../content/community-beacon";
import { canLightBeacon } from "../core/discoveries";
import type { GameState } from "../core/state";
import { BEACON_POSITION, BEACON_SOLID } from "./beacon-layout";

export class CommunityBeacon {
  private group: Phaser.GameObjects.Container;
  private art: Phaser.GameObjects.Graphics;
  private lights: Phaser.GameObjects.Graphics;
  private title: Phaser.GameObjects.Text;
  private status: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, interact: () => void) {
    const { x, y } = BEACON_POSITION;
    this.lights = scene.add.graphics().setDepth(2);
    this.group = scene.add.container(x, y).setDepth(y).setName("community-beacon");
    this.art = scene.add.graphics();
    this.title = scene.add
      .text(0, -49, "COMMUNITY\nBEACON", {
        fontFamily: "Consolas",
        fontSize: "9px",
        fontStyle: "bold",
        align: "center",
        color: "#c1d9e5",
      })
      .setOrigin(0.5);
    this.status = scene.add
      .text(0, -23, "OFFLINE", {
        fontFamily: "Consolas",
        fontSize: "7px",
        color: "#b3c6d8",
      })
      .setOrigin(0.5);
    this.group.add([this.art, this.title, this.status]);
    this.group.setSize(58, 136).setInteractive({ useHandCursor: true }).on("pointerdown", interact);
    this.sync(null);
  }

  get position() {
    return this.group.visible ? BEACON_POSITION : null;
  }
  get solids() {
    return this.group.visible ? [BEACON_SOLID] : [];
  }

  sync(state: GameState | null): void {
    const visible = state?.currentArea === "variables",
      choice = state?.discoveries?.beacon;
    const event = choice ? BEACON_EVENTS[choice] : undefined;
    const available = state ? canLightBeacon(state) : false;
    const tint = event?.tint ?? (available ? 0xffcf87 : 0x7894a7);
    this.group.setVisible(visible).setData({ choice: choice ?? null, restored: Boolean(choice), available });
    this.lights.setVisible(visible).clear();
    this.art.clear();
    this.art.fillStyle(0x0b2033, 0.35).fillEllipse(0, 0, 61, 18);
    this.art.fillStyle(0x314b61).fillRoundedRect(-23, -15, 46, 15, 4);
    this.art.fillStyle(0x506e81).fillRect(-4, -31, 8, 21);
    this.art.fillStyle(0x13263e).fillRoundedRect(-29, -70, 58, 52, 6);
    this.art.lineStyle(2, tint).strokeRoundedRect(-29, -70, 58, 52, 6);
    this.art.fillStyle(tint, 0.12).fillRoundedRect(-24, -65, 48, 39, 3);
    this.art.fillStyle(tint).fillCircle(-17, -7, 2).fillCircle(17, -7, 2);
    this.title
      .setText(event ? event.title.toUpperCase().replace(" ", "\n") : "COMMUNITY\nBEACON")
      .setColor(event?.color ?? "#c1d9e5");
    this.status.setText(event ? "ON AIR" : available ? "MESSAGE!" : "OFFLINE");
    if (event) {
      const { x, y } = BEACON_POSITION;
      this.lights.fillStyle(tint, 0.1).fillRoundedRect(x - 29, y + 8, 58, 74, 8);
      for (const side of [-1, 1]) {
        for (let step = 0; step < 4; step++) {
          const lx = x + side * 25,
            ly = y + 16 + step * 19;
          this.lights.fillStyle(tint, 0.12).fillCircle(lx, ly, 9);
          this.lights.fillStyle(tint).fillRoundedRect(lx - 2, ly - 3, 4, 6, 1);
        }
      }
      if (choice === "garden") {
        this.art.lineStyle(2, tint).lineBetween(0, -65, 0, -58);
        this.art.fillStyle(tint).fillEllipse(-3, -64, 6, 3).fillEllipse(3, -61, 6, 3);
      } else {
        this.art.lineStyle(1, tint).strokeRoundedRect(-6, -66, 12, 6, 2);
        this.art.lineBetween(-4, -63, -1, -63).lineBetween(-2.5, -64.5, -2.5, -61.5);
        this.art.fillStyle(tint).fillCircle(3, -63, 1);
      }
    }
  }
}
