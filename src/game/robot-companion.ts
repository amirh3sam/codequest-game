import type Phaser from "phaser";
import type { GameState, Position } from "../core/state";
import type { CollisionWorld } from "./collision";
import { canStandAt, moveWithCollisions } from "./collision";
import { districtLayout } from "./district-layout";
import { findWalkingRoute } from "./navigation";

/** Uses the same foot clearance and route planner as the player; it never becomes an extra wall. */
export class RobotCompanion {
  readonly root: Phaser.GameObjects.Container;
  private art: Phaser.GameObjects.Graphics;
  private name: Phaser.GameObjects.Text;
  private state: GameState | null = null;
  private route: Position[] = [];
  private destination?: Position;
  private replanAt = 0;
  private tripKey = "";
  private arrived = false;
  private appearance = "";
  private world: () => CollisionWorld;
  private arrival: (id: string, next: number) => void;
  constructor(
    scene: Phaser.Scene,
    world: () => CollisionWorld,
    arrival: (id: string, next: number) => void,
    interact: () => void,
  ) {
    this.world = world;
    this.arrival = arrival;
    this.root = scene.add.container(0, 0).setName("robot-companion").setVisible(false);
    this.art = scene.add.graphics();
    this.name = scene.add
      .text(0, -37, "Pixel", {
        fontFamily: "Consolas",
        fontSize: "9px",
        color: "#e6fcff",
        backgroundColor: "#102e46",
        padding: { x: 4, y: 2 },
      })
      .setOrigin(0.5, 1);
    // Only the visible robot body accepts clicks; the name plate and nearby road remain free.
    const hit = scene.add
      .rectangle(0, -15, 27, 30, 0xffffff, 0.001)
      .setInteractive({ cursor: "var(--cursor-action)" })
      .on("pointerdown", interact);
    this.root.add([this.art, this.name, hit]);
    this.draw(0x6be9ef);
  }
  private draw(color: number, antenna = "standard") {
    const g = this.art.clear();
    g.fillStyle(0x092134, 0.28).fillEllipse(0, 1, 32, 10);
    g.fillStyle(0x132b42).fillRoundedRect(-14, -11, 8, 13, 3).fillRoundedRect(6, -11, 8, 13, 3);
    g.fillStyle(color).fillRoundedRect(-12, -28, 24, 22, 6);
    g.lineStyle(1, 0xd7fcff, 0.9).strokeRoundedRect(-12, -28, 24, 22, 6);
    g.fillStyle(0x132d46).fillRoundedRect(-9, -24, 18, 9, 3);
    g.fillStyle(0xc5ffed).fillCircle(-4, -20, 2).fillCircle(4, -20, 2);
    if (antenna === "double") {
      for (const x of [-5, 5]) {
        g.lineStyle(2, color).lineBetween(x, -28, x, -33);
        g.fillStyle(0xffd085).fillCircle(x, -34, 2);
      }
    } else {
      g.lineStyle(2, color).lineBetween(0, -28, 0, -33);
      if (antenna === "dish") g.fillStyle(0xd7fcff).fillEllipse(0, -32, 13, 5);
      else g.fillStyle(0xffd085).fillCircle(0, -34, 2);
    }
    g.fillStyle(0xffd085).fillRect(-4, -10, 8, 3);
  }
  sync(state: GameState | null, hero: Position): void {
    const old = this.state;
    this.state = state;
    const visible = !!state && (state.journey?.companion?.enabled ?? state.beginner?.status === "complete");
    this.root.setVisible(visible);
    if (!state || !visible) {
      this.route = [];
      return;
    }
    this.name.setText(state.beginner?.robotName ?? "Pixel");
    const color = state.journey?.room?.robot ?? "cyan",
      antenna = state.journey?.room?.antenna ?? "standard",
      appearance = `${color}:${antenna}`;
    if (appearance !== this.appearance) {
      this.draw({ cyan: 0x6be9ef, rose: 0xf3a4cc, gold: 0xf4cf78 }[color], antenna);
      this.appearance = appearance;
    }
    this.root.setData("appearance", appearance);
    if (
      !old ||
      old.adventureId !== state.adventureId ||
      old.currentArea !== state.currentArea ||
      !canStandAt(this.root, this.world())
    ) {
      const candidates = [
        { x: hero.x - 34, y: hero.y },
        { x: hero.x + 34, y: hero.y },
        { x: hero.x, y: hero.y + 30 },
        hero,
      ];
      const spawn = candidates.find((p) => canStandAt(p, this.world())) ?? hero;
      this.root.setPosition(spawn.x, spawn.y);
      this.route = [];
      this.destination = undefined;
    }
    const trip = state.journey?.companion?.trip;
    const key = trip && trip.area === state.currentArea && trip.next < 3 ? `${trip.id}:${trip.next}` : "";
    if (key !== this.tripKey) {
      this.tripKey = key;
      this.route = [];
      this.destination = undefined;
      this.arrived = false;
      this.replanAt = 0;
    }
    this.root.setData("delivery-next", trip?.next ?? 0);
  }
  update(time: number, delta: number, hero: Position): void {
    const s = this.state;
    if (!s || !this.root.visible) return;
    const trip = s.journey?.companion?.trip;
    const active = trip && trip.area === s.currentArea && trip.next < 3;
    const stop = active ? districtLayout(s.currentArea).tasks[trip.stops[trip.next] - 1] : undefined;
    const target = stop ? { x: stop.x, y: stop.y + 42 } : { x: hero.x - 34, y: hero.y + 8 };
    if (
      time >= this.replanAt &&
      (!this.destination ||
        Math.hypot(target.x - this.destination.x, target.y - this.destination.y) > 24 ||
        !this.route.length)
    ) {
      this.replanAt = time + 750;
      const route = findWalkingRoute(this.root, target, this.world());
      this.route = route?.points ?? [];
      this.destination = route?.destination;
    }
    while (this.route[0] && Math.hypot(this.route[0].x - this.root.x, this.route[0].y - this.root.y) < 1)
      this.route.shift();
    const next = this.route[0];
    if (next) {
      const dx = next.x - this.root.x,
        dy = next.y - this.root.y,
        d = Math.hypot(dx, dy),
        step = Math.min(d, (135 * Math.min(delta, 40)) / 1000);
      const p = moveWithCollisions({ x: this.root.x, y: this.root.y }, (dx / d) * step, (dy / d) * step, this.world());
      this.root.setPosition(p.x, p.y);
    }
    this.root.setDepth(this.root.y + 1);
    if (
      active &&
      this.destination &&
      Math.hypot(this.root.x - this.destination.x, this.root.y - this.destination.y) < 2 &&
      !this.arrived &&
      Math.hypot(this.destination.x - target.x, this.destination.y - target.y) < 64
    ) {
      this.arrived = true;
      this.arrival(trip.id, trip.next + 1);
    }
  }
}
