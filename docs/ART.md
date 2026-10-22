# Game art catalogue

The first art milestone uses original Kenney PNG sheets, served locally from
`public/assets/`. Every pack includes its original `License.txt` (CC0). No runtime
downloads or paid assets are required.

| Pack | Version | Local sheet | Grid | Use |
| --- | --- | --- | --- | --- |
| [Tiny Town](https://kenney.nl/assets/tiny-town) | 1.1 | `public/assets/tiny-town/tilemap.png` | 12 × 11, 16 px, no spacing | Village terrain, trees and buildings |
| [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) | 1.0 | `public/assets/tiny-dungeon/tilemap.png` | 12 × 11, 16 px, no spacing | Heroes, enemies, dungeon scenery |
| [Roguelike/RPG](https://kenney.nl/assets/roguelike-rpg-pack) | 1.0 | `public/assets/roguelike-rpg/tilemap.png` | 57 × 31, 16 px, 1 px spacing | Lesson scroll and future props |
| [Pixel Platformer](https://kenney.nl/assets/pixel-platformer) | 1.2 | `public/assets/pixel-platformer/tilemap.png` | 20 × 9, 18 px, no spacing | Blue gem |

Tiny Town's original `Sample.png` is retained as `public/assets/tiny-town/sample.png`
for reference; it is not a playable CodeQuest map.

## Selected sprites

The current tech-city art is generated locally and served from `public/assets/tech-city/`.
Loader keys live in [`src/game/assets.ts`](../src/game/assets.ts).

| Role | Source | Runtime frame | Appearance |
| --- | --- | --- | --- |
| Boy developer | `developers.png`, left column | `hero-boy`, 0 | Blue hoodie, laptop, backpack, long trousers and sneakers |
| Girl developer | `developers.png`, right column | `hero-girl`, 0 | Violet hoodie, laptop, backpack, long trousers and sneakers |
| Digital guide | `coding-stations.png` | `tech-props`, 2 | Tablet on a compact stand |
| Task terminal | `coding-stations.png` | `tech-props`, 0/1 | Inactive cyan / completed green coding station |
| Firewall | `coding-stations.png` | `tech-props`, 3 | Holographic server core |
| Gem | Pixel Platformer | `pixel-platformer`, 67 | Blue diamond |

Characters and stations use normalized 96 x 112 frames. Idle characters have four
facing rows; six articulated walking poses per facing keep shoes registered to
the ground and advance with actual movement. The laptop and backpack stay on the
torso. Girl west-facing source art is mirrored to face the correct direction.

`city-ground.png` provides the 1536 x 864 district backdrop; `city-objects.png`
provides transparent street trees, utility cabinets and metal rails. Separate
footprints stop movement at trees, stations, buildings, raised planters and the
reflecting pool. Labels attach to station fronts; depth follows ground feet.
A following camera and wider station spacing keep routes readable. Reduced-motion
preferences disable decorative animation. The DOM UI uses blue glass panels and
cyan accents with local system fonts.

All four PNGs and final generation prompts are recorded in
[tech-city/ARTWORK.md](../public/assets/tech-city/ARTWORK.md). Previous fantasy
assets and their prompts remain under `public/assets/adventure/` as references.
All artwork is local; the game never calls an image service.

## Initial village renderer (retained fallback)

The fallback in `src/game/scenery.ts` combines the original sheets with a seeded, canvas-drawn
grass and warm dirt-path texture, flower verges, fences, garden beds, lanterns,
a stone boss shrine and a pond with reeds and lily pads. Trees, buildings and
the hero sort by depth so walking behind scenery reads naturally. Round trees
use Tiny Town frame 5; tall trees use the matching frames 4 and 16. Building
fronts now show windows and doors, with blue and red roofs distinguishing them.

Pond ripples, lantern glow, chimney smoke and floating motes animate subtly.
Available quests have gold beacons; completed tasks turn green and emit a short
sparkle burst. The DOM menus use framed forest-green panels, gold accents, a
hero vignette and language badges, with a segmented task-progress indicator in
the HUD. The game uses local fonts and assets without runtime image services.
Reduced-motion preferences disable decorative animation, including walking strides.

## Download provenance

Downloaded from Kenney on 2026-10-21:

- [Tiny Town archive](https://kenney.nl/media/pages/assets/tiny-town/a415fbeb49-1735736916/kenney_tiny-town.zip)
- [Tiny Dungeon archive](https://kenney.nl/media/pages/assets/tiny-dungeon/f8422efb44-1674742415/kenney_tiny-dungeon.zip)
- [Roguelike/RPG archive](https://kenney.nl/media/pages/assets/roguelike-rpg-pack/12c03cd78b-1677697420/kenney_roguelike-rpg-pack.zip)
- [Pixel Platformer archive](https://kenney.nl/media/pages/assets/pixel-platformer/33bb4921eb-1696667883/kenney_pixel-platformer.zip)

For Tiny Town, Tiny Dungeon and Pixel Platformer, the local sheet is the pack's
`Tilemap/tilemap_packed.png`. For Roguelike/RPG, it is
`Spritesheet/roguelikeSheet_transparent.png`.
