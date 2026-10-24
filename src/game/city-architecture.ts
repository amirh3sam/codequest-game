import type Phaser from "phaser";

type Facade = { x: number; y: number; width: number; height: number };

/** Add materials inside an existing solid building, preserving its silhouette and clearance. */
export function detailFacade(art: Phaser.GameObjects.Graphics, box: Facade, accent: number, seed = 0): void {
  const { x, y, width: w, height: h } = box;
  const roof = Math.min(29, h * 0.24);
  art.fillStyle(0x020a14, 0.5).fillRoundedRect(x + 5, y + 5, w - 10, h - 10, 8);
  art.fillStyle(0x253d53).fillRoundedRect(x + 4, y + 3, w - 8, roof, 6);
  art.lineStyle(1, 0xc4e9f5, 0.32).lineBetween(x + 11, y + 5, x + w - 12, y + 5);
  art.fillStyle(0x122b40).fillRect(x + 11, y + roof + 3, w - 22, h - roof - 12);
  // Recessed glass bays, warm occupied rooms, mullions and reflected sky.
  const columns = Math.max(2, Math.floor((w - 18) / 36));
  const rows = Math.max(1, Math.floor((h - roof - 23) / 27));
  const cellW = (w - 22) / columns,
    cellH = (h - roof - 19) / rows;
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const wx = x + 12 + column * cellW,
        wy = y + roof + 7 + row * cellH,
        warm = (column * 3 + row + seed) % 7 === 0;
      art.fillStyle(warm ? 0xf6c879 : accent, warm ? 0.68 : 0.18 + ((row + column + seed) % 3) * 0.1);
      art.fillRect(wx, wy, cellW - 5, cellH - 6);
      art.fillStyle(0xddf6ff, 0.2).fillRect(wx + 2, wy + 2, Math.max(2, cellW * 0.18), cellH - 10);
      art.lineStyle(1, 0x030b15, 0.85).lineBetween(wx, wy + cellH * 0.46, wx + cellW - 5, wy + cellH * 0.46);
    }
  // Roof services: photovoltaic cells, a ventilator and small fixing points.
  const solarW = Math.min(62, w * 0.34);
  art.fillStyle(0x092137).fillRect(x + 13, y + 9, solarW, Math.max(6, roof - 13));
  art.lineStyle(1, 0x7eaac9, 0.6).strokeRect(x + 13, y + 9, solarW, Math.max(6, roof - 13));
  for (let n = 1; n < 4; n++)
    art.lineBetween(x + 13 + (solarW * n) / 4, y + 10, x + 13 + (solarW * n) / 4, y + roof - 5);
  const ventX = x + w - Math.min(39, w * 0.3);
  art.fillStyle(0x53697a).fillRoundedRect(ventX, y + 8, 23, Math.max(8, roof - 11), 2);
  for (let n = 0; n < 4; n++)
    art.lineStyle(1, 0x112337).lineBetween(ventX + 4 + n * 4, y + 11, ventX + 4 + n * 4, y + roof - 6);
  const gardenX = x + 19 + solarW,
    gardenW = Math.min(54, ventX - gardenX - 5);
  if (gardenW > 10) {
    art.fillStyle(0x101c24).fillRoundedRect(gardenX, y + 9, gardenW, roof - 12, 2);
    for (let n = 3; n < gardenW - 2; n += 5)
      art.fillStyle((n + seed) % 2 ? 0x467f68 : 0x78b38a, 0.9).fillEllipse(gardenX + n, y + roof / 2 + 1, 7, 5);
    art.fillStyle(0x758f93).fillRect(gardenX, y + roof - 5, gardenW, 2);
  }
  for (const bx of [x + 7, x + w - 7]) art.fillStyle(0xb4d0dc, 0.6).fillCircle(bx, y + 8, 1);
  // A recessed double door, doorstep and corner light strips anchor the facade.
  const doorW = Math.min(30, w * 0.25),
    doorH = Math.min(24, h * 0.25),
    doorX = x + w / 2 - doorW / 2;
  art.fillStyle(0x06131f).fillRect(doorX - 2, y + h - doorH - 7, doorW + 4, doorH + 3);
  art.fillStyle(accent, 0.4).fillRect(doorX, y + h - doorH - 5, doorW, doorH);
  art.lineStyle(1, 0xd2f4ff, 0.48).lineBetween(x + w / 2, y + h - doorH - 5, x + w / 2, y + h - 5);
  art.fillStyle(0x63889d).fillRect(doorX - 7, y + h - 5, doorW + 14, 3);
  art.fillStyle(accent, 0.75).fillRect(x + 5, y + roof + 5, 2, h - roof - 16);
  art.fillStyle(accent, 0.3).fillRect(x + w - 7, y + roof + 5, 2, h - roof - 16);
}

/** Live roof services and window glow on the painted starting campus. */
export function dressCampusFacades(scene: Phaser.Scene, reducedMotion: boolean): void {
  const roof = scene.add.graphics().setDepth(1).setName("campus-roof-services");
  for (const x of [519, 1166]) {
    roof.fillStyle(0x132b40).fillRoundedRect(x - 12, 65, 23, 17, 3);
    roof.lineStyle(1, 0xa1c6d9, 0.7).strokeRoundedRect(x - 12, 65, 23, 17, 3);
    for (let n = 0; n < 4; n++) roof.lineBetween(x - 8 + n * 5, 69, x - 8 + n * 5, 78);
    roof.lineStyle(2, 0x9cb9c8).lineBetween(x, 65, x, 39);
    roof.strokeEllipse(x, 49, 19, 8);
    const beacon = scene.add.circle(x, 38, 2, 0x8ff5dc, 0.8).setDepth(2);
    if (!reducedMotion) scene.tweens.add({ targets: beacon, alpha: 0.25, duration: 1700, yoyo: true, repeat: -1 });
  }
  for (const [x, tint] of [
    [415, 0xffd69b],
    [1061, 0x75e5ff],
  ] as const) {
    const light = scene.add.rectangle(x, 166, 53, 23, tint, 0.06).setDepth(1);
    if (!reducedMotion) scene.tweens.add({ targets: light, alpha: 0.16, duration: 4200, yoyo: true, repeat: -1 });
  }
  const ground = scene.add.graphics().setDepth(1).setName("campus-pavement-detail");
  for (const [x, y] of [
    [730, 330],
    [722, 678],
    [121, 525],
  ] as const) {
    ground.fillStyle(0x0b2332, 0.3).fillRoundedRect(x - 14, y - 6, 28, 12, 2);
    ground.lineStyle(1, 0xc0dae1, 0.35).strokeRoundedRect(x - 14, y - 6, 28, 12, 2);
    for (let n = -2; n <= 2; n++) ground.lineBetween(x + n * 4, y - 4, x + n * 4, y + 4);
  }
}

/** Flat street materials and a tram beyond the walking boundary add life without blocking a route. */
export function dressDistrictEdges(
  scene: Phaser.Scene,
  accent: number,
  seed: number,
  reducedMotion: boolean,
  skyline = false,
): void {
  const ground = scene.add.graphics().setDepth(-2.5).setName("city-street-detail");
  const buildings: Facade[] = [];
  if (skyline)
    for (let block = 0; block < 10; block++) {
      const x = 103 + block * 132,
        height = 82 + ((block * 17 + seed * 13) % 58);
      buildings.push({ x, y: 171 - height, width: 99, height });
      ground.fillStyle(0x263d54).fillRoundedRect(x, 171 - height, 99, height, 7);
      detailFacade(ground, { x, y: 171 - height, width: 99, height }, accent, block + seed);
    }
  ground.setData(
    "layout-obstacles",
    buildings.map((box, index) => ({ ...box, id: `skyline-${index}` })),
  );
  ground.lineStyle(1, 0x9bbfce, 0.07);
  for (let x = 84; x < 1480; x += 64) ground.lineBetween(x, 207, x, 700);
  for (let y = 207; y < 700; y += 32) ground.lineBetween(84, y, 1480, y);
  for (const [x, y] of [
    [145, 290],
    [1415, 460],
    [210, 686],
    [1220, 687],
  ] as const) {
    ground.fillStyle(0x07131e, 0.6).fillRoundedRect(x - 16, y - 7, 32, 14, 3);
    ground.lineStyle(1, 0x96b5c6, 0.3).strokeRoundedRect(x - 16, y - 7, 32, 14, 3);
    for (let n = -2; n <= 2; n++) ground.lineBetween(x + n * 5, y - 4, x + n * 5, y + 4);
  }
  // These are outside every story/course district's playable bounds.
  ground.fillStyle(0x07111f).fillRect(0, 728, 1536, 136);
  ground.fillStyle(0x233545).fillRect(0, 728, 1536, 9);
  ground.lineStyle(1, 0x8ba4b6, 0.45).lineBetween(0, 729, 1536, 729);
  for (let x = 12; x < 1536; x += 62) {
    ground.fillStyle(0xa8b9c5, 0.3).fillRect(x, 743, 30, 2);
    ground.lineStyle(1, 0xa1becf, 0.16).lineBetween(x, 729, x, 738);
  }
  for (const y of [775, 806]) {
    ground.fillStyle(0x31495a).fillRect(0, y, 1536, 4);
    ground.fillStyle(accent, 0.28).fillRect(0, y, 1536, 1);
  }
  for (let x = 10; x < 1536; x += 28) ground.fillStyle(0x4d6575, 0.3).fillRect(x, 779, 3, 27);
  const pod = scene.add
    .container(reducedMotion ? 1040 : -120, 790)
    .setDepth(-1)
    .setName("city-transit-pod");
  const body = scene.add.graphics();
  body.fillStyle(0x000713, 0.6).fillEllipse(0, 15, 116, 19);
  body.fillStyle(0x46677c).fillRoundedRect(-52, -12, 104, 28, 12);
  body.fillStyle(0x9bb2bf).fillRoundedRect(-48, -12, 96, 9, 7);
  body.fillStyle(0x071b2d).fillRoundedRect(-39, -2, 78, 12, 4);
  for (let x = -33; x <= 27; x += 15) body.fillStyle(accent, 0.75).fillRect(x, 0, 10, 8);
  body.fillStyle(0xffd79d).fillRect(46, -1, 3, 9);
  body.fillStyle(0xff8e9f).fillRect(-49, 0, 3, 7);
  body.fillStyle(accent, 0.4).fillRect(-33, 17, 66, 2);
  pod.add(body);
  if (!reducedMotion)
    scene.tweens.add({ targets: pod, x: 1656, duration: 18000 + seed * 210, repeat: -1, ease: "Linear" });
}
