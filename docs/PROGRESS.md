# Progress log (newest on top)

## 2026-10-22 (Logic Junction)
- **Done:** added four lesson pages, eight conditions missions and the Router boss with three hints in JavaScript, TypeScript, Python and Java. Generalized the loader, HUD, journal, drafts, penalties, victory and world markers to use the active district. The world map now opens Logic Junction after the Firewall; travel and Continue retain independent district progress. Logic Junction uses a violet campus tint and decision-network signage, reusing the existing solid map. No save migration or new dependencies.
- **Checks:** 201 unit tests and all 71 Chromium cases passed across the complete UI run and a 58-case worker recheck. The first full run passed 69 cases and exposed two Java checks competing with title-screen rendering; worker-only fixtures now sleep the renderer, retain the real workers and pass unchanged runtime assertions. The Java recovery test allows two compile caps plus the run timeout. All 72 reference programs passed. District travel, Continue, reset isolation, hints/victory and all 48 walking frames were verified; a Logic Junction screenshot was inspected. Lint, type checking and the production build passed; production test hooks are absent.
- **Release:** game commit `3f0f671` is deployed at https://codequest-game-inky.vercel.app/ (`dpl_CynDAn9qAixZqwB3M7oYijatS8tm`). An unauthenticated production browser received HTTP 200, entered Logic Junction, completed all eight missions and the Router, reported no page errors and confirmed test hooks are absent. The earlier public check also submitted real code in all four languages successfully.
- **Next:** CodeMirror and later districts, following the user's authorization to continue without routine confirmation and to commit each completed task.
- **Blockers:** none for the public game; CLI publication remains available while GitHub app repository access is unconnected.

## 2026-10-22 (public verification and interaction timing)
- **Done:** launched https://codequest-game-inky.vercel.app/ from public commit `8a9fd28`. A fresh, unauthenticated browser successfully submitted real code in JavaScript, TypeScript, Python and Java; each returned a correct answer with HTTP-200 runtime assets and no page errors. Added the live link to the README. Fixed a quick-key interaction race found by Linux CI: E/Space now dispatches on key-down instead of relying on the next render frame.
- **Checks:** the full physical eight-terminal/Firewall route passed after the input fix. Initial Linux CI passed 68 of 69 tests and exposed the missed short press; the following CI run for commit `508f81f` passed all 69 browser tests plus lint, types and unit tests.
- **Next:** Logic Junction content and area travel; commit and publish it after validation.
- **Blockers:** GitHub-to-Vercel automatic builds need GitHub app repository access; CLI deployment works and publishes the public game successfully.

## 2026-10-22 (walking fix and public launch)
- **Done:** replaced overlapping standing/animated legs with exactly two extracted leg layers per developer pose; retained complete shoes and removed detached edge fragments. The boy and girl keep their laptop, backpack and upper body while their legs walk. Created public `amirh3sam/codequest-game` and separate Vercel `codequest-game` project in `amirhesam-tech`; the original private repository and calculator project remain intact. Added deployment configuration and persistent instructions to commit completed tasks and continue authorized roadmap work.
- **Checks:** 196 unit tests and nine focused Chromium tests passed, including all 48 walking frames, both avatars/Continue, full physical quest route, rewards, victory, reset, terminal/trunk collision and transparent tree layering. Three final art/avatar/walking checks also passed after removing tiny edge fragments. Lint, type checking and the production build passed.
- **Next:** publish and verify the public game, then implement Logic Junction (conditions) without another confirmation.
- **Blockers:** none; GitHub and Vercel authentication are available.

## 2026-10-22 (modern tech city)
- **Done:** replaced the fantasy setting with Variable District, a modern glass-and-steel coding campus. Added distinct boy/girl developers in blue/violet hoodies with laptops and backpacks, directional poses and articulated walking. Replaced chests with coding terminals, the scroll with a digital guide and the Gatekeeper with a Firewall server core. Added city street trees, utility cabinets and metal rails, blue/cyan menus and tech-district names. Aligned building, planter and reflecting-pool collision with the new terrain. Task IDs, runnable solutions, rewards and version-1 saves remain compatible.
- **Checks:** 196 unit tests and all eight focused Chromium checks passed. Browser coverage includes the full physical eight-terminal/Firewall journey, coding/rewards/Continue, hints/victory, heart reset, local assets and both avatar choices. Obstacle checks cover numbered terminals, solid trunks and transparent canopy layering. The terminal-detour test now follows the open left lane around the new raised planter. Desktop title/district/editor and mobile title were inspected. Lint, type checking and production build passed.
- **Next:** Logic Junction content/map, CodeMirror and audio.
- **Blockers:** none. Generated assets and final prompts are recorded in `public/assets/tech-city/ARTWORK.md`.

## 2026-10-22 (solid world objects and walking)
- **Done:** separated the painted ground from transparent tree/rock/fence sprites; removed rectangular foreground crops. Added solid chest, trunk, rock, fence, building, pedestal and boss footprints plus a polygonal pond shore. Swept foot collision prevents tunneling and permits sliding. Chest numbers are attached to their fronts. Enlarged the world to 1536 × 864 with 1.6× chest spacing and a following camera. Added six articulated walking poses, alternating planted/lifted feet, torso registration and distance-driven timing; walking stops when blocked.
- **Checks:** 196 unit tests and seven Chromium tests passed. New tests push against chests/trunks, verify the attached numbers, walk around obstacles and check transparent canopy layering. The full physical quest route still reaches and solves all eight tasks and the boss. Existing rewards, saves, reset and art checks passed. Browser screenshots were inspected.
- **Next:** Condition Bridge content/map; CodeMirror and audio.
- **Blockers:** none. Save schema unchanged; invalid positions return to the safe entrance while retaining progress.

## 2026-10-22 (fantasy adventure artwork)
- **Done:** replaced the small chibi hero with tall sword-and-helmet knights, long armored legs, shield, cape and sixteen directional/stride poses. Added crimson/amethyst variants, boot alignment and a readable HUD portrait. Integrated a detailed painted woodland outpost, ornate closed/open treasure chests, magical lesson scroll and armored Gatekeeper. Aligned quest locations, collisions and foreground layers with the new map; existing saves retain their version-1 shape.
- **Checks:** 190 unit tests and five Chromium tests passed. The new browser journey turns in all four directions, walks to all eight chests, opens each with E, solves the tasks and walks to/defeats the boss. Existing movement/rewards/reload, hints/victory, reset and art smoke checks passed. Lint, type checking and production build passed. Desktop title, village and editor plus mobile title were inspected.
- **Next:** Condition Bridge content/map; CodeMirror and audio remain future work.
- **Blockers:** none. Generated PNGs and final prompts are kept in `public/assets/adventure/`.

## 2026-10-21 (village graphics)
- **Done:** polished the playable village with textured grass, warm paths, layered tree varieties, house windows/doors, garden beds and fences, a pond with reeds and lily pads, lanterns and a stone boss shrine. Added subtle ripples, smoke, motes, quest beacons, completion sparkles and depth sorting. Redesigned the title screen, language cards, panels and HUD; added segmented quest progress and preserved crisp sprite pixels. Decorative animations respect reduced-motion preferences.
- **Checks:** 190 unit tests and six Chromium checks passed, including the full eight-task/boss journey, movement, heart reset and saves. Lint passed. Desktop title, village and editor screenshots were inspected, plus the mobile title layout. No new dependencies or save changes.
- **Next:** Condition Bridge content and map; CodeMirror and directional walk frames remain future work.
- **Blockers:** none. The new visuals are available on the existing local dev server.

## 2026-10-21 (playable village)
- **Done:** replaced the static preview with a connected game: language/hero/name selection, Continue and confirmed replacement, village walking and collisions, scroll/chest/boss interactions, HUD, eight tasks and a boss in every language, Run/Submit through real workers, grading, hearts, gems, boss hints, retries, victory, world map and automatic saves. Added a JavaScript worker, JSON content validation and loader. The current editor is a plain text area; map layout uses JSON rather than Tiled.
- **Checks:** 190 unit tests passed. JavaScript, TypeScript and Java reference-solution browser tests passed; Python passed in isolation after a parallel cold-load timeout. All 36 programs passed real runners/graders. Three player-flow tests passed: movement/code/rewards/reload, eight tasks plus boss/hint/victory, and last-heart reset with the lesson preserved. Save and art browser checks also passed. Lint, types and production build passed; test hooks remain excluded from production.
- **Next:** Condition Bridge content and map; CodeMirror, directional walking animations, boss health-bar polish, and remaining language UI journeys.
- **Blockers:** none for playing Variable Village. Heavy runtime reference tests now execute sequentially within their file to avoid cold-load contention. Areas 2–7 are displayed as future content.

## 2026-10-21 (browser saves)
- **Done:** implemented `core/save.ts` with independent `codequest:v1:<lang>` slots, the existing version-1 shape, validation before loading/writing, and explicit empty/corrupt/unsupported-version/storage-error results. Corrupt and unsupported saves stay untouched; quota and access failures are reported without crashing. Test-mode hooks expose save APIs for real-browser verification.
- **Checks:** 180 unit tests passed (61 new save cases); three Chromium tests passed (two saves tests and the art smoke). Verified complete per-language progress survives reload and one invalid language slot leaves the others intact. Type-checking, lint and the production build passed. Unchanged runner E2E suites were not rerun.
- **Next:** content schema, loader and validation tests (FR-16).
- **Blockers:** none. The save adapter is ready for gameplay integration; the visible screen remains the art preview. Continue/New screens and calling saves after gameplay transitions remain later roadmap tasks.

## 2026-10-21 (core progression)
- **Done:** implemented `core/state.ts` with the documented version-1 shape and pure, immutable state changes. Added task ordering, one-time gem rewards, three-heart penalties and area resets, lesson discovery, ordered boss hints, boss completion and seven-area unlocks. Delayed failures from another area are ignored. Reset notifications are returned for the future UI; completed areas remain completed.
- **Checks:** 119 unit tests passed (28 new progression tests), including a full seven-area rules journey, penalties, duplicate rewards, immutable inputs, hint costs, last-heart resets and earlier-area preservation. Type-checking, lint and the production build passed. No UI or worker implementation changed, so browser/runner E2E suites were not rerun for this task.
- **Next:** `core/save.ts` for per-language browser slots, version checking and corrupt-save handling (FR-14).
- **Blockers:** none. Game rules are ready for integration; the visible screen is still the art preview.

## 2026-10-21
- **Done:** installed the core Ruflo skill for Codex; initialized project runtime and local memory; added the pinned `npm run ruflo` command. Completed M0 art selection: vendored four Kenney CC0 sheets and original licenses, catalogued hero/scroll/gem/boss frames, and added a static boot preview. Updated the Chromium smoke test to verify local art loading and capture a preview.
- **Checks:** all 91 unit tests, lint, type-checking, production build and the Chromium art smoke test passed. Visually inspected the captured preview. Ruflo memory initialization passed 6/6 checks; project context was stored and retrieved successfully. The unchanged runner E2E suites were not rerun for this art milestone.
- **Next:** M1 `core/state.ts` and game rules for hearts, gems, solving tasks, resetting the current area and unlocking the next area.
- **Blockers:** none for game development. Optional Ruflo integrations remain unconfigured; see `docs/RUFLO.md`.

## 2026-10-04
- **Done:** git init, base files, reference images moved to `docs/reference/`. Requirements gathered; PRD, ARCHITECTURE, ROADMAP, DECISIONS written and approved. Created 10 subagents and 8 workflow commands. Scaffolded Vite + TS + Phaser; lint, typecheck, unit and e2e smoke tests pass; dev server runs on :5173. CI workflow added.
- **Next:** M0 spike: run Java in the browser with teavm-javac.
- **Blockers:** none.
