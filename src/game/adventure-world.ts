import Phaser from "phaser";
import village from "../content/village.json" with { type: "json" };
import type { AreaId, StoryAreaId, StudyAreaId } from "../core/rules";
import { dressCampusFacades } from "./city-architecture";
import type { Solid } from "./collision";
import { districtLayout } from "./district-layout";
import { createEnvironmentFrames, type EnvironmentKind, OBJECT_SIZE } from "./environment-objects";
import { buildLogicWorld } from "./logic-world";
import { buildStoryWorld } from "./story-worlds";
import { buildStudyWorld } from "./study-worlds";

export type DistrictWorld = { solids: Solid[]; destroy(): void };

export function buildAdventureWorld(
  scene: Phaser.Scene,
  reducedMotion: boolean,
  area: AreaId = "variables",
): DistrictWorld {
  if (!scene.textures.exists("environment-fir")) createEnvironmentFrames(scene);
  const before = new Set(scene.children.list);
  const solids = area.startsWith("study-")
    ? buildStudyWorld(scene, area as StudyAreaId, reducedMotion)
    : area === "conditions"
      ? buildLogicWorld(scene, reducedMotion)
      : area === "variables"
        ? buildCampusWorld(scene, reducedMotion)
        : buildStoryWorld(scene, area as Exclude<StoryAreaId, "variables" | "conditions">, reducedMotion);
  const objects = scene.children.list.filter((object) => !before.has(object));
  // Building art must block its whole ground footprint, not just a narrow
  // strip across the front. Tree canopies remain separate from their trunks.
  const bounds = districtLayout(area).bounds;
  const rects = new Set(
    solids.filter((solid) => "x" in solid).map((solid) => `${solid.x}/${solid.y}/${solid.width}/${solid.height}`),
  );
  for (const object of objects) {
    const buildings = object.getData("layout-obstacles") as
      | { id: string; x: number; y: number; width: number; height: number }[]
      | undefined;
    for (const building of buildings ?? []) {
      if (
        building.y + building.height <= bounds.top ||
        building.y >= bounds.bottom ||
        building.x + building.width <= bounds.left ||
        building.x >= bounds.right
      )
        continue;
      const key = `${building.x}/${building.y}/${building.width}/${building.height}`;
      if (!rects.has(key)) {
        solids.push({ ...building });
        rects.add(key);
      }
    }
  }
  return {
    solids,
    destroy: () => {
      for (const object of objects) {
        if (object instanceof Phaser.GameObjects.Container)
          for (const child of object.list) scene.tweens.killTweensOf(child);
        scene.tweens.killTweensOf(object);
        object.destroy();
      }
    },
  };
}

/** Painted backdrop plus live lighting, water and foreground occlusion. */
function buildCampusWorld(scene: Phaser.Scene, reducedMotion: boolean): Solid[] {
  const { width, height } = village.world;
  scene.add
    .image(width / 2, height / 2, "adventure-world")
    .setDisplaySize(width, height)
    .setName("district-ground")
    .setData("layout-obstacles", village.solidObjects);
  const solids: Solid[] = [...village.solidObjects, { id: "pond", points: village.pondShore }];
  dressCampusFacades(scene, reducedMotion);
  const object = (spot: { x: number; y: number; kind: string }, index: number) => {
    const kind = spot.kind as EnvironmentKind,
      size = OBJECT_SIZE[kind];
    const image = scene.add
      .image(spot.x, spot.y, `environment-${kind}`)
      .setOrigin(0.5, 1)
      .setDepth(spot.y)
      .setName(`${kind}-${index}`);
    image.setScale(Math.min(size.width / image.width, size.height / image.height));
    scene.add.ellipse(spot.x + 3, spot.y - 1, image.displayWidth * 0.55, 10, 0x18302b, 0.2).setDepth(1);
    if (kind === "fir" || kind === "oak") {
      solids.push({ id: `${kind}-${index}`, x: spot.x - 14, y: spot.y - 16, width: 28, height: 18 });
      if (!reducedMotion)
        scene.tweens.add({
          targets: image,
          angle: { from: -0.3, to: 0.3 },
          duration: 2800 + index * 80,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut",
        });
    } else if (kind === "rock")
      solids.push({ id: `rock-${index}`, x: spot.x - 24, y: spot.y - 24, width: 48, height: 26 });
    else solids.push({ id: `fence-${index}`, x: spot.x - 60, y: spot.y - 10, width: 120, height: 12 });
  };
  for (const [index, spot] of village.trees.entries()) object(spot, index);
  for (const [index, spot] of village.props.entries()) object(spot, index + village.trees.length);
  const water = village.water;
  const random = new Phaser.Math.RandomDataGenerator(["outpost-lights"]);
  if (!reducedMotion) {
    for (let n = 0; n < 9; n++) {
      const ripple = scene.add
        .ellipse(water.x + 25 + (n % 3) * 47, water.y + 20 + Math.floor(n / 3) * 25, 13, 3, 0xa5e6d5, 0.12)
        .setDepth(2);
      scene.tweens.add({
        targets: ripple,
        scaleX: 1.6,
        alpha: 0,
        x: ripple.x + 7,
        duration: 2200 + n * 200,
        delay: n * 130,
        repeat: -1,
      });
    }
    for (let n = 0; n < 23; n++) {
      const x = random.between(77, 1459),
        y = random.between(179, 691);
      const ember = scene.add.circle(x, y, n % 3 ? 1 : 1.5, 0x78dfff, 0.5).setDepth(800);
      scene.tweens.add({
        targets: ember,
        x: x + random.between(-16, 16),
        y: y - 25,
        alpha: 0,
        duration: random.between(2300, 5000),
        delay: n * 110,
        repeat: -1,
        yoyo: true,
      });
    }
    for (const x of [village.boss.x - 39, village.boss.x + 39]) {
      const glow = scene.add.circle(x, village.boss.y - 15, 21, 0x659bff, 0.08).setDepth(5);
      scene.tweens.add({ targets: glow, alpha: 0.16, scale: 1.12, duration: 1200, yoyo: true, repeat: -1 });
    }
  }
  return solids;
}
