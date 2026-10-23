import Phaser from "phaser";
import type { AreaContent } from "../../content/schema";
import village from "../../content/village.json" with { type: "json" };
import { canFightBoss, canSolveTask, type GameState, type Position } from "../../core/state";
import { buildAdventureWorld, type DistrictWorld } from "../adventure-world";
import { SPRITES, TILESETS } from "../assets";
import { gameAudio } from "../audio";
import { canStandAt, moveWithCollisions, type Solid } from "../collision";
import { CommunityBeacon } from "../community-beacon";
import { districtLayout } from "../district-layout";
import { DroneQuest } from "../drone-quest";
import { createHeroTextures, type Facing, heroFrame } from "../hero-sprites";
import { HubSignals } from "../hub-signals";
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
  shadow: Phaser.GameObjects.Ellipse;
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
  private droneQuest!: DroneQuest;
  private communityBeacon!: CommunityBeacon;
  private hubSignals!: HubSignals;
  private world!: DistrictWorld;
  private delivering = false;
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
  private touchAxis = { x: 0, y: 0 };
  private tapTarget: Position | null = null;
  private hubTour?: Phaser.Time.TimerEvent;
  private reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  constructor() {
    super("boot");
  }
  preload(): void {
    this.load.image("hero-source", `${import.meta.env.BASE_URL}assets/tech-city/developers.png`);
    this.load.image("quest-props-source", `${import.meta.env.BASE_URL}assets/tech-city/coding-stations.png`);
    this.load.image("adventure-world", `${import.meta.env.BASE_URL}assets/tech-city/city-ground.png`);
    this.load.image("logic-ground", `${import.meta.env.BASE_URL}assets/logic-junction/skyrail-ground.png`);
    this.load.image("routing-hub", `${import.meta.env.BASE_URL}assets/logic-junction/routing-hub.png`);
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
    this.createArcadeTexture();
    this.cameras.main.setBackgroundColor("#7fa55b");
    this.world = buildAdventureWorld(this, this.reducedMotion);
    this.cameras.main.setBounds(0, 0, village.world.width, village.world.height).setRoundPixels(true);
    this.marker("lesson", village.lesson.x, village.lesson.y, SPRITES.scroll, "Quick guide");
    for (const [index, spot] of village.tasks.entries())
      this.marker(`variables-${index + 1}`, spot.x, spot.y, { texture: "tech-props", frame: 0 }, `${index + 1}`);
    this.marker("boss", village.boss.x, village.boss.y, SPRITES.boss, "Firewall");
    this.marker("arcade", village.arcade.x, village.arcade.y, { texture: "packet-arcade", frame: 0 }, "Packet Dash");
    this.districtLabel = this.add
      .text(768, 382, "VALUES / DATA HUB", { fontFamily: "Consolas", fontSize: "15px", color: "#9ae9ff" })
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
    this.droneQuest = new DroneQuest(this, this.reducedMotion, (point) => {
      if (this.blocked) return;
      if (this.distance(point) <= 68) {
        this.callbacks?.position(this.getPosition());
        this.callbacks?.interact("courier");
      } else
        this.callbacks?.message(
          `Walk closer to ${this.state?.hero.kind === "boy" ? "Ava" : "Kai"} or the receiver, then press E.`,
        );
    });
    this.droneQuest.sync(null);
    this.communityBeacon = new CommunityBeacon(this, () => {
      const point = this.communityBeacon.position;
      if (this.blocked || !point) return;
      if (this.distance(point) <= 68) {
        this.callbacks?.position(this.getPosition());
        this.callbacks?.interact("discovery-beacon");
      } else this.callbacks?.message("Walk closer to the community beacon, then press E.");
    });
    this.hubSignals = new HubSignals(this);
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
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (!this.blocked && this.state && pointer.event.target === this.game.canvas)
        this.tapTarget = this.cameras.main.getWorldPoint(pointer.x, pointer.y);
    });
    this.game.events.emit("village-ready");
  }
  private createArcadeTexture(): void {
    const art = this.add.graphics({ x: 0, y: 0 });
    art.fillStyle(0x13233d).fillRoundedRect(7, 3, 34, 49, 5);
    art.lineStyle(2, 0x74e5ff).strokeRoundedRect(7, 3, 34, 49, 5);
    art.fillStyle(0x091326).fillRoundedRect(11, 8, 26, 19, 3);
    art.fillStyle(0x44d6f0, 0.9).fillRoundedRect(14, 11, 20, 13, 2);
    art.fillStyle(0x92ffe4).fillCircle(24, 16, 3);
    art.fillStyle(0xffd16e).fillCircle(17, 34, 3);
    art.fillStyle(0xff7ba0).fillCircle(26, 34, 3);
    art.fillStyle(0x182943).fillRoundedRect(12, 53, 8, 5, 2).fillRoundedRect(29, 53, 8, 5, 2);
    art.generateTexture("packet-arcade", 48, 60);
    art.destroy();
  }
  private marker(id: string, x: number, y: number, sprite: { texture: string; frame: number }, title: string): void {
    const chest = id !== "lesson" && id !== "boss" && id !== "arcade";
    const shadow = this.add.ellipse(x + 3, y, 37, 14, 0x233f34, 0.22).setDepth(1);
    const glow = this.add.circle(x, y - 6, id === "arcade" ? 38 : 33, 0x55cfff, 0.07).setDepth(1);
    const pad = this.add
      .circle(x, y, 25, 0x233f34, 0.08)
      .setStrokeStyle(1, 0x65cfff, 0.5)
      .setDepth(1)
      .setInteractive({ useHandCursor: true });
    const group = this.add.container(x, y).setDepth(y).setName(id);
    const icon = this.add
      .image(0, 4, sprite.texture, sprite.frame)
      .setOrigin(0.5, 1)
      .setScale(id === "arcade" ? 1 : id === "boss" ? 0.86 : id === "lesson" ? 0.52 : 0.58);
    group.add(icon);
    const plate = chest ? this.add.graphics() : null;
    if (plate) {
      plate.fillStyle(0x102139).fillRoundedRect(-10, -19, 20, 14, 2);
      plate.lineStyle(1, 0x65cfff).strokeRoundedRect(-10, -19, 20, 14, 2);
      group.add(plate);
    }
    const label = this.add
      .text(0, chest ? -12 : id === "arcade" ? -52 : id === "boss" ? -95 : -61, title, {
        fontFamily: "Consolas",
        fontStyle: "bold",
        fontSize: chest ? "11px" : "11px",
        color: "#def5ff",
        ...(chest ? {} : { backgroundColor: "#14251ee6", padding: { x: 7, y: 4 } }),
      })
      .setOrigin(0.5);
    if (chest) label.setName("task-number");
    group.add(label);
    const beacon = this.add.triangle(0, chest ? -51 : id === "arcade" ? -75 : -109, 0, 0, 10, 0, 5, 5, 0x7ce3ff);
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
    const marker = { id, x, y, icon, label, pad, beacon, glow, group, plate, shadow };
    this.solids.push({
      id,
      x: x - (chest ? 24 : 16),
      y: y - (chest ? 24 : 16),
      width: chest ? 48 : id === "arcade" ? 42 : 32,
      height: chest ? 25 : id === "arcade" ? 30 : 18,
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
    if (previous?.currentArea !== state?.currentArea) this.cancelDelivery();
    this.droneQuest.sync(state);
    this.communityBeacon.sync(state);
    this.hubSignals.sync(state);
    this.hero.setVisible(Boolean(state));
    this.shadow.setVisible(Boolean(state));
    if (!state || !area) {
      this.cameras.main.stopFollow().centerOn(village.world.width / 2, village.world.height / 2);
      return;
    }
    const changedDistrict = previous?.currentArea !== state.currentArea;
    if (changedDistrict) {
      this.world.destroy();
      this.world = buildAdventureWorld(this, this.reducedMotion, area.id);
      const layout = districtLayout(area.id);
      let index = 0;
      for (const marker of this.markers) {
        const spot =
          marker.id === "lesson"
            ? layout.lesson
            : marker.id === "boss"
              ? layout.boss
              : marker.id === "arcade"
                ? layout.arcade
                : layout.tasks[index];
        if (spot) {
          const dx = spot.x - marker.x,
            dy = spot.y - marker.y;
          const solid = this.solids.find((entry) => entry.id === marker.id);
          if (solid && "x" in solid) {
            solid.x += dx;
            solid.y += dy;
          }
          marker.x = spot.x;
          marker.y = spot.y;
          marker.group.setPosition(spot.x, spot.y).setDepth(spot.y);
          marker.pad.setPosition(spot.x, spot.y);
          marker.glow.setPosition(spot.x, spot.y - 6);
          marker.shadow.setPosition(spot.x + 3, spot.y);
        }
        if (marker.id === "lesson" || marker.id === "arcade") continue;
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
      this.districtLabel
        .setPosition(layout.label.x, layout.label.y)
        .setText(logic ? "IF / ELSE / DECISION NETWORK" : "VALUES / DATA HUB")
        .setColor(logic ? "#dfbaff" : "#9ae9ff");
      this.facing = "south";
      this.walked = 0;
    }
    const sprite = state.hero.kind === "girl" ? SPRITES.heroGirl : SPRITES.heroBoy;
    this.hero.setTexture(sprite.texture, heroFrame(this.facing));
    const entrance = districtLayout(area.id).spawn,
      location = state.position ?? entrance;
    this.position = this.canStand(location.x, location.y) ? { ...location } : { ...entrance };
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
        marker.id === "arcade" ||
        (marker.id === "boss"
          ? canFightBoss(state, area) || state.areas[area.id].bossDefeated
          : canSolveTask(state, area, marker.id) || solved);
      marker.icon.setAlpha(active ? 1 : 0.7).setTint(solved ? 0xb1e5b4 : active ? 0xffffff : 0xa1b7ac);
      if (marker.id !== "lesson" && marker.id !== "boss" && marker.id !== "arcade")
        marker.icon.setFrame(solved ? 1 : 0);
      marker.pad
        .setFillStyle(solved ? 0x71d2ad : active ? 0x65cfff : 0x273c52, active ? 0.2 : 0.15)
        .setStrokeStyle(1, solved ? 0xa8e9ba : active ? 0x8be6ff : 0x758b71, 0.7);
      marker.glow.setVisible(active && !solved);
      marker.beacon.setVisible(active && !solved && marker.id !== "lesson");
      if (marker.id !== "lesson" && marker.id !== "boss" && marker.id !== "arcade")
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
    if (blocked) this.cancelDelivery();
    if (blocked) this.cancelHubTour();
    this.blocked = blocked;
    this.touchAxis = { x: 0, y: 0 };
    this.tapTarget = null;
    this.input.keyboard?.resetKeys();
    this.prompt.setVisible(false);
  }
  getPosition(): Position {
    return { ...this.position };
  }
  setTouchAxis(x: -1 | 0 | 1, y: -1 | 0 | 1): void {
    this.touchAxis = { x, y };
    if (x || y) this.tapTarget = null;
  }
  touchStep(x: -1 | 0 | 1, y: -1 | 0 | 1): void {
    this.tapTarget = null;
    if (this.blocked || !this.state || !this.area) return;
    const length = Math.hypot(x, y) || 1;
    const before = this.position;
    this.position = moveWithCollisions(before, (x * 36) / length, (y * 36) / length, {
      bounds: districtLayout(this.area.id).bounds,
      solids: this.worldSolids(),
    });
    this.facing = x ? (x < 0 ? "west" : "east") : y < 0 ? "north" : "south";
    this.walked = 0;
    if (Math.hypot(this.position.x - before.x, this.position.y - before.y) > 0.01) {
      this.dirtyPosition = true;
      gameAudio.play("step");
    }
    this.hero.setPosition(this.position.x, this.position.y + 4).setDepth(this.position.y);
    this.shadow.setPosition(this.position.x, this.position.y - 1);
  }
  focusTablet(): () => void {
    const camera = this.cameras.main,
      bounded = camera.useBounds;
    camera.stopFollow();
    camera.useBounds = false;
    camera.zoomTo(2.5, 550, "Sine.easeInOut", true);
    camera.pan(this.hero.x, this.hero.y - 25, 550, "Sine.easeInOut", true);
    let restored = false;
    return () => {
      if (restored) return;
      restored = true;
      camera.zoomEffect.reset();
      camera.panEffect.reset();
      camera.setZoom(1);
      camera.useBounds = bounded;
      camera.centerOn(this.hero.x, this.hero.y);
      camera.startFollow(this.hero, true, 0.14, 0.14);
    };
  }
  tourHub(): void {
    if (this.state?.currentArea !== "variables") return;
    this.hubSignals.reboot();
    this.callbacks?.message("Data hub online. The route to Logic Junction is open.");
    if (this.reducedMotion) return;
    this.cameras.main.stopFollow();
    this.cameras.main.pan(village.boss.x, village.boss.y + 20, 650, "Sine.easeInOut");
    this.hubTour = this.time.delayedCall(2300, () => {
      this.hubTour = undefined;
      if (this.state) this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
    });
  }
  private cancelHubTour(): void {
    if (!this.hubTour) return;
    this.hubTour.remove(false);
    this.hubTour = undefined;
    this.cameras.main.panEffect.reset();
    this.cameras.main.centerOn(this.hero.x, this.hero.y);
    if (this.state) this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
  }
  previewDrone(value?: number): void {
    this.droneQuest.preview(value);
  }
  canLaunchDrone(): boolean {
    return this.droneQuest.canLaunch;
  }
  launchDrone(): void {
    if (!this.droneQuest.canLaunch || !this.state) return;
    this.delivering = true;
    this.blocked = true;
    this.input.keyboard?.resetKeys();
    this.prompt.setVisible(false);
    const sprite = this.state.hero.kind === "girl" ? SPRITES.heroGirl : SPRITES.heroBoy;
    this.hero.setTexture(sprite.texture, heroFrame(this.facing));
    this.cameras.main.stopFollow();
    if (!this.reducedMotion) this.cameras.main.pan(720, 324, 550, "Sine.easeInOut");
    this.droneQuest.launch(() => {
      this.delivering = false;
      this.blocked = false;
      this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
      this.callbacks?.message(
        "Delivery complete! Explore beyond the lane: Mina left a message at the community beacon.",
      );
      gameAudio.play("delivery");
    });
  }
  private cancelDelivery(): void {
    if (!this.delivering) return;
    this.delivering = false;
    this.droneQuest.cancel();
    this.cameras.main.panEffect.reset();
    this.cameras.main.startFollow(this.hero, true, 0.14, 0.14);
  }
  private canStand(x: number, y: number): boolean {
    return canStandAt({ x, y }, { bounds: districtLayout(this.area?.id).bounds, solids: this.worldSolids() });
  }
  private worldSolids(): Solid[] {
    return [...this.world.solids, ...this.solids, ...this.droneQuest.solids, ...this.communityBeacon.solids];
  }
  private distance(marker: Position): number {
    return Math.hypot(marker.x - this.position.x, marker.y - this.position.y);
  }
  private interact(marker: Marker): void {
    this.callbacks?.position(this.getPosition());
    this.callbacks?.interact(marker.id);
  }
  private interactClosest(): void {
    if (this.blocked || !this.state || !this.area || document.activeElement?.matches("input, textarea, select")) return;
    const nearest = this.nearestInteraction();
    if (nearest) {
      this.callbacks?.position(this.getPosition());
      this.callbacks?.interact(nearest.id);
    }
  }
  interactTouch(): void {
    this.interactClosest();
  }
  private nearestInteraction(): { id: string; prompt: string } | null {
    const points = this.markers.map((marker) => ({
      id: marker.id,
      x: marker.x,
      y: marker.y,
      prompt:
        marker.id === "lesson"
          ? "Open the quick guide"
          : marker.id === "boss"
            ? `Inspect ${this.area?.boss.name}`
            : marker.id === "arcade"
              ? "Play Packet Dash, a free city runner"
              : `Task ${marker.id.split("-")[1]}`,
    }));
    const courier = this.droneQuest.nearby(this.position),
      beacon = this.communityBeacon.position;
    if (courier) points.push({ ...courier, id: "courier", prompt: "Talk to Kai about the delivery" });
    if (beacon) points.push({ ...beacon, id: "discovery-beacon", prompt: "Read the community beacon" });
    return (
      points.filter((point) => this.distance(point) <= 68).sort((a, b) => this.distance(a) - this.distance(b))[0] ??
      null
    );
  }
  update(time: number, delta: number): void {
    if (this.blocked || !this.state || !this.area || document.activeElement?.matches("input, textarea, select")) return;
    const pressed = (key: string) => this.keys[key]?.isDown;
    let dx =
      Number(pressed("D") || pressed("RIGHT") || this.touchAxis.x > 0) -
      Number(pressed("A") || pressed("LEFT") || this.touchAxis.x < 0);
    let dy =
      Number(pressed("S") || pressed("DOWN") || this.touchAxis.y > 0) -
      Number(pressed("W") || pressed("UP") || this.touchAxis.y < 0);
    if (!dx && !dy && this.tapTarget) {
      const tx = this.tapTarget.x - this.position.x,
        ty = this.tapTarget.y - this.position.y;
      if (Math.hypot(tx, ty) < 8) this.tapTarget = null;
      else {
        dx = Math.sign(tx);
        dy = Math.sign(ty);
      }
    }
    const length = Math.hypot(dx, dy) || 1;
    const step = (150 * Math.min(delta, 40)) / 1000;
    dx *= step / length;
    dy *= step / length;
    const before = this.position;
    this.position = moveWithCollisions(before, dx, dy, {
      bounds: districtLayout(this.area.id).bounds,
      solids: this.worldSolids(),
    });
    const distance = Math.hypot(this.position.x - before.x, this.position.y - before.y);
    const moving = distance > 0.01;
    if (moving) this.dirtyPosition = true;
    if (dx) this.facing = dx < 0 ? "west" : "east";
    else if (dy) this.facing = dy < 0 ? "north" : "south";
    const previousStep = Math.floor(this.walked / 24);
    this.walked = moving ? this.walked + distance : 0;
    if (moving && Math.floor(this.walked / 24) > previousStep) gameAudio.play("step");
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
    const near = this.nearestInteraction();
    this.prompt.setVisible(Boolean(near));
    if (near) this.prompt.setText(`E / Space · ${near.prompt}`);
  }
}
