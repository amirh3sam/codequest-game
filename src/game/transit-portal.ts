import type Phaser from "phaser";
import type { Position } from "../core/state";
import { containsClickShape, TRANSIT_CLICK_SHAPE } from "./click-shapes";
import type { Solid } from "./collision";

const PORTAL_SCALE = 0.65;

/** A physical city transit building with a holographic doorway and raised landing pad. */
export class TransitPortal {
  readonly view: Phaser.GameObjects.Container;
  private readonly art: Phaser.GameObjects.Graphics;
  private readonly field: Phaser.GameObjects.Graphics;
  private readonly name: Phaser.GameObjects.Text;
  private readonly status: Phaser.GameObjects.Text;
  private readonly zone: Phaser.GameObjects.Zone;
  private position = { x: 0, y: 0 };
  private active = false;

  constructor(scene: Phaser.Scene, reducedMotion: boolean, use: () => void) {
    this.view = scene.add.container(0, 0).setScale(PORTAL_SCALE).setName("level-portal");
    this.art = scene.add.graphics();
    this.field = scene.add.graphics();
    this.name = scene.add
      .text(0, -115, "CITY TRANSIT", {
        fontFamily: "Consolas",
        fontSize: "10px",
        fontStyle: "bold",
        color: "#dff7ff",
        backgroundColor: "#081728",
        padding: { x: 8, y: 4 },
      })
      .setOrigin(0.5);
    this.status = scene.add
      .text(0, 29, "OFFLINE", {
        fontFamily: "Consolas",
        fontSize: "9px",
        color: "#88a3bc",
        backgroundColor: "#081728",
        padding: { x: 6, y: 3 },
      })
      .setOrigin(0.5);
    this.zone = scene.add.zone(0, -42, 124, 151).setName("level-portal-zone");
    this.zone
      .setInteractive({
        cursor: "var(--cursor-action)",
        hitArea: TRANSIT_CLICK_SHAPE,
        hitAreaCallback: (_area: unknown, x: number, y: number) =>
          containsClickShape(
            TRANSIT_CLICK_SHAPE,
            x - this.zone.displayOriginX + this.zone.x,
            y - this.zone.displayOriginY + this.zone.y,
          ),
      })
      .disableInteractive(true);
    this.zone.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.active && pointer.event.target === scene.game.canvas) use();
    });
    this.view.add([this.art, this.field, this.name, this.status, this.zone]);
    if (!reducedMotion)
      scene.tweens.add({
        targets: this.field,
        alpha: 0.58,
        duration: 1600,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
  }

  sync(position: Position, active: boolean, level: number, visible: boolean): void {
    this.position = { ...position };
    this.active = active;
    this.view
      .setPosition(position.x, position.y)
      .setDepth(position.y + 12 * PORTAL_SCALE)
      .setVisible(visible);
    this.name.setText(`TRANSIT / ${String(level).padStart(2, "0")}`);
    this.status
      .setText(active ? "ONLINE · CHOOSE A MAP" : "DESTINATION LOCKED")
      .setColor(active ? "#a1ffea" : "#88a3bc");
    if (active) this.zone.setInteractive();
    else this.zone.disableInteractive(true);
    const glow = active ? 0x51efd2 : 0x657a95;
    const art = this.art.clear();
    const polygon = (points: [number, number][]) => {
      const first = points[0];
      if (!first) return;
      art.beginPath().moveTo(first[0], first[1]);
      for (const [x, y] of points.slice(1)) art.lineTo(x, y);
      art.closePath().fillPath();
    };
    art.fillStyle(0x030c19, 0.45).fillEllipse(3, 17, 140, 42);
    // Raised platform, steps, and inset route lights.
    art.fillStyle(0x20394c);
    polygon([
      [-62, -4],
      [0, -21],
      [62, -4],
      [62, 17],
      [0, 34],
      [-62, 17],
    ]);
    art.fillStyle(0x3d6173);
    polygon([
      [-62, -4],
      [0, -21],
      [62, -4],
      [0, 14],
    ]);
    art
      .lineStyle(2, glow, active ? 0.8 : 0.3)
      .lineBetween(-55, 5, 0, 20)
      .lineBetween(0, 20, 55, 5);
    art.fillStyle(0x446a7b).fillRoundedRect(-32, 17, 64, 7, 2);
    art.fillStyle(0x2a4b60).fillRoundedRect(-39, 24, 78, 7, 2);
    // Steel side towers and a glass canopy give the gate a building silhouette.
    for (const x of [-46, 46]) {
      art.fillStyle(0x142c43).fillRoundedRect(x - 12, -99, 24, 108, 7);
      art.fillStyle(0x33556d).fillRoundedRect(x - 8, -94, 10, 96, 4);
      art.fillStyle(glow, active ? 0.9 : 0.35).fillRoundedRect(x + 4, -83, 3, 73, 1);
      art.fillStyle(0x8cacc4, 0.65).fillCircle(x, -90, 2);
    }
    art.fillStyle(0x2a4c66);
    polygon([
      [-59, -99],
      [-43, -113],
      [43, -113],
      [59, -99],
      [44, -88],
      [-44, -88],
    ]);
    art.lineStyle(2, glow, 0.65).lineBetween(-43, -111, 43, -111).lineBetween(-43, -89, 43, -89);
    art.fillStyle(0x08192d).fillRoundedRect(-33, -88, 66, 94, 24);
    const field = this.field.clear();
    field.fillStyle(active ? 0x268eac : 0x24374e, active ? 0.55 : 0.75).fillRoundedRect(-27, -82, 54, 84, 22);
    field.lineStyle(2, glow, 0.95).strokeRoundedRect(-27, -82, 54, 84, 22);
    if (active) {
      field.lineStyle(1, 0xb5fff4, 0.45);
      for (let y = -68; y < -5; y += 10) field.lineBetween(-18, y, 18, y);
      field.lineStyle(3, 0xc8fff4, 0.9).strokeEllipse(0, -40, 31, 57);
      field.fillStyle(0xffffff, 0.8).fillCircle(0, -41, 3);
    }
  }

  get solid(): Solid {
    return {
      id: "level-portal",
      x: this.position.x - 55 * PORTAL_SCALE,
      y: this.position.y - 15 * PORTAL_SCALE,
      width: 110 * PORTAL_SCALE,
      height: 39 * PORTAL_SCALE,
    };
  }
}
