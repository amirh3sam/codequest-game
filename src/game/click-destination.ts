import type Phaser from "phaser";
import type { Position } from "../core/state";
import type { WalkingRoute } from "./navigation";

/** World-space confirmation and route dots; no input hit areas or collision objects. */
export class ClickDestination {
  private target: Phaser.GameObjects.Container;
  private path: Phaser.GameObjects.Graphics;
  private ripple: Phaser.GameObjects.Graphics;
  private finishTimer?: Phaser.Time.TimerEvent;
  private scene: Phaser.Scene;
  private reducedMotion: boolean;

  constructor(scene: Phaser.Scene, reducedMotion: boolean) {
    this.scene = scene;
    this.reducedMotion = reducedMotion;
    this.path = scene.add.graphics().setDepth(1.8).setName("walking-route");
    this.target = scene.add.container(0, 0).setDepth(900).setVisible(false).setName("click-destination");
    this.ripple = scene.add.graphics().setDepth(901).setVisible(false).setName("click-feedback");
  }

  show(from: Position, requested: Position, route: WalkingRoute): void {
    this.clear();
    const color = route.adjusted ? 0xffd18a : 0x96f5e6;
    const art = this.scene.add.graphics();
    art.fillStyle(0x071c2b, 0.65).fillEllipse(0, 0, 30, 14);
    art.lineStyle(2, color, 0.9).strokeEllipse(0, 0, 30, 14);
    art.fillStyle(color, 0.85).fillCircle(0, 0, 2);
    art.lineStyle(2, color, 0.9);
    for (const sign of [-1, 1]) {
      art.lineBetween(sign * 21, -5, sign * 21, 5);
      art.lineBetween(sign * 21, -5, sign * 16, -9);
      art.lineBetween(sign * 21, 5, sign * 16, 9);
    }
    art.fillStyle(color).fillTriangle(-4, -21, 4, -21, 0, -15);
    this.target.removeAll(true).add(art);
    this.target.setPosition(route.destination.x, route.destination.y).setVisible(true).setAlpha(1).setScale(1);
    this.target.setData({ status: "walking", destination: route.destination, requested, adjusted: route.adjusted });
    this.ripple.clear().setPosition(requested.x, requested.y).setVisible(true).setAlpha(0.85).setScale(1);
    this.ripple.lineStyle(2, color, 0.7).strokeEllipse(0, 0, 24, 12);
    if (!this.reducedMotion) {
      this.scene.tweens.add({ targets: this.ripple, alpha: 0, scale: 2.4, duration: 480 });
      this.scene.tweens.add({ targets: this.target, alpha: 0.55, duration: 850, yoyo: true, repeat: -1 });
    } else this.ripple.setVisible(false);
    this.updatePath(from, route.points);
  }

  updatePath(from: Position, points: readonly Position[]): void {
    this.path.clear().fillStyle(0x9adfdc, 0.4);
    let previous = from;
    for (const next of points) {
      const length = Math.hypot(next.x - previous.x, next.y - previous.y);
      for (let n = 12; n < length - 6; n += 14)
        this.path.fillCircle(
          previous.x + ((next.x - previous.x) * n) / length,
          previous.y + ((next.y - previous.y) * n) / length,
          1.5,
        );
      previous = next;
    }
  }

  arrive(): void {
    this.path.clear();
    this.ripple.setVisible(false);
    this.scene.tweens.killTweensOf(this.target);
    this.target.setAlpha(1).setData("status", "arrived");
    if (!this.reducedMotion) this.scene.tweens.add({ targets: this.target, alpha: 0, duration: 600 });
    this.finishTimer = this.scene.time.delayedCall(650, () => this.target.setVisible(false));
  }

  clear(): void {
    this.finishTimer?.remove(false);
    this.finishTimer = undefined;
    this.scene.tweens.killTweensOf(this.target);
    this.scene.tweens.killTweensOf(this.ripple);
    this.target.setVisible(false).setData("status", "idle");
    this.ripple.setVisible(false);
    this.path.clear();
  }
}
