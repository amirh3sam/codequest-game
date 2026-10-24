import type Phaser from "phaser";
import village from "../content/village.json" with { type: "json" };
import type { StoryAreaId as CityAreaId } from "../core/rules";
import type { Solid } from "./collision";

type StoryAreaId = Exclude<CityAreaId, "variables" | "conditions">;
type Theme = Readonly<{ ground: number; path: number; accent: number; glow: number; label: string }>;

const THEMES: Readonly<Record<StoryAreaId, Theme>> = {
  loops: { ground: 0x101d3a, path: 0x1b3559, accent: 0x44d9d2, glow: 0x3695ff, label: "LOOP TRANSIT" },
  arrays: { ground: 0x17213d, path: 0x253457, accent: 0x9a80ff, glow: 0x4c9eff, label: "ARRAY TOWERS" },
  functions: { ground: 0x102c39, path: 0x1b4650, accent: 0x72e2bc, glow: 0x55a9ff, label: "FUNCTION LABS" },
  objects: { ground: 0x262039, path: 0x403158, accent: 0xffc56b, glow: 0xff7e96, label: "OBJECT CAMPUS" },
  abstraction: { ground: 0x14294d, path: 0x284c76, accent: 0xa7ddff, glow: 0x77aaff, label: "ABSTRACTION CLOUD" },
};

/** Distinct, collision-safe 2D backdrops for the newly playable story districts. */
export function buildStoryWorld(scene: Phaser.Scene, area: StoryAreaId): Solid[] {
  const { width, height } = village.world;
  const theme = THEMES[area];
  scene.add
    .rectangle(width / 2, height / 2, width, height, theme.ground)
    .setDepth(-4)
    .setName(`${area}-ground`);
  const floor = scene.add.graphics().setDepth(-3).setName(`${area}-floor`);
  const graphics = scene.add.graphics().setDepth(3).setName(`${area}-landmarks`);
  const visualObstacles: { id: string; x: number; y: number; width: number; height: number }[] = [];
  graphics.setData("layout-obstacles", visualObstacles);
  const keepClear = (id: string, x: number, y: number, width: number, height: number) =>
    visualObstacles.push({ id, x, y, width, height });
  const solids: Solid[] = [];

  floor.fillStyle(theme.path, 0.7).fillRoundedRect(100, 330, width - 200, 110, 28);
  graphics.lineStyle(2, theme.accent, 0.38);

  if (area === "loops") {
    for (const [x, y, radius] of [
      [390, 515, 138],
      [760, 515, 138],
      [1130, 515, 138],
    ]) {
      floor.lineStyle(2, theme.accent, 0.38).strokeCircle(x, y, radius);
      floor.lineStyle(8, 0x75a7c2, 0.38).strokeCircle(x, y, radius - 13);
    }
    graphics.fillStyle(0x263e63, 0.98).fillRoundedRect(622, 356, 292, 92, 18);
    keepClear("transit-platform", 622, 356, 292, 92);
    graphics.lineStyle(3, theme.accent, 0.86).strokeRoundedRect(622, 356, 292, 92, 18);
    graphics.fillStyle(0x74dcd5, 0.75).fillRoundedRect(670, 382, 196, 30, 10);
    solids.push({ id: "transit-platform", x: 690, y: 378, width: 160, height: 40 });
  } else if (area === "arrays") {
    graphics.fillStyle(0x29395c, 0.98).fillRoundedRect(640, 235, 250, 245, 14);
    keepClear("array-archive", 640, 235, 250, 245);
    graphics.lineStyle(3, theme.accent, 0.8).strokeRoundedRect(640, 235, 250, 245, 14);
    for (let row = 0; row < 3; row++)
      for (let column = 0; column < 4; column++) {
        const x = 662 + column * 55,
          y = 258 + row * 67;
        graphics.fillStyle((row + column) % 2 ? theme.glow : theme.accent, 0.76).fillRoundedRect(x, y, 40, 50, 6);
      }
    solids.push({ id: "array-archive", x: 650, y: 330, width: 230, height: 140 });
    for (const x of [260, 420, 1072, 1260]) {
      keepClear(`array-tower-${x}`, x, 470, 76, 170);
      graphics.fillStyle(0x263455, 0.94).fillRoundedRect(x, 470, 76, 170, 14);
      graphics.lineStyle(2, theme.accent, 0.52).strokeRoundedRect(x, 470, 76, 170, 14);
      solids.push({ id: `array-tower-${x}`, x: x + 8, y: 500, width: 60, height: 130 });
    }
  } else if (area === "functions") {
    const labs = [
      [300, 242, 230, 112],
      [970, 242, 250, 112],
      [1190, 500, 240, 110],
    ];
    for (const [x, y, w, h] of labs) {
      keepClear(`function-lab-${x}`, x, y, w, h);
      graphics.fillStyle(0x1c4451, 0.98).fillRoundedRect(x, y, w, h, 16);
      graphics.lineStyle(3, theme.accent, 0.68).strokeRoundedRect(x, y, w, h, 16);
      graphics.fillStyle(0x8be2cb, 0.58).fillRoundedRect(x + 22, y + 22, w - 44, 18, 8);
    }
    floor.lineStyle(8, theme.accent, 0.25);
    floor.lineBetween(565, 300, 690, 300);
    floor.lineBetween(845, 300, 970, 300);
    solids.push(
      { id: "function-lab-west", x: 322, y: 260, width: 186, height: 78 },
      { id: "function-lab-east", x: 997, y: 260, width: 196, height: 78 },
      { id: "function-workshop", x: 1210, y: 520, width: 200, height: 76 },
    );
  } else if (area === "objects") {
    graphics.fillStyle(0x40345a, 0.98).fillRoundedRect(610, 252, 318, 220, 24);
    keepClear("object-campus-hall", 610, 252, 318, 220);
    graphics.lineStyle(3, theme.accent, 0.82).strokeRoundedRect(610, 252, 318, 220, 24);
    graphics.fillStyle(0x625078, 0.95).fillRoundedRect(690, 300, 158, 128, 12);
    graphics.fillStyle(0xffd787, 0.9).fillCircle(769, 278, 12);
    for (const [x, y] of [
      [330, 286],
      [440, 516],
      [1095, 292],
      [1195, 516],
    ]) {
      keepClear(`object-class-${x}`, x, y, 82, 70);
      graphics.fillStyle(0x4b3c64, 0.94).fillRoundedRect(x, y, 82, 70, 12);
      graphics.lineStyle(2, theme.accent, 0.62).strokeRoundedRect(x, y, 82, 70, 12);
      solids.push({ id: `object-class-${x}`, x: x + 10, y: y + 12, width: 62, height: 50 });
    }
    solids.push({ id: "object-campus-hall", x: 650, y: 350, width: 238, height: 100 });
  } else {
    floor.fillStyle(0x233c63, 0.75).fillRoundedRect(105, 245, width - 210, 330, 164);
    floor.lineStyle(5, theme.accent, 0.56).strokeRoundedRect(125, 265, width - 250, 290, 146);
    for (const [x, y, radius] of [
      [390, 365, 74],
      [560, 525, 56],
      [945, 365, 84],
      [1150, 525, 62],
    ]) {
      floor.fillStyle(0xb4dfff, 0.14).fillCircle(x, y, radius);
      floor.lineStyle(2, theme.accent, 0.64).strokeCircle(x, y, radius);
    }
    graphics.fillStyle(0x91c5f4, 0.9).fillRoundedRect(650, 310, 236, 120, 58);
    keepClear("cloud-archive", 650, 310, 236, 120);
    graphics.lineStyle(3, theme.accent, 0.88).strokeRoundedRect(650, 310, 236, 120, 58);
    solids.push({ id: "cloud-archive", x: 680, y: 350, width: 176, height: 60 });
  }

  scene.add
    .text(width / 2, 205, theme.label, {
      fontFamily: "Consolas, monospace",
      fontSize: "15px",
      color: `#${theme.accent.toString(16).padStart(6, "0")}`,
      stroke: "#08111d",
      strokeThickness: 4,
    })
    .setOrigin(0.5)
    .setDepth(2);
  return solids;
}
