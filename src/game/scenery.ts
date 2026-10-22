import Phaser from "phaser";
import village from "../content/village.json" with { type: "json" };

export type Obstacle = { x: number; y: number; width: number; height: number };

/** Scenery is drawn once; only a few small ambient objects animate each frame. */
export function buildVillage(scene: Phaser.Scene, reducedMotion: boolean): Obstacle[] {
  const solids: Obstacle[] = [];
  const random = new Phaser.Math.RandomDataGenerator(["variable-village-garden"]);
  const canvas = scene.textures.createCanvas("village-ground", 480, 270);
  if (canvas) {
    const ctx = canvas.context;
    ctx.fillStyle = "#7fa55b";
    ctx.fillRect(0, 0, 480, 270);
    for (let i = 0; i < 9500; i++) {
      ctx.fillStyle = random.pick(["#88ae64", "#779d54", "#81a75e", "#739850"]);
      ctx.fillRect(random.between(0, 479), random.between(0, 269), random.between(1, 3), 1);
    }
    const routes = [
      [
        [24, 200],
        [452, 200],
      ],
      [
        [240, 200],
        [240, 152],
        [400, 152],
        [416, 152],
        [416, 96],
      ],
      [
        [64, 200],
        [64, 152],
      ],
      [
        [64, 96],
        [416, 96],
      ],
      [
        [128, 96],
        [128, 84],
      ],
      [
        [320, 96],
        [320, 84],
      ],
    ];
    const path = (width: number, color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      for (const route of routes) {
        ctx.beginPath();
        for (const [index, point] of route.entries()) {
          if (point[0] === undefined || point[1] === undefined) continue;
          if (index === 0) ctx.moveTo(point[0], point[1]);
          else ctx.lineTo(point[0], point[1]);
        }
        ctx.stroke();
      }
    };
    path(23, "#688849");
    path(19, "#c6ae77");
    path(15, "#d9c18b");
    for (let i = 0; i < 1600; i++) {
      const x = random.between(24, 453),
        y = random.between(85, 209);
      const pixel = ctx.getImageData(x, y, 1, 1).data;
      if ((pixel[0] ?? 0) > 170) {
        ctx.fillStyle = random.pick(["#c6ad76", "#e7ce98", "#d2b881"]);
        ctx.fillRect(x, y, random.between(1, 3), 1);
      }
    }
    canvas.refresh();
    scene.add.image(480, 270, "village-ground").setScale(2);
  }

  const tree = (x: number, y: number, solid = false, variety = 0) => {
    scene.add.ellipse(x + 9, y + 12, 44, 17, 0x294a38, 0.2).setDepth(1);
    if (variety === 1) {
      scene.add
        .image(x, y - 12, "tiny-town", 5)
        .setScale(3.4)
        .setDepth(y + 16);
    } else {
      const scale = variety === 2 ? 2.5 : 2.2;
      scene.add
        .image(x, y - 26, "tiny-town", 4)
        .setScale(scale)
        .setDepth(y + 16);
      scene.add
        .image(x, y + 16 * scale - 26, "tiny-town", 16)
        .setScale(scale)
        .setDepth(y + 16);
    }
    if (solid) solids.push({ x: x - 12, y: y - 10, width: 24, height: 32 });
  };
  for (let x = -12; x < 980; x += 31) {
    tree(x, 33 + (x % 3) * 7, false, random.between(0, 2));
    tree(x + 12, 77 + (x % 5) * 2, false, random.between(0, 2));
    tree(x, 540 + (x % 4) * 4, false, random.between(0, 2));
  }
  for (let y = 133; y < 508; y += 43) {
    tree(12, y, false, random.between(0, 2));
    tree(950, y + 8, false, random.between(0, 2));
  }
  for (const [index, spot] of village.trees.entries()) tree(spot.x, spot.y, true, index % 3);

  const props = scene.add.graphics().setDepth(2);
  // Flower beds and grass tufts occupy the verges, leaving the walking routes clear.
  for (let i = 0; i < 180; i++) {
    const x = random.between(48, 912),
      y = random.between(114, 488);
    const nearRoute = Math.abs(y - 400) < 30 || Math.abs(y - 192) < 27 || (y > 270 && y < 334 && x > 440);
    if (nearRoute || village.houses.some((h) => Math.abs(x - h.x) < 65 && Math.abs(y - h.y) < 60)) continue;
    if (x > village.water.x - 12 && y > village.water.y - 12) continue;
    props.fillStyle(0x4e783f, 0.8);
    props.fillRect(x, y, 2, 5);
    props.fillRect(x - 3, y + 2, 2, 2);
    if (i % 3 === 0) {
      props.fillStyle(random.pick([0xf6d789, 0xf4bfa2, 0xeae9c6, 0xc4b1dd]), 1);
      props.fillRect(x - 2, y - 2, 6, 3);
      props.fillRect(x, y - 4, 2, 7);
      props.fillStyle(0xf9e7a3, 1);
      props.fillRect(x, y - 2, 2, 2);
    }
  }
  const fence = (x: number, y: number, length: number) => {
    props.fillStyle(0x493c2e);
    props.fillRect(x, y + 5, length, 3);
    props.fillRect(x, y + 13, length, 3);
    for (let step = 0; step <= length; step += 16) {
      props.fillStyle(0x70513a);
      props.fillRect(x + step, y, 5, 22);
      props.fillStyle(0xb49561);
      props.fillRect(x + step, y, 5, 3);
    }
  };
  for (const [index, house] of village.houses.entries()) {
    scene.add.ellipse(house.x + 12, house.y + 58, 128, 30, 0x294a38, 0.22).setDepth(1);
    for (let row = 0; row < 3; row++)
      for (let col = 0; col < 3; col++)
        scene.add
          .image(
            house.x + (col - 1) * 32,
            house.y + row * 32 - 24,
            "tiny-town",
            (row === 2 ? 84 + (col === 1 ? 1 : 0) : 48 + row * 12 + col) + index * 4,
          )
          .setScale(2)
          .setDepth(house.y + 55);
    solids.push({ x: house.x - 48, y: house.y - 8, width: 96, height: 72 });
    fence(house.x - 81, house.y + 65, 48);
    fence(house.x + 32, house.y + 65, 48);
    // A low garden and a warm doorstep give each house its own little frontage.
    props.fillStyle(0x514331);
    props.fillRect(house.x - 52, house.y + 42, 31, 7);
    props.fillStyle(0x456c3c);
    props.fillRect(house.x - 56, house.y + 34, 39, 10);
    props.fillStyle(index ? 0xf1c97e : 0xedb3a8);
    for (let n = 0; n < 5; n++) props.fillRect(house.x - 53 + n * 7, house.y + 31 - (n % 2) * 2, 4, 5);
    if (!reducedMotion) {
      for (let n = 0; n < 3; n++) {
        const smoke = scene.add.circle(house.x - 25, house.y - 39, 5, 0xece9cb, 0).setDepth(house.y + 56);
        scene.tweens.add({
          targets: smoke,
          x: house.x - 10,
          y: house.y - 83,
          alpha: { from: 0.35, to: 0 },
          scale: 2,
          duration: 3800,
          delay: n * 1250,
          repeat: -1,
        });
      }
    }
  }

  const water = village.water,
    cx = water.x + water.width / 2,
    cy = water.y + water.height / 2;
  props.fillStyle(0x5f7948);
  props.fillRoundedRect(water.x - 10, water.y - 10, water.width + 20, water.height + 20, 22);
  props.fillStyle(0xc2b581);
  props.fillRoundedRect(water.x - 5, water.y - 5, water.width + 10, water.height + 10, 18);
  props.fillStyle(0x2c6975);
  props.fillRoundedRect(water.x, water.y, water.width, water.height, 15);
  props.fillStyle(0x388c95);
  props.fillRoundedRect(water.x + 4, water.y + 6, water.width - 8, water.height - 10, 12);
  props.fillStyle(0x4a9b9d, 0.65);
  props.fillRoundedRect(water.x + 10, water.y + 26, water.width - 20, water.height - 36, 10);
  for (let n = 0; n < 12; n++) {
    const ripple = scene.add
      .rectangle(water.x + 16 + (n % 4) * 37, water.y + 18 + Math.floor(n / 4) * 25, 12 + (n % 3) * 4, 2, 0xb0e1cc, 0.4)
      .setDepth(3);
    if (!reducedMotion)
      scene.tweens.add({
        targets: ripple,
        x: ripple.x + 8,
        alpha: 0.12,
        duration: 1600 + n * 80,
        yoyo: true,
        repeat: -1,
      });
  }
  for (const [x, y] of [
    [cx + 42, cy - 18],
    [cx - 43, cy + 23],
  ]) {
    props.fillStyle(0x2d684d);
    props.fillEllipse(x ?? 0, y ?? 0, 16, 8);
    props.fillStyle(0xeacac0);
    props.fillRect((x ?? 0) + 1, (y ?? 0) - 6, 5, 5);
  }
  for (let n = 0; n < 8; n++) {
    const x = water.x - 4 + n * 22,
      y = water.y + water.height + 1 + (n % 2) * 4;
    props.fillStyle(0x476c3c);
    props.fillRect(x, y - 12, 2, 16);
    props.fillRect(x + 4, y - 8, 2, 12);
    props.fillStyle(0xb5a376);
    props.fillRect(x, y - 15, 2, 5);
  }
  solids.push(water);

  const lanterns = [
    { x: 74, y: 365 },
    { x: 414, y: 365 },
    { x: 536, y: 269 },
    { x: 794, y: 228 },
  ];
  for (const spot of lanterns) {
    const lamp = scene.add.graphics().setDepth(spot.y + 8);
    lamp.fillStyle(0x433a31);
    lamp.fillRect(spot.x - 2, spot.y - 29, 4, 42);
    lamp.fillRect(spot.x - 2, spot.y - 31, 20, 4);
    lamp.fillRect(spot.x + 11, spot.y - 27, 3, 6);
    lamp.fillRect(spot.x + 6, spot.y - 21, 14, 18);
    lamp.fillStyle(0xf3ca75);
    lamp.fillRect(spot.x + 9, spot.y - 18, 8, 12);
    lamp.fillStyle(0xffe6a4);
    lamp.fillRect(spot.x + 11, spot.y - 17, 3, 10);
    const glow = scene.add.circle(spot.x + 13, spot.y - 13, 25, 0xffd680, 0.075).setDepth(spot.y + 7);
    if (!reducedMotion)
      scene.tweens.add({ targets: glow, alpha: 0.16, scale: 1.2, duration: 1700, yoyo: true, repeat: -1 });
  }

  // A small stone shrine makes the boss destination legible before it unlocks.
  props.fillStyle(0x6d7960);
  props.fillEllipse(village.boss.x, village.boss.y + 10, 87, 39);
  props.lineStyle(2, 0xbbbd8e, 0.8);
  props.strokeEllipse(village.boss.x, village.boss.y + 10, 76, 29);
  for (const x of [village.boss.x - 43, village.boss.x + 43]) {
    const pillar = scene.add.graphics().setDepth(village.boss.y + 4);
    pillar.fillStyle(0x657264);
    pillar.fillRect(x - 6, village.boss.y - 38, 12, 43);
    pillar.fillStyle(0x9eab88);
    pillar.fillRect(x - 8, village.boss.y - 42, 16, 6);
    pillar.fillRect(x - 8, village.boss.y + 2, 16, 5);
    pillar.fillStyle(0xd2c596);
    pillar.fillRect(x - 3, village.boss.y - 30, 3, 23);
  }
  if (!reducedMotion) {
    for (let i = 0; i < 18; i++) {
      const x = random.between(50, 910),
        y = random.between(115, 470);
      const mote = scene.add.circle(x, y, i % 3 === 0 ? 2 : 1, 0xffe5a3, 0.35).setDepth(800);
      scene.tweens.add({
        targets: mote,
        x: x + random.between(-25, 25),
        y: y - 28,
        alpha: 0,
        duration: random.between(2500, 5500),
        delay: i * 190,
        yoyo: true,
        repeat: -1,
      });
    }
  }
  const light = scene.textures.createCanvas("village-light", 960, 540);
  if (light) {
    const ctx = light.context;
    const gradient = ctx.createRadialGradient(450, 250, 130, 480, 270, 560);
    gradient.addColorStop(0, "rgba(255,232,167,0.025)");
    gradient.addColorStop(0.55, "rgba(28,62,47,0.025)");
    gradient.addColorStop(1, "rgba(15,39,37,0.46)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 960, 540);
    light.refresh();
    scene.add.image(480, 270, "village-light").setDepth(900);
  }
  return solids;
}
