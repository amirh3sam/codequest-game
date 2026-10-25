export type GameDesign = {
  format: "codequest-grid-game";
  version: 1;
  name: string;
  playerColor: string;
  goal: number;
  obstacles: number;
  speed: number;
  points: number;
  theme: "night" | "garden";
};
export type ArcadeCreation = { id: string; design: GameDesign; best: number; won: boolean };
export const DEFAULT_DESIGN: GameDesign = {
  format: "codequest-grid-game",
  version: 1,
  name: "My Byte Run",
  playerColor: "#6ee7ed",
  goal: 5,
  obstacles: 6,
  speed: 4,
  points: 10,
  theme: "night",
};
const integer = (n: unknown, min: number, max: number) => Number.isInteger(n) && Number(n) >= min && Number(n) <= max;
export function isGameDesign(value: unknown): value is GameDesign {
  if (!value || typeof value !== "object") return false;
  const d = value as GameDesign;
  return (
    d.format === "codequest-grid-game" &&
    d.version === 1 &&
    typeof d.name === "string" &&
    d.name.trim().length >= 1 &&
    d.name.length <= 32 &&
    [...d.name].every((c) => c.charCodeAt(0) >= 32) &&
    /^#[\da-f]{6}$/i.test(d.playerColor) &&
    integer(d.goal, 3, 12) &&
    integer(d.obstacles, 0, 12) &&
    integer(d.speed, 2, 8) &&
    integer(d.points, 1, 100) &&
    ["night", "garden"].includes(d.theme)
  );
}
export function readGameDesign(stdout: string): GameDesign | null {
  if (stdout.length > 8000) return null;
  try {
    const d: unknown = JSON.parse(stdout);
    return isGameDesign(d) ? d : null;
  } catch {
    return null;
  }
}
export function isArcadeCreations(value: unknown): value is ArcadeCreation[] {
  if (!Array.isArray(value) || value.length > 8) return false;
  return (
    new Set(value.map((c) => c?.id)).size === value.length &&
    value.every(
      (c) =>
        !!c &&
        typeof c.id === "string" &&
        /^[\w-]{1,80}$/.test(c.id) &&
        isGameDesign(c.design) &&
        integer(c.best, 0, 1200) &&
        typeof c.won === "boolean",
    )
  );
}
export type GridRound = { player: number; walls: number[]; items: number[]; collected: number; won: boolean };
export const GRID_WIDTH = 12,
  GRID_HEIGHT = 8;
function neighbors(p: number): number[] {
  const x = p % GRID_WIDTH,
    y = Math.floor(p / GRID_WIDTH);
  return [
    [x - 1, y],
    [x + 1, y],
    [x, y - 1],
    [x, y + 1],
  ]
    .filter(([a, b]) => a >= 0 && a < GRID_WIDTH && b >= 0 && b < GRID_HEIGHT)
    .map(([a, b]) => b * GRID_WIDTH + a);
}
export function reachable(walls: readonly number[], start = 0): number[] {
  const found = new Set([start]),
    queue = [start];
  for (let i = 0; i < queue.length; i++)
    for (const n of neighbors(queue[i]))
      if (!walls.includes(n) && !found.has(n)) {
        found.add(n);
        queue.push(n);
      }
  return [...found];
}
export function newGridRound(d: GameDesign): GridRound {
  const walls: number[] = [];
  for (let i = 1; walls.length < d.obstacles && i < 96; i++) {
    const candidate = (i * 37) % 96;
    if (!candidate || candidate === 1 || candidate === 12) continue;
    const trial = [...walls, candidate];
    if (reachable(trial).length === 96 - trial.length) walls.push(candidate);
  }
  const free = reachable(walls)
    .filter((n) => n !== 0)
    .sort((a, b) => ((a * 29) % 97) - ((b * 29) % 97));
  return { player: 0, walls, items: free.slice(0, d.goal), collected: 0, won: false };
}
export function moveGrid(r: GridRound, dx: number, dy: number): GridRound {
  if (r.won || Math.abs(dx) + Math.abs(dy) !== 1) return r;
  const x = (r.player % 12) + dx,
    y = Math.floor(r.player / 12) + dy,
    next = y * 12 + x;
  if (x < 0 || x >= 12 || y < 0 || y >= 8 || r.walls.includes(next)) return r;
  const items = r.items.filter((n) => n !== next),
    collected = r.collected + Number(items.length < r.items.length);
  return { ...r, player: next, items, collected, won: items.length === 0 };
}
