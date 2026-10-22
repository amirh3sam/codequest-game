const WIDTH = 96,
  HEIGHT = 112,
  STEPS = 6;

/** Separate the original two legs completely before posing them. */
export function createDeveloperWalkAtlas(source: HTMLCanvasElement): HTMLCanvasElement {
  const atlas = document.createElement("canvas");
  atlas.width = WIDTH * STEPS;
  atlas.height = HEIGHT * 4;
  const out = atlas.getContext("2d");
  if (!out) throw new Error("Walking animation needs a canvas.");
  out.imageSmoothingEnabled = false;
  for (let row = 0; row < 4; row++) {
    const torso = document.createElement("canvas");
    torso.width = WIDTH;
    torso.height = HEIGHT;
    const body = torso.getContext("2d", { willReadFrequently: true });
    if (!body) continue;
    body.drawImage(source, 0, row * HEIGHT, WIDTH, HEIGHT, 0, 0, WIDTH, HEIGHT);
    const pixels = body.getImageData(0, 0, WIDTH, HEIGHT);
    const legs = [body.createImageData(WIDTH, HEIGHT), body.createImageData(WIDTH, HEIGHT)];
    const counts = Array.from({ length: WIDTH }, () => 0);
    for (let y = 80; y < 94; y++)
      for (let x = 0; x < WIDTH; x++)
        if ((pixels.data[(y * WIDTH + x) * 4 + 3] ?? 0) > 40) counts[x] = (counts[x] ?? 0) + 1;
    const occupied = counts.flatMap((count, x) => (count ? [x] : []));
    const center = ((occupied[0] ?? 38) + (occupied.at(-1) ?? 62)) / 2;
    const candidates = counts
      .map((count, x) => ({ x, score: count + Math.abs(x - center) * 0.2 }))
      .filter(({ x }) => Math.abs(x - center) <= 4)
      .sort((a, b) => a.score - b.score);
    const best = candidates[0];
    const split = best && (counts[best.x] ?? 0) <= 2 ? best.x : Math.round(center);
    const hipY = 64;
    for (let y = hipY; y < HEIGHT; y++) {
      const selected: number[] = [];
      for (let x = 0; x < WIDTH; x++) {
        const i = (y * WIDTH + x) * 4;
        const r = pixels.data[i] ?? 0,
          g = pixels.data[i + 1] ?? 0,
          b = pixels.data[i + 2] ?? 0;
        // Above the hands, keep colored fabric, skin and silver laptop on the body.
        const pants = Math.max(r, g, b) < 135 && Math.max(r, g, b) - Math.min(r, g, b) < 40 && r < g * 1.25;
        if ((pixels.data[i + 3] ?? 0) > 40 && (y >= 76 || pants)) selected.push(x);
        else if (y >= 76) pixels.data[i + 3] = 0;
      }
      for (let start = 0; start < selected.length; ) {
        let end = start;
        while (end + 1 < selected.length && selected[end + 1] === (selected[end] ?? 0) + 1) end++;
        const left = selected[start] ?? 0,
          right = selected[end] ?? left;
        const crosses = y < 95 && left < split && right >= split;
        for (let n = start; n <= end; n++) {
          const x = selected[n] ?? 0,
            i = (y * WIDTH + x) * 4;
          // The near shoe crosses the calf divider at its toe: keep it whole.
          const r = pixels.data[i] ?? 0,
            g = pixels.data[i + 1] ?? 0,
            b = pixels.data[i + 2] ?? 0;
          const farShoe =
            (row === 1 || row === 2) &&
            y >= 86 &&
            y <= 94 &&
            Math.min(r, g, b) > 90 &&
            Math.max(r, g, b) - Math.min(r, g, b) < 65;
          const index = farShoe
            ? row === 1
              ? 0
              : 1
            : row === 1 && y >= 95
              ? 1
              : row === 2 && y >= 94
                ? 0
                : (crosses ? x : (left + right) / 2) < split
                  ? 0
                  : 1;
          legs[index]?.data.set(pixels.data.subarray(i, i + 4), i);
          pixels.data[i + 3] = 0;
        }
        start = end + 1;
      }
    }
    body.putImageData(pixels, 0, 0);
    const layers = legs.map((data) => {
      // Antialiased toe edges can cross the divider. Keep the connected leg,
      // discarding isolated pixels rather than moving them as another foot.
      const remaining = new Set<number>();
      for (let p = 0; p < WIDTH * HEIGHT; p++) if ((data.data[p * 4 + 3] ?? 0) > 40) remaining.add(p);
      let largest: number[] = [];
      while (remaining.size) {
        const first = remaining.values().next().value;
        if (first === undefined) break;
        const queue = [first];
        remaining.delete(first);
        for (let p = 0; p < queue.length; p++) {
          const current = queue[p] ?? 0,
            x = current % WIDTH,
            y = Math.floor(current / WIDTH);
          for (let dy = -1; dy <= 1; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              if (x + dx < 0 || x + dx >= WIDTH || y + dy < 0 || y + dy >= HEIGHT) continue;
              const next = (y + dy) * WIDTH + x + dx;
              if (remaining.delete(next)) queue.push(next);
            }
        }
        if (queue.length > largest.length) largest = queue;
      }
      const connected = new Set(largest);
      for (let p = 0; p < WIDTH * HEIGHT; p++) if (!connected.has(p)) data.data[p * 4 + 3] = 0;
      const canvas = document.createElement("canvas");
      canvas.width = WIDTH;
      canvas.height = HEIGHT;
      canvas.getContext("2d")?.putImageData(data, 0, 0);
      let bottom = hipY;
      for (let y = hipY; y < HEIGHT; y++)
        for (let x = 0; x < WIDTH; x++) if ((data.data[(y * WIDTH + x) * 4 + 3] ?? 0) > 40) bottom = y;
      return { canvas, bottom };
    });
    for (let frame = 0; frame < STEPS; frame++) {
      const phase = (frame / STEPS) * Math.PI * 2;
      const bob = Math.cos(phase * 2) * 0.5;
      out.save();
      out.translate(frame * WIDTH, row * HEIGHT);
      for (const index of [0, 1]) {
        const leg = layers[index];
        if (!leg) continue;
        const angle = phase + index * Math.PI,
          swing = Math.sin(angle),
          lift = Math.max(0, Math.cos(angle));
        const side = row === 1 || row === 2;
        const endY = 104 - lift * 4 + (side ? 0 : swing * 2);
        const scale = (endY - hipY) / (leg.bottom - hipY);
        for (let y = hipY; y <= leg.bottom; y++) {
          const t = (y - hipY) / (leg.bottom - hipY);
          const bend = side ? (row === 1 ? -1 : 1) * lift * 3 * Math.sin(t * Math.PI) : 0;
          const x = swing * (side ? 9 : 0.8) * t + bend;
          const top = Math.round(hipY + bob + (y - hipY) * scale);
          const bottom = Math.round(hipY + bob + (y + 1 - hipY) * scale);
          if (bottom > top) out.drawImage(leg.canvas, 0, y, WIDTH, 1, Math.round(x), top, WIDTH, bottom - top);
        }
      }
      out.drawImage(torso, 0, bob);
      out.restore();
    }
  }
  return atlas;
}
