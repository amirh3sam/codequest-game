import type Phaser from "phaser";
import village from "../content/village.json" with { type: "json" };
import type { Solid } from "./collision";
import { type EnvironmentKind, OBJECT_SIZE } from "./environment-objects";

export const LOGIC_HUB: Solid = { id: "routing-control-hub", x: 675, y: 350, width: 186, height: 82 };

export function buildLogicWorld(scene: Phaser.Scene, reducedMotion: boolean): Solid[] {
  const { width, height } = village.world;
  scene.add
    .image(width / 2, height / 2, "logic-ground")
    .setDisplaySize(width, height)
    .setName("district-ground");
  const solids: Solid[] = [LOGIC_HUB];
  const hub = scene.add.container(768, 432).setDepth(432).setName("routing-control-hub");
  hub.add(scene.add.ellipse(0, 0, 208, 28, 0x070f26, 0.3));
  hub.add(
    scene.add
      .image(0, 14, "routing-hub")
      .setOrigin(0.5, 1)
      .setDisplaySize(224, (224 * 1024) / 1536),
  );
  hub.add(
    scene.add
      .text(0, -31, "ROUTE CONTROL", { fontFamily: "Consolas", fontSize: "8px", color: "#f7dba0" })
      .setOrigin(0.5),
  );
  const signal = scene.add.circle(42, -126, 2, 0xffc16f).setName("hub-signal");
  hub.add(signal);
  const panels = scene.add.graphics();
  panels.fillStyle(0x091526, 0.94).fillRoundedRect(-38, -65, 77, 25, 4);
  panels.lineStyle(1, 0x759aca).strokeRoundedRect(-38, -65, 77, 25, 4);
  for (let n = 0; n < 5; n++) {
    panels.fillStyle(n % 2 ? 0xb597ee : 0x8fe9d7, 0.8).fillRect(-30 + n * 13, -59, 7, 5 + (n % 3) * 3);
    panels.fillStyle(0xd7e2f0, 0.35).fillRect(-30 + n * 13, -44, 7, 1);
  }
  hub.addAt(panels, 2);
  if (!reducedMotion) scene.tweens.add({ targets: signal, alpha: 0.35, duration: 1200, yoyo: true, repeat: -1 });

  const props: { x: number; y: number; kind: EnvironmentKind }[] = [
    { x: 410, y: 360, kind: "rock" },
    { x: 960, y: 500, kind: "rock" },
    { x: 1020, y: 315, kind: "rock" },
    { x: 615, y: 485, kind: "fence" },
    { x: 1030, y: 445, kind: "fence" },
    { x: 240, y: 245, kind: "fir" },
    { x: 1270, y: 550, kind: "oak" },
  ];
  for (const [i, prop] of props.entries()) {
    const size = OBJECT_SIZE[prop.kind],
      image = scene.add
        .image(prop.x, prop.y, `environment-${prop.kind}`)
        .setOrigin(0.5, 1)
        .setDepth(prop.y)
        .setName(`logic-${prop.kind}-${i}`);
    image.setScale(Math.min(size.width / image.width, size.height / image.height)).setTint(0xe4d9ff);
    scene.add.ellipse(prop.x, prop.y - 1, image.displayWidth * 0.55, 10, 0x0a1029, 0.3).setDepth(1);
    const halfWidth = prop.kind === "fence" ? 60 : prop.kind === "rock" ? 24 : 14;
    const back = prop.kind === "fence" ? 10 : prop.kind === "rock" ? 24 : 16;
    solids.push({
      id: `logic-prop-${i}`,
      x: prop.x - halfWidth,
      y: prop.y - back,
      width: halfWidth * 2,
      height: back + 2,
    });
  }
  for (const [label, x, y, tint] of [
    ["TRUE / EAST", 1040, 385, 0xd6b16b],
    ["FALSE / WEST", 480, 330, 0xb497e9],
  ] as const) {
    scene.add
      .text(x, y, label, { fontFamily: "Consolas", fontSize: "11px", color: tint === 0xd6b16b ? "#e5bd78" : "#c8aaff" })
      .setOrigin(0.5)
      .setDepth(2);
    const light = scene.add.ellipse(x, y + 18, 80, 5, tint, 0.3).setDepth(2);
    if (!reducedMotion) scene.tweens.add({ targets: light, alpha: 0.4, duration: 1700, yoyo: true, repeat: -1 });
  }
  return solids;
}
