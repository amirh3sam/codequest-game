import type Phaser from "phaser";
import type { GameState } from "../core/state";

/** Changes stay inside existing facades or beyond walking bounds; task clearance is preserved. */
export class RestoredCity {
  private scene: Phaser.Scene;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private key = "";
  private pod?: Phaser.GameObjects.Container;
  private reduced: boolean;
  private interact: (id: string) => void;
  constructor(scene: Phaser.Scene, reduced: boolean, interact: (id: string) => void) {
    this.scene = scene;
    this.reduced = reduced;
    this.interact = interact;
  }
  clear(): void {
    for (const o of this.objects) {
      this.scene.tweens.killTweensOf(o);
      o.destroy();
    }
    this.objects = [];
    this.pod = undefined;
    this.key = "";
  }
  sync(state: GameState | null): void {
    const key = state ? `${state.adventureId}:${state.currentArea}:${state.journey?.restored?.join(",") ?? ""}` : "";
    if (key === this.key) return;
    this.clear();
    this.key = key;
    if (!state) return;
    const scene = this.scene,
      r = state.journey?.restored ?? [],
      tram = r.includes("tram"),
      workshop = r.includes("workshop"),
      network = r.includes("network");
    this.pod = scene.children.getByName("city-transit-pod") as Phaser.GameObjects.Container | undefined;
    // Campus buildings and the painted skyrail have no free foreground track.
    // Reuse physical trams only where the district already provides rails.
    if (this.pod) {
      for (const tween of scene.tweens.getTweensOf(this.pod)) tram ? tween.resume() : tween.pause();
      if (!tram) this.pod.setX(1040);
      this.pod.setAlpha(tram ? 1 : 0.35).setData("service", tram ? "online" : "offline");
    }
    const campus = state.currentArea === "variables",
      logic = state.currentArea === "conditions";
    const ticket = scene.add
      .container(campus ? 480 : logic ? 768 : 1280, campus ? 238 : logic ? 423 : 748)
      .setDepth(logic ? 433 : 4)
      .setName("tram-ticket-desk")
      .setData("service", tram ? "online" : "offline");
    const plate = scene.add
      .rectangle(0, 0, campus ? 78 : logic ? 90 : 118, campus || logic ? 16 : 23, 0x102b40)
      .setStrokeStyle(1, tram ? 0x83e6c4 : 0x657f92);
    ticket.add([
      plate,
      scene.add
        .text(0, 0, tram ? "TRAM / TRAVEL" : "TRAM / OFFLINE", {
          fontFamily: "Consolas",
          fontSize: campus || logic ? "7px" : "10px",
          color: tram ? "#a2ffe1" : "#9fb0c1",
        })
        .setOrigin(0.5),
    ]);
    plate
      .setInteractive({ cursor: "var(--cursor-action)" })
      .on("pointerdown", () => this.interact(tram ? "restored-tram" : "restoration"));
    this.objects.push(ticket);
    if (state.currentArea !== "variables") return;
    const root = scene.add.container(409, 238).setDepth(3).setName("restoration-workshop");
    const art = scene.add.graphics();
    art
      .fillStyle(0x081c2d, 0.98)
      .fillRect(-25, -24, 50, 42)
      .lineStyle(1, workshop ? 0x91ffe3 : 0x758394)
      .strokeRect(-25, -24, 50, 42);
    art
      .fillStyle(workshop ? 0x9cffdd : 0x475b72, workshop ? 0.65 : 1)
      .fillRect(-22, -21, 20, 36)
      .fillRect(2, -21, 20, 36);
    if (workshop) art.fillStyle(0x102b39).fillRect(-8, -20, 16, 37);
    root.add(art);
    const label = scene.add
      .text(0, -34, workshop ? "WORKSHOP / OPEN" : "WORKSHOP / LOCKED", {
        fontFamily: "Consolas",
        fontSize: "8px",
        color: workshop ? "#b0ffe3" : "#c2cbd9",
        backgroundColor: "#102139",
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5);
    root.add(label);
    const hit = scene.add
      .rectangle(0, -3, 50, 42, 0xffffff, 0.001)
      .setInteractive({ cursor: "var(--cursor-action)" })
      .on("pointerdown", () => this.interact(workshop ? "restored-workshop" : "restoration"));
    root.add(hit);
    this.objects.push(root);
    if (network) {
      const windows = scene.add.graphics().setDepth(2).setName("restored-network-windows");
      for (const x of [366, 392, 418, 444]) {
        windows.fillStyle(0x82ffbf, 0.5).fillRect(x, 152, 16, 15);
        windows.lineStyle(1, 0xaceaff, 0.8).lineBetween(x, 160, x + 12, 160);
      }
      this.objects.push(windows);
      const signal = scene.add.circle(519, 38, 4, 0x86ffcb, 0.8).setDepth(3).setName("restored-network-beacon");
      this.objects.push(signal);
      if (!this.reduced) scene.tweens.add({ targets: signal, alpha: 0.25, duration: 1000, yoyo: true, repeat: -1 });
    }
  }
}
