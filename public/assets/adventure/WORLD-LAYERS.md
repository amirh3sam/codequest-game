# World layers and movement

Created with the built-in image-generation tool on 2026-10-22.

| Saved asset | Runtime use |
| --- | --- |
| `public/assets/adventure/woodland-ground.png` | Clean ground/architecture layer, rendered at 1536 × 864 world units. |
| `public/assets/adventure/environment-objects.png` | Transparent fir, oak, boulder and fence sprites with separately authored solid footprints. |

The previous `woodland-outpost.png` remains source/reference art. Tree foliage
is rendered with its original alpha, without rectangular backdrop crops.
Objects and hero sort by the position of their feet. Chests, trees, rocks,
fences, buildings, the lesson pedestal, Gatekeeper and pond shoreline block
movement. Small swept movement steps prevent tunneling, with diagonal sliding.

Chest numbers sit on plates within each chest's display container. The world
is 1.6 times wider and taller, with a following camera and more space between
chests. Content positions and solid footprints live in `src/content/village.json`.
The version-1 save format is unchanged; positions inside newly solid objects
return to the safe entrance without changing task progress.

Walking uses six articulated poses generated from the existing warrior art:
independent hip/knee/ankle motion, alternating planted/lifted feet, registered
torso and a cycle clock based on actual traveled distance. Blocked movement
returns to idle. The small body rise is disabled with reduced motion.
Implementation: `src/game/walk-cycle.ts`, `warrior.ts` and `collision.ts`.

## Final ground-layer prompt

Edit target: the attached woodland game map. Preserve its exact 16:9 composition, camera, detailed painted fantasy style, two medieval cottages with their barrels tight against the walls, upper-right stone gateway with banners and braziers, turquoise lower-right pond and shoreline, dense continuous border woodland, ALL path positions and stone paving. Make a CLEAN GROUND LAYER for a real layered adventure game: REMOVE EVERY freestanding tree within the interior clearing, including the two isolated firs in the center-left, the single small fir between the cottages, the leafy tree beside the right vertical path, the small leafy tree below the middle pathway, the round tree in the lower clearing, and scattered little saplings. Remove the freestanding boulders, logs, stumps, wooden fence segments, and dense bushes from the interior clearing as well. Replace the removed objects with seamless detailed walkable grass or the path that would lie behind them. Keep the dense forest around the outer edge intact; do not remove the cottages, the gateway, braziers or pond. Preserve small low flowers and ground cover. This layer will have real transparent solid tree, rock and fence objects placed over it by the game engine. Do not add any new props, characters, labels, numbers, user interface, chests or text. Maintain the same map layout, lighting, perspective and all architectural footprints.

## Final environment-object prompt

Use case stylized-concept. Production transparent ENVIRONMENT SPRITE ATLAS for a top-down medieval woodland adventure RPG. One wide image with exactly FOUR isolated complete objects in four separate equally wide columns, generous clear transparent gutters. From left to right: 1 a full tall evergreen fir tree with lush deep green layered needles and visible brown trunk down to the ground; 2 a full beautiful leafy round oak tree, textured green foliage and branching wooden trunk; 3 a low moss-covered gray boulder; 4 one straight wooden split-rail fence segment with two horizontal weathered rails and three vertical posts. Background MUST be truly transparent. NO ground patch, NO grass floor, NO background color, NO rectangular background, NO cast ground shadows, NO labels, NO text, NO grid. Each object fully contained in its own column, all branches and the entire trunk/feet visible. Trees should be about four times the height of the rock and fence. Same visual language as a premium richly detailed hand-painted 32-bit fantasy RPG woodland map: tactile painted materials, clear lightly pixelated edges, golden afternoon highlights from upper left, deep green shadows. Standard three-quarter overhead orthographic top-down camera; recognizable full tree silhouettes, not isometric tiles. The tree trunks and spaces between branches must have transparent holes through which a hero standing behind them will be visible. All objects individually extractable. No decorative flowers or extras around the bases.
