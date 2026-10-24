import type Phaser from "phaser";
import { studyTopicForArea } from "../content/world-levels";
import { STUDY_AREA_IDS, type StudyAreaId } from "../core/rules";
import { detailFacade, dressDistrictEdges } from "./city-architecture";
import type { Solid } from "./collision";
import { districtLayout, portalPosition } from "./district-layout";

const PALETTES = [
  [0x0f2033, 0x254252, 0x59e9d0],
  [0x201735, 0x443158, 0xc59aff],
  [0x102b30, 0x23535a, 0x60e1dc],
  [0x18223e, 0x324669, 0x8bb8ff],
  [0x2a2034, 0x53405d, 0xffbf87],
  [0x242139, 0x484364, 0xf0a4ed],
  [0x152443, 0x2e4270, 0x9fafff],
  [0x12312f, 0x29544d, 0x8be5b0],
  [0x2d2436, 0x554460, 0xffcf73],
  [0x152c39, 0x2d4c61, 0x65d2ff],
  [0x1e2c23, 0x3d5442, 0xb4ec85],
  [0x212c47, 0x3c5076, 0xb9ddff],
  [0x332129, 0x5d3542, 0xff929d],
  [0x20283b, 0x3e4c68, 0x9bd5ed],
  [0x173032, 0x2f575a, 0x8ef2d3],
  [0x30253d, 0x5b446d, 0xf3b0fc],
] as const;
const LANDMARKS = [
  "CALCULATION PLAZA",
  "DECISION EXCHANGE",
  "ITERATION RING",
  "METHOD LABORATORY",
  "CLASS BLUEPRINTS",
  "STRING STREAM",
  "MEMORY BLOCKS",
  "DYNAMIC GARDEN",
  "INSTANCE FACTORY",
  "ENCAPSULATION VAULT",
  "INHERITANCE TREE",
  "HOLOGRAM CLOUD",
  "REPAIR RESPONSE HQ",
  "COLLECTION DEPOT",
  "KEY / VALUE EXCHANGE",
  "INVENTION FESTIVAL",
];

/** Each course has its own route, palette, skyline, and topic-shaped city landmark. */
export function buildStudyWorld(scene: Phaser.Scene, area: StudyAreaId, reducedMotion: boolean): Solid[] {
  const index = STUDY_AREA_IDS.indexOf(area);
  const palette = PALETTES[index];
  if (!palette) throw new Error(`Missing district theme ${area}`);
  const [ground, path, accent] = palette;
  const layout = districtLayout(area);
  scene.add.rectangle(768, 432, 1536, 864, ground).setDepth(-5).setName(`${area}-ground`);
  const roads = scene.add.graphics().setDepth(-4).setName(`${area}-roads`);
  roads.lineStyle(64, path, 0.72);
  const route = [layout.spawn, ...layout.tasks, portalPosition(area)];
  for (let step = 1; step < route.length; step++) {
    const previous = route[step - 1],
      next = route[step];
    if (!previous || !next) continue;
    roads.lineBetween(previous.x, previous.y, next.x, next.y);
  }
  roads.lineStyle(1, accent, 0.08);
  for (let x = 80; x < 1480; x += 48) roads.lineBetween(x, 180, x, 700);
  for (let y = 180; y < 700; y += 48) roads.lineBetween(80, y, 1480, y);
  const skyline = scene.add.graphics().setDepth(-2).setName(`${area}-skyline`);
  const skylineBase = 148;
  const skylineBounds: { id: string; x: number; y: number; width: number; height: number }[] = [];
  skyline.setData("layout-obstacles", skylineBounds);
  for (let block = 0; block < 11; block++) {
    const x = 105 + block * 124;
    const height = 75 + ((block * 31 + index * 23) % 70);
    skylineBounds.push({ id: `course-skyline-${block}`, x, y: skylineBase - height, width: 92, height });
    skyline.fillStyle(path, 0.9).fillRoundedRect(x, skylineBase - height, 92, height, 7);
    skyline.lineStyle(2, accent, 0.35).strokeRoundedRect(x, skylineBase - height, 92, height, 7);
    for (let row = 0; row < Math.floor(height / 20) - 1; row++)
      for (let column = 0; column < 3; column++)
        skyline
          .fillStyle(accent, 0.25 + ((block + column + row) % 3) * 0.15)
          .fillRect(x + 14 + column * 24, skylineBase + 15 - height + row * 20, 12, 7);
    detailFacade(skyline, { x, y: skylineBase - height, width: 92, height }, accent, block + index);
  }
  const monument = scene.add.container(770, 440).setDepth(440).setName(`${area}-landmark`);
  monument.setData("layout-obstacles", [
    { id: `${area}-base`, x: 640, y: 355, width: 260, height: 105 },
    { id: `${area}-architecture`, x: 660, y: 260, width: 220, height: 110 },
  ]);
  const art = scene.add.graphics();
  art.fillStyle(0x040a15, 0.45).fillEllipse(0, 15, 280, 80);
  art.fillStyle(path).fillRoundedRect(-130, -85, 260, 105, 20);
  art.lineStyle(3, accent, 0.85).strokeRoundedRect(-130, -85, 260, 105, 20);
  art.fillStyle(ground, 0.85).fillRoundedRect(-112, -69, 224, 58, 12);
  // Front panels and roof services stay inside the existing landmark foundation.
  detailFacade(art, { x: -121, y: -76, width: 242, height: 85 }, accent, index);
  art.lineStyle(3, accent, 0.85);
  art.lineStyle(3, accent, 0.85);
  // Topic-specific architecture sits above the same safe central foundation.
  if (index === 0) {
    for (const [x, glyph] of [
      [-75, "+"],
      [0, "×"],
      [75, "="],
    ] as const)
      monument.add(
        scene.add.text(x, -95, glyph, { fontFamily: "Consolas", fontSize: "54px", color: "#a0ffe9" }).setOrigin(0.5, 1),
      );
  } else if (index === 1) {
    art.lineBetween(0, -10, 0, -72).lineBetween(0, -72, -75, -125).lineBetween(0, -72, 75, -125);
    for (const x of [-75, 75]) art.fillStyle(accent, 0.6).fillRoundedRect(x - 25, -145, 50, 35, 8);
  } else if (index === 2) {
    for (let ring = 0; ring < 3; ring++)
      art.lineStyle(6 - ring, accent, 0.7 - ring * 0.15).strokeEllipse(0, -95, 105 + ring * 42, 70 + ring * 26);
  } else if (index === 3 || index === 8) {
    for (const x of [-76, 0, 76]) {
      art.fillStyle(path).fillRoundedRect(x - 28, -145 + (x === 0 ? -28 : 0), 56, 105, 10);
      art.lineStyle(2, accent).strokeRoundedRect(x - 28, -145 + (x === 0 ? -28 : 0), 56, 105, 10);
      art.fillStyle(accent, 0.75).fillRect(x - 16, -127, 32, 8);
    }
  } else if (index === 4 || index === 9) {
    art.lineStyle(index === 9 ? 8 : 3, accent, 0.8).strokeRoundedRect(-82, -150, 164, 104, 16);
    art.fillStyle(accent, 0.35).fillRoundedRect(-59, -128, 118, 62, 10);
    art.strokeCircle(0, -97, index === 9 ? 23 : 15);
  } else if (index === 5) {
    for (let n = 0; n < 7; n++) {
      const y = -100 + Math.sin(n * 1.1) * 30;
      art.fillStyle(accent, 0.75).fillRoundedRect(-108 + n * 32, y - 18, 25, 36, 6);
    }
  } else if (index === 6 || index === 13) {
    for (let row = 0; row < 2; row++)
      for (let column = 0; column < 4; column++) {
        art
          .fillStyle(accent, 0.3 + row * 0.3)
          .fillRoundedRect(-108 + column * 57, -143 + row * 47, 45, 37, index === 13 ? 12 : 3);
      }
  } else if (index === 7) {
    for (let n = 0; n < 5; n++) {
      art.lineBetween(-90 + n * 45, -98, -45 + n * 45, -98);
      art.fillStyle(accent, 0.6).fillCircle(-90 + n * 45, -98 - (n % 2) * 25, 20);
    }
  } else if (index === 10) {
    art.lineBetween(0, -30, 0, -152).lineBetween(0, -115, -74, -75).lineBetween(0, -115, 74, -75);
    for (const [x, y] of [
      [0, -152],
      [-74, -75],
      [74, -75],
    ] as const)
      art.fillStyle(accent, 0.72).fillCircle(x, y, 23);
  } else if (index === 11) {
    for (const [x, y, radius] of [
      [-55, -102, 40],
      [0, -127, 51],
      [55, -100, 37],
    ] as const)
      art.fillStyle(accent, 0.45).fillCircle(x, y, radius);
  } else if (index === 12) {
    art.fillStyle(accent, 0.82).fillRoundedRect(-20, -155, 40, 106, 8).fillRoundedRect(-55, -122, 110, 40, 8);
  } else if (index === 14) {
    for (const x of [-70, 70]) {
      art.strokeCircle(x, -115, 27).lineBetween(x, -88, x, -46);
      art.fillStyle(accent, 0.75).fillCircle(x, -115, 9);
    }
    art.lineBetween(-45, -115, 45, -115);
  } else {
    for (let n = 0; n < 5; n++) {
      const x = -96 + n * 48;
      art.fillStyle(accent, 0.35 + n * 0.12).fillTriangle(x - 22, -64, x, -155 + (n % 2) * 32, x + 22, -64);
    }
  }
  art.fillStyle(ground, 0.94).fillRoundedRect(-108, -16, 216, 23, 4);
  art.lineStyle(1, accent, 0.35).strokeRoundedRect(-108, -16, 216, 23, 4);
  monument.addAt(art, 0);
  monument.add(
    scene.add
      .text(0, -5, LANDMARKS[index], {
        fontFamily: "Consolas",
        fontSize: "11px",
        color: `#${accent.toString(16).padStart(6, "0")}`,
      })
      .setOrigin(0.5),
  );
  scene.add
    .text(770, 220, `${String(index + 8).padStart(2, "0")} / ${studyTopicForArea(area)?.title.toUpperCase()}`, {
      fontFamily: "Consolas",
      fontSize: "14px",
      align: "center",
      wordWrap: { width: 210, useAdvancedWrap: true },
      color: "#e0f6ff",
    })
    .setOrigin(0.5)
    .setDepth(2);
  for (const [n, point] of layout.tasks.entries()) {
    const light = scene.add.circle(point.x, point.y - 6, 34, accent, 0.08).setDepth(1);
    if (!reducedMotion)
      scene.tweens.add({ targets: light, alpha: 0.18, duration: 1400 + n * 90, yoyo: true, repeat: -1 });
  }
  dressDistrictEdges(scene, accent, index, reducedMotion);
  return [{ id: `${area}-foundation`, x: 640, y: 395, width: 260, height: 65 }];
}
