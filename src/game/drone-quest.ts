import type Phaser from "phaser";
import { dronePilot } from "../content/drone-pilot";
import { isDroneRepaired } from "../core/drone-mission";
import type { GameState, Position } from "../core/state";
import { SPRITES } from "./assets";
import { courierSolids } from "./drone-layout";

export class DroneQuest {
  private objects: Phaser.GameObjects.Container[] = [];
  private drone: Phaser.GameObjects.Container;
  private gate: Phaser.GameObjects.Container;
  private gateArt: Phaser.GameObjects.Graphics;
  private battery: Phaser.GameObjects.Graphics;
  private status: Phaser.GameObjects.Text;
  private flight?: Phaser.Tweens.Tween;
  private state: GameState | null = null;
  private open = false;
  private visible = false;
  private pending = false;
  private scene: Phaser.Scene;
  private reducedMotion: boolean;
  private courierAvatar: Phaser.GameObjects.Image;
  private courierName: Phaser.GameObjects.Text;
  constructor(scene: Phaser.Scene, reducedMotion: boolean, interact: (point: Position) => void) {
    this.scene = scene;
    this.reducedMotion = reducedMotion;
    const { courier, pad, dock, gate } = dronePilot.world;
    const kai = scene.add.container(courier.x, courier.y).setName("courier-kai").setDepth(courier.y);
    kai.add(scene.add.ellipse(0, 0, 30, 10, 0x102d42, 0.35));
    this.courierAvatar = scene.add
      .image(0, 4, SPRITES.heroGirl.texture, SPRITES.heroGirl.frame)
      .setOrigin(0.5, 1)
      .setScale(0.6)
      .setInteractive({ cursor: "var(--cursor-action)", pixelPerfect: true, alphaTolerance: 40 })
      .on("pointerdown", () => interact(courier));
    kai.add(this.courierAvatar);
    const parcel = scene.add.graphics().fillStyle(0xffbd6a).fillRoundedRect(12, -27, 15, 18, 3);
    parcel.lineStyle(2, 0xffe5b1).lineBetween(19, -26, 19, -10);
    kai.add(parcel);
    this.courierName = scene.add
      .text(0, -73, "KAI / COURIER", {
        fontFamily: "Consolas",
        fontSize: "10px",
        color: "#e8fcff",
        backgroundColor: "#10344d",
        padding: { x: 6, y: 4 },
      })
      .setOrigin(0.5);
    kai.add(this.courierName);
    this.objects.push(kai);

    const yard = scene.add.container(0, 0).setDepth(2).setName("courier-yard");
    const floor = scene.add.graphics();
    floor.fillStyle(0x18364c, 0.9).fillRoundedRect(712, 250, 112, 96, 10);
    floor.lineStyle(1, 0x71bed6, 0.7).strokeRoundedRect(712, 250, 112, 96, 10);
    for (let y = 270; y < 340; y += 20) {
      floor
        .lineStyle(2, 0x80d6eb, 0.3)
        .beginPath()
        .moveTo(755, y + 5)
        .lineTo(768, y)
        .lineTo(781, y + 5)
        .strokePath();
    }
    floor.fillStyle(0x314e63).fillRoundedRect(704, 250, 8, 96, 3).fillRoundedRect(824, 250, 8, 96, 3);
    floor.fillStyle(0x12324b).fillCircle(pad.x, pad.y, 31);
    floor.lineStyle(2, 0x65d8ef, 0.8).strokeCircle(pad.x, pad.y, 29);
    floor.lineStyle(1, 0x65d8ef, 0.3).strokeCircle(pad.x, pad.y, 35);
    yard.add(floor);
    yard.add(
      scene.add
        .text(pad.x, pad.y - 57, "DRONE / 03", {
          fontFamily: "Consolas",
          fontSize: "10px",
          color: "#b3edff",
          backgroundColor: "#17394b",
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5),
    );
    this.objects.push(yard);

    this.gate = scene.add
      .container(0, 0)
      .setDepth(gate.y + 1)
      .setName("courier-gate");
    this.gateArt = scene.add.graphics();
    this.gate.add(this.gateArt);
    this.status = scene.add
      .text(gate.x, gate.y + 14, "LANE OFFLINE", {
        fontFamily: "Consolas",
        fontSize: "10px",
        color: "#ffc38a",
        backgroundColor: "#173044",
        padding: { x: 5, y: 3 },
      })
      .setOrigin(0.5);
    this.gate.add(this.status);
    this.objects.push(this.gate);

    const receiver = scene.add.container(dock.x, dock.y).setDepth(2).setName("courier-receiver");
    receiver.add(
      scene.add
        .graphics()
        .lineStyle(2, 0x6ce5df)
        .strokeCircle(0, 0, 23)
        .lineStyle(1, 0x6ce5df, 0.35)
        .strokeCircle(0, 0, 29),
    );
    receiver
      .setSize(48, 48)
      .setInteractive({ cursor: "var(--cursor-action)" })
      .on("pointerdown", () => interact(dock));
    this.objects.push(receiver);

    this.drone = scene.add.container(pad.x, pad.y).setDepth(pad.y).setName("delivery-drone");
    const art = scene.add.graphics();
    art.fillStyle(0x092239, 0.3).fillEllipse(0, 3, 52, 14);
    art.lineStyle(5, 0x8ab3c5).lineBetween(-23, -28, 23, -4).lineBetween(23, -28, -23, -4);
    for (const x of [-23, 23])
      for (const y of [-28, -4]) {
        art.fillStyle(0x183447).fillCircle(x, y, 11).lineStyle(2, 0x84e6f5).strokeCircle(x, y, 11);
        art.lineStyle(2, 0xbdeffd, 0.8).lineBetween(x - 7, y, x + 7, y);
      }
    art.fillStyle(0xffc175).fillRoundedRect(-9, -9, 18, 19, 3);
    art.lineStyle(2, 0xffe2ad).lineBetween(0, -7, 0, 8);
    art.fillStyle(0xe2f5ff).fillRoundedRect(-15, -30, 30, 23, 8);
    art.fillStyle(0x143d5d).fillRoundedRect(-10, -25, 20, 9, 4);
    art.fillStyle(0x56e4fc).fillCircle(0, -20, 3);
    this.battery = scene.add.graphics();
    this.drone.add([art, this.battery]);
    this.objects.push(this.drone);
  }
  get solids() {
    return this.visible ? courierSolids(this.open) : [];
  }
  get canLaunch(): boolean {
    return this.visible && this.pending && !this.flight;
  }
  nearby(position: Position): Position | null {
    if (!this.visible) return null;
    const points = this.open ? [dronePilot.world.courier, dronePilot.world.dock] : [dronePilot.world.courier];
    return points.reduce((a, b) =>
      Math.hypot(a.x - position.x, a.y - position.y) < Math.hypot(b.x - position.x, b.y - position.y) ? a : b,
    );
  }
  sync(state: GameState | null): void {
    const repaired = state ? isDroneRepaired(state) : false;
    const sameAdventure = this.state?.lang === state?.lang && this.state !== null;
    if (!sameAdventure || !repaired) this.pending = false;
    else if (!this.open && repaired) this.pending = true;
    this.state = state;
    const courierIsGirl = state?.hero.kind === "boy";
    this.courierAvatar.setTexture(
      courierIsGirl ? SPRITES.heroGirl.texture : SPRITES.heroBoy.texture,
      courierIsGirl ? SPRITES.heroGirl.frame : SPRITES.heroBoy.frame,
    );
    this.courierName.setText(courierIsGirl ? "AVA / COURIER" : "KAI / COURIER");
    this.open = repaired;
    this.visible = state?.currentArea === "variables";
    if (!this.visible) this.cancel();
    for (const object of this.objects) object.setVisible(this.visible);
    this.paintGate();
    this.preview();
    if (!this.flight) this.rest();
  }
  preview(value = this.open ? 12 : 3): void {
    this.battery.clear().fillStyle(0x0e2839).fillRoundedRect(-16, -40, 32, 6, 2);
    this.battery.fillStyle(value === 12 ? 0x78efb8 : 0xffc175).fillRoundedRect(-15, -39, (30 * value) / 12, 4, 1);
    this.drone.setData("charge", value);
  }
  private paintGate(): void {
    this.gate.setData("routeOpen", this.open);
    this.status.setText(this.open ? "COURIER LANE / OPEN" : "LANE OFFLINE").setColor(this.open ? "#91f2cf" : "#ffc38a");
    this.gateArt.clear();
    for (const { x, y } of [dronePilot.world.gate, dronePilot.world.northGate]) {
      this.gateArt
        .fillStyle(0x203c53)
        .fillRoundedRect(x - 59, y - 13, 10, 19, 2)
        .fillRoundedRect(x + 49, y - 13, 10, 19, 2);
      this.gateArt
        .fillStyle(this.open ? 0x6cf2b7 : 0xffb16e)
        .fillRect(x - 57, y - 12, 6, 4)
        .fillRect(x + 51, y - 12, 6, 4);
      if (!this.open) {
        this.gateArt.fillStyle(0x112d43, 0.95).fillRect(x - 49, y - 10, 98, 13);
        this.gateArt.lineStyle(2, 0xffb16e).lineBetween(x - 49, y - 7, x + 49, y - 7);
        for (let dx = -42; dx < 49; dx += 14)
          this.gateArt.lineStyle(2, 0xffc991, 0.6).lineBetween(x + dx, y + 1, x + dx + 7, y - 6);
      }
    }
  }
  private rest(): void {
    const p = this.open && !this.pending ? dronePilot.world.dock : dronePilot.world.pad;
    this.drone.setPosition(p.x, p.y).setDepth(p.y).setData("flying", false);
  }
  launch(done: () => void): void {
    if (!this.canLaunch) {
      done();
      return;
    }
    this.pending = false;
    if (this.reducedMotion) {
      this.rest();
      done();
      return;
    }
    this.drone.setData("flying", true).setDepth(900);
    this.flight = this.scene.tweens.add({
      targets: this.drone,
      y: this.drone.y - 55,
      duration: 550,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.flight = this.scene.tweens.add({
          targets: this.drone,
          x: dronePilot.world.dock.x,
          y: dronePilot.world.dock.y - 55,
          duration: 1100,
          ease: "Sine.easeInOut",
          onComplete: () => {
            this.flight = this.scene.tweens.add({
              targets: this.drone,
              y: dronePilot.world.dock.y,
              duration: 600,
              ease: "Sine.easeInOut",
              onComplete: () => {
                this.flight = undefined;
                this.rest();
                done();
              },
            });
          },
        });
      },
    });
  }
  cancel(): void {
    if (this.flight) {
      this.flight.stop();
      this.flight = undefined;
      this.pending = false;
    }
    this.rest();
  }
}
