import Phaser from "phaser";
import type { AreaContent } from "../../content/schema";
import village from "../../content/village.json" with { type: "json" };
import { canFightBoss, canSolveTask, type GameState, type Position } from "../../core/state";
import { buildAdventureWorld } from "../adventure-world";
import { SPRITES, TILESETS } from "../assets";
import { canStandAt, moveWithCollisions, type Solid } from "../collision";
import { createHeroTextures, type Facing, heroFrame } from "../hero-sprites";
import { createQuestProps } from "../quest-props";

type Marker = {
  id: string;
  x: number;
  y: number;
  icon: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  pad: Phaser.GameObjects.Arc;
  beacon: Phaser.GameObjects.Triangle;
  glow: Phaser.GameObjects.Arc;
  group: Phaser.GameObjects.Container;
  plate: Phaser.GameObjects.Graphics | null;
};
export type VillageCallbacks = {
  interact(id: string): void;
  position(position: Position): void;
  message(text: string): void;
};

export class BootScene extends Phaser.Scene {
  private hero!: Phaser.GameObjects.Image;
  private shadow!: Phaser.GameObjects.Ellipse;
  private prompt!: Phaser.GameObjects.Text;
  private keys: Record<string, Phaser.Input.Keyboard.Key> = {};
  private markers: Marker[] = [];
  private districtLabel!: Phaser.GameObjects.Text;
  private solids: Solid[] = [];
  private state: GameState | null = null;
  private area: AreaContent | null = null;
  private callbacks: VillageCallbacks | null = null;
  private blocked = true;
  private position = { ...village.spawn };
  private dirtyPosition = false;
  private lastSave = 0;
  private facing: Facing = "south";
  private walked = 0;
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  constructor() {
    super("boot");
  }
  preload(): void {
    this.load.image("hero-source", `${import.meta.env.BASE_URL}assets/tech-city/developers.png`);
    this.load.image("quest-props-source", `${import.meta.env.BASE_URL}assets/tech-city/coding-stations.png`);
    this.load.image("adventure-world", `${import.meta.env.BASE_URL}assets/tech-city/city-ground.png`);
    this.load.image("environment-source", `${import.meta.env.BASE_URL}assets/tech-city/city-objects.png`);
    for (const tileset of TILESETS) {
      this.load.spritesheet(tileset.key, `${import.meta.env.BASE_URL}${tileset.path}`, {
        frameWidth: tileset.tileSize,
        frameHeight: tileset.tileSize,
        spacing: tileset.spacing,
      });
    }
  }
  create(): void {
    createHeroTextures(this);
    createQuestProps(this);
    this.cameras.main.setBackgroundColor("#7fa55b");
    this.solids = buildAdventureWorld(this, this.reducedMotion);
    this.cameras.main.setBounds(0, 0, village.world.width, village.world.height).setRoundPixels(true);
    this.marker("lesson", village.lesson.x, village.lesson.y, SPRITES.scroll, "Quick guide");
    for (const [index, spot] of village.tasks.entries())
      this.marker(`variables-${index + 1}`, spot.x, spot.y, { texture: "tech-props", frame: 0 }, `${index + 1}`);
    this.marker("boss", village.boss.x, village.boss.y, SPRITES.boss, "Firewall");
    this.districtLabel = this.add
      .text(768, 294, "VALUES / DATA HUB", { fontFamily: "Consolas", fontSize: "15px", color: "#9ae9ff" })
      .setOrigin(0.5)
      .setDepth(2)
      .setAlpha(0.7);
    this.shadow = this.add.ellipse(96, 415, 28, 10, 0x1c3b2d, 0.3).setDepth(3);
    this.hero = this.add
      .image(96, 400, SPRITES.heroBoy.texture, SPRITES.heroBoy.frame)
      .setScale(0.68)
      .setOrigin(0.5, 1)
      .setDepth(420)
      .setVisible(false);
    this.shadow.setVisible(false);
    this.prompt = this.add
      .text(480, 512, "", {
        fontFamily: "monospace",
        fontSize: "12px",
        color: "#ffebb8",
        backgroundColor: "#152e28",
        padding: { x: 14, y: 8 },
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(1000)
      .setVisible(false);
    if (this.input.keyboard)
      this.keys = this.input.keyboard.addKeys("W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE", false) as Record<
        string,
        Phaser.Input.Keyboard.Key
      >;
    for (const name of ["E", "SPACE"]) this.keys[name]?.on("down", () => this.interactClosest());
    this.game.events.emit("village-ready");
  }
  private marker(id: string, x: number, y: number, sprite: { texture: string; frame: number }, title: string): void {
    const chest = id !== "lesson" && id !== "boss";
    this.add.ellipse(x + 3, y, 37, 14, 0x233f34, 0.22).setDepth(1);
    const glow = this.add.circle(x, y - 6, 33, 0x55cfff, 0.07).setDepth(1);
    const pad = this.add
      .circle(x, y, 25, 0x233f34, 0.08)
      .setStrokeStyle(1, 0x65cfff, 0.5)
      .setDepth(1)
      .setInteractive({ useHandCursor: true });
    const group = this.add.container(x, y).setDepth(y).setName(id);
    const icon = this.add
      .image(0, 4, sprite.texture, sprite.frame)
      .setOrigin(0.5, 1)
      .setScale(id === "boss" ? 0.86 : id === "lesson" ? 0.52 : 0.58);
    group.add(icon);
    const plate = chest ? this.add.graphics() : null;
    if (plate) {
      plate.fillStyle(0x102139).fillRoundedRect(-10, -19, 20, 14, 2);
      plate.lineStyle(1, 0x65cfff).strokeRoundedRect(-10, -19, 20, 14, 2);
      group.add(plate);
    }
    const label = this.add
      .text(0, chest ? -12 : id === "boss" ? -95 : -61, title, {
        fontFamily: "Consolas",
        fontStyle: "bold",
        fontSize: chest ? "11px" : "11px",
        color: "#def5ff",
        ...(chest ? {} : { backgroundColor: "#14251ee6", padding: { x: 7, y: 4 } }),
      })
      .setOrigin(0.5);
    if (chest) label.setName("task-number");
    group.add(label);
    const beacon = this.add.triangle(0, chest ? -51 : -109, 0, 0, 10, 0, 5, 5, 0x7ce3ff);
    group.add(beacon);
    if (!this.reducedMotion) {
      this.tweens.add({
        targets: beacon,
        y: beacon.y - 5,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut",
      });
      this.tweens.add({ targets: glow, alpha: 0.15, scale: 1.15, duration: 1500, yoyo: true, repeat: -1 });
      if (id === "lesson")
        this.tweens.add({ targets: icon, y: -1, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    const marker = { id, x, y, icon, label, pad, beacon, glow, group, plate };
    this.solids.push({
      id,
      x: x - (chest ? 24 : 16),
      y: y - (chest ? 24 : 16),
      width: chest ? 48 : 32,
      height: chest ? 25 : 18,
    });
    pad.on("pointerdown", () => {
      if (!this.blocked) {
        if (this.distance(marker) <= 68) this.interact(marker);
        else this.callbacks?.message("Walk closer, then press E to interact.");
      }
    });
    this.markers.push(marker);
  }
  setSession(state: GameState | null, area: AreaContent | null, callbacks: VillageCallbacks): void {
    const previous = this.state;
    this.state = state;
    this.area = area;
    this.callbacks = callbacks;
    this.hero.setVisible(Boolean(state));
    this.shadow.setVisible(Boolean(state));
    if (!state || !area) {
      this.cameras.main.stopFollow().centerOn(village.world.width / 2, village.world.height / 2);
      return;
    }
    const changedDistrict = previous?.currentArea !== state.currentArea;
    if (changedDistrict) {
      let index = 0;
      for (const marker of this.markers) {
        if (marker.id === "lesson") continue;
        if (marker.id === "boss") {
          marker.label.setText(area.boss.name.replace(/^The /, ""));
          continue;
        }
        const task = area.tasks[index++];
        if (!task) continue;
        const solid = this.solids.find((entry) => entry.id === marker.id);
        if (solid) solid.id = task.id;
        marker.id = task.id;
        marker.group.setName(task.id);
      }
      const logic = area.id === "conditions";
      (this.children.getByName("district-ground") as Phaser.GameObjects.Image).setTint(logic ? 0xe4dfff : 0xffffff);
      this.districtLabel
        .setText(logic ? "IF / ELSE / DECISION NETWORK" : "VALUES / DATA HUB")
        .setColor(logic ? "#dfbaff" : "#9ae9ff");
      this.facing = "south";
      this.walked = 0;
    }
    const sprite = state.hero.kind === "girl" ? SPRITES.heroGirl : SPRITES.heroBoy;
    this.hero.setTexture(sprite.texture, heroFrame(this.facing));
    const location = state.position ?? village.spawn;
    this.position = this.canStand(location.x, location.y) ? { ...location } : { ...village.spawn };
    this.hero.setPosition(this.position.x, this.position.y + 4).setDepth(this.position.y);
    this.shadow.setPosition(this.position.x, this.position.y - 1);
    this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
    if (changedDistrict) this.cameras.main.centerOn(this.position.x, this.position.y);
    for (const marker of this.markers) {
      const solved =
        marker.id === "boss" ? state.areas[area.id].bossDefeated : state.areas[area.id].solved.includes(marker.id);
      const wasSolved =
        marker.id === "boss"
          ? previous?.areas[area.id].bossDefeated
          : previous?.areas[area.id].solved.includes(marker.id);
      const active =
        marker.id === "lesson" ||
        (marker.id === "boss"
          ? canFightBoss(state, area) || state.areas[area.id].bossDefeated
          : canSolveTask(state, area, marker.id) || solved);
      marker.icon.setAlpha(active ? 1 : 0.7).setTint(solved ? 0xb1e5b4 : active ? 0xffffff : 0xa1b7ac);
      if (marker.id !== "lesson" && marker.id !== "boss") marker.icon.setFrame(solved ? 1 : 0);
      marker.pad
        .setFillStyle(solved ? 0x71d2ad : active ? 0x65cfff : 0x273c52, active ? 0.2 : 0.15)
        .setStrokeStyle(1, solved ? 0xa8e9ba : active ? 0x8be6ff : 0x758b71, 0.7);
      marker.glow.setVisible(active && !solved);
      marker.beacon.setVisible(active && !solved && marker.id !== "lesson");
      if (marker.id !== "lesson" && marker.id !== "boss")
        marker.label.setText(marker.id.split("-")[1] ?? "").setColor(solved ? "#a8e9ba" : "#def5ff");
      if (previous && solved && !wasSolved) this.celebrate(marker.x, marker.y);
    }
  }
  private celebrate(x: number, y: number): void {
    if (this.reducedMotion) return;
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2;
      const spark = this.add.rectangle(x, y, 4, 4, i % 2 ? 0x7ce3ff : 0xa1e2cb).setDepth(800);
      this.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * 50,
        y: y + Math.sin(angle) * 40 - 15,
        angle: 100,
        alpha: 0,
        duration: 900,
        onComplete: () => spark.destroy(),
      });
    }
  }
  setBlocked(blocked: boolean): void {
    this.blocked = blocked;
    this.input.keyboard?.resetKeys();
    this.prompt.setVisible(false);
  }
  getPosition(): Position {
    return { ...this.position };
  }
  private canStand(x: number, y: number): boolean {
    return canStandAt({ x, y }, { bounds: village.walkBounds, solids: this.solids });
  }
  private distance(marker: Marker): number {
    return Math.hypot(marker.x - this.position.x, marker.y - this.position.y);
  }
  private interact(marker: Marker): void {
    this.callbacks?.position(this.getPosition());
    this.callbacks?.interact(marker.id);
  }
  private interactClosest(): void {
    if (this.blocked || !this.state || !this.area || document.activeElement?.matches("input, textarea, select")) return;
    const nearest = this.markers.reduce<Marker | null>(
      (best, marker) => (!best || this.distance(marker) < this.distance(best) ? marker : best),
      null,
    );
    if (nearest && this.distance(nearest) <= 68) this.interact(nearest);
  }
  update(time: number, delta: number): void {
    if (this.blocked || !this.state || !this.area || document.activeElement?.matches("input, textarea, select")) return;
    const pressed = (key: string) => this.keys[key]?.isDown;
    let dx = Number(pressed("D") || pressed("RIGHT")) - Number(pressed("A") || pressed("LEFT"));
    let dy = Number(pressed("S") || pressed("DOWN")) - Number(pressed("W") || pressed("UP"));
    const length = Math.hypot(dx, dy) || 1;
    const step = (150 * Math.min(delta, 40)) / 1000;
    dx *= step / length;
    dy *= step / length;
    const before = this.position;
    this.position = moveWithCollisions(before, dx, dy, { bounds: village.walkBounds, solids: this.solids });
    const distance = Math.hypot(this.position.x - before.x, this.position.y - before.y);
    const moving = distance > 0.01;
    if (moving) this.dirtyPosition = true;
    if (dx) this.facing = dx < 0 ? "west" : "east";
    else if (dy) this.facing = dy < 0 ? "north" : "south";
    this.walked = moving ? this.walked + distance : 0;
    const walking = moving && !this.reducedMotion;
    const sprite = this.state.hero.kind === "girl" ? "girl" : "boy";
    this.hero
      .setTexture(
        `hero-${walking ? "walk-" : ""}${sprite}`,
        heroFrame(this.facing, walking ? Math.floor(this.walked / 16) % 6 : 0, walking ? 6 : 4),
      )
      .setPosition(this.position.x, this.position.y + 4)
      .setDepth(this.position.y);
    this.shadow.setPosition(this.position.x, this.position.y - 1);
    if (this.dirtyPosition && (!moving || time - this.lastSave > 500)) {
      this.dirtyPosition = false;
      this.lastSave = time;
      this.callbacks?.position(this.getPosition());
    }
    const nearest = this.markers.reduce<Marker | null>(
      (best, marker) => (!best || this.distance(marker) < this.distance(best) ? marker : best),
      null,
    );
    const near = nearest && this.distance(nearest) <= 68 ? nearest : null;
    this.prompt.setVisible(Boolean(near));
    if (near)
      this.prompt.setText(
        `E / Space · ${near.id === "lesson" ? "Open the quick guide" : near.id === "boss" ? `Inspect ${this.area.boss.name}` : `Task ${near.id.split("-")[1]}`}`,
      );
  }
}
