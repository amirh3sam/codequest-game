/** Original Kenney sheets, loaded locally so the game works without a CDN. */
export const TILE_SIZE = 16;

export const TILESETS = [
  { key: "tiny-town", path: "assets/tiny-town/tilemap.png", tileSize: TILE_SIZE, spacing: 0 },
  { key: "tiny-dungeon", path: "assets/tiny-dungeon/tilemap.png", tileSize: TILE_SIZE, spacing: 0 },
  { key: "roguelike-rpg", path: "assets/roguelike-rpg/tilemap.png", tileSize: TILE_SIZE, spacing: 1 },
  { key: "pixel-platformer", path: "assets/pixel-platformer/tilemap.png", tileSize: 18, spacing: 0 },
] as const;

/** Frame numbers are zero-based. Provenance and sheet dimensions: docs/ART.md. */
export const SPRITES = {
  heroBoy: { texture: "hero-boy", frame: 0 },
  heroGirl: { texture: "hero-girl", frame: 0 },
  scroll: { texture: "tech-props", frame: 2 },
  gem: { texture: "pixel-platformer", frame: 67 },
  boss: { texture: "tech-props", frame: 3 },
} as const;
