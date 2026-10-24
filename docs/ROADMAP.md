# CodeQuest — Roadmap

Each task fits in one session. Tags point to PRD requirements.

## City maps and programmable lighting (2026-10-24)

- [x] Add a Start from zero robot rescue for complete beginners: instruction cards, real-code naming/prediction/charging, a guided value replay, an independent two-input rescue, transfer practice, layered clues, per-adventure backups and phone support.
- [x] Simplify the desktop HUD to Tablet, World map and Menu; retain all tools in menus, add circuit cursors and file-format icons, resize inline output with a saved divider, remove the duplicate Console tab and style project file controls.
- [x] Match lighting/transit click targets to visible building shapes and sprite interactions to opaque artwork; show a pointer over clickable props and leave surrounding pavement for movement.
- [x] Add a character-led guided tour inspired by amirhesamtech.com, with animated captions, live control highlights/arrows, actual menu/tablet navigation, saved resume and phone-safe placement; retain the detailed handbook.
- [x] Let players rename, restart or delete individual characters and erase the local profile with explicit confirmation, scoped cleanup, backup reminders and protection against old saves reappearing.
- [x] Add first-visit interactive 2D training, all-menu/tablet explanations, safe real-code exercises and per-district lesson briefings; remember progress and provide replay/skip controls on desktop and mobile.
- [x] Add visible click destinations and collision-aware walking routes, precise diagonal arrival, blocked-destination fallback and manual-input cancellation; validate every task/boss approach across all 23 maps.
- [x] Detail existing buildings with glass bays, mullions, doors, solar roofs, vents and rooftop gardens; add street materials and ambient transit beyond walkable routes.
- [x] Replace the simple task splash with a physical monitor boot sequence, mission preview, language colors and a keyboard/stand; support skip, cancellation, reduced motion and mobile sizes.
- [x] Keep Run and output reachable on short mobile screens; cover actual tablet/task execution in mobile Chromium and WebKit, including streamed Java compiler failure recovery.
- [x] Replace trailing boss wires with attached status panels throughout the city.
- [x] Move mobile quests, guide and tools into a hamburger menu; reserve portrait for menus and landscape for city exploration.
- [x] Animate short touch steps with correct facing, cancel held controls cleanly and preserve reduced-motion behavior.
- [x] Prevent accidental Packet Dash restarts, count active seconds and preserve rounds across pauses and backgrounding.
- [x] Audit all 23 rendered maps for unintended object, label and arrival overlaps; add a browser clearance check for future layout changes.
- [x] Turn every world-map card into one of 23 playable city districts, each with eight tasks and a separate boss.
- [x] Share task and boss progress between city maps, the tablet and the 23-district progress page; migrate released saves.
- [x] Add a richer transit building to each map, keep it active in unlocked districts and land returning players beside the destination building.
- [x] Replace the unclear beacon flow with a free lighting console: program online/offline and colors for whole maps or individual terminal routes, with persistent per-map settings.

## Current priority: learning through adventure (2026-10-22)

- [x] Add an adventure library for multiple journeys in the same or different languages, preserving old saves and separate practice drafts.
- [x] Give Logic Junction an elevated skyrail map, independent paths, scenery, solid control hub and terminal positions.
- [x] Replace simple beeps with textured footsteps, clicks, swishes and layered chimes; add a saved effects-volume control.
- [x] Turn the Variable District finale into two free, teachable hub repairs before its graded Firewall challenge. Persist each checkpoint, show it on the world hub and in the tablet log, and let players review the completed sequence.
- [x] List every saved adventure beneath its language on the title screen; add portable export/import backups that load as separate saves.
- [x] Add touch movement, touch interaction and tap-to-walk using the existing solid-object rules.
- [x] Soften and vary the synthesized footsteps.
- [x] Add Packet Dash, a free 2D city runner at a solid arcade cabinet, with mobile jump controls and per-adventure high scores; soften the footstep attack and lower its impact.
- [x] Prepare an anonymous beginner playtest plan for the staged repair loop, tablet lessons, save recovery and touch controls ([playtest plan](BEGINNER-PLAYTEST.md)).
- [ ] Next: run 3–5 beginner sessions and use repeated observations to prioritize the next curriculum/map task.

- [x] Replace the 3D hand model with an illustrated 2D wrist-tablet animation: lift, settle and screen entry, preserving city zoom and the editor/output layout.
- [x] Revise the tablet opening to a city zoom followed by the character's first-person view of their attached wrist tablet. Keep the sequence to three seconds, with skip, cancellation and instant reduced-motion access. Missions and Guide remain inside the device.
- [x] Keep practice code, Run and its output on one page, with results below the editor in all four languages and on narrow screens.
- [x] Verify that players opening the same public link in separate browsers retain independent characters and progress; make the local-save scope clear.

The user reviewed the public game and identified that numbered exercises alone
do not make studying engaging. The next milestone is a short, teachable adventure
with characters, exploration and a visible result from the player's code.
See [GAME-DESIGN.md](GAME-DESIGN.md) for the story, teaching sequence, drone-mission
pilot, build order and beginner playtest criteria. Later-district expansion and
editor polish follow this pilot.

- [x] Review the current learning/game loop and record a concrete redesign plan.
- [x] Prototype the stranded-drone mission: quest giver, clear objective, short
      contextual lesson, safe code preview and persistent world repair.
- [x] Add targeted explanations, an independent repair after guided edits, and a transfer exercise.
- [x] Open a solid courier lane and let Kai react to the repair.
- [x] Add the first optional discovery beyond the courier mission: Mina's community beacon, a garden/arcade event choice, real string-variable practice, saved courtyard colors and Signal Maker badge. More branches remain future work.
- [x] Add original synthesized sound effects for footsteps, interactions, tablet opening, code results, delivery and celebrations, with a saved mute toggle.
- [x] Validate the pilot in all four languages; preserve old saves and one-time rewards.
- [ ] Playtest comprehension and enjoyment with beginners.
- [x] Add a T-key developer tablet with an animated opening, editor/example/console tabs, real free practice and saved per-language drafts.
- [x] Replace unrelated GitHub planning pictures with screenshots of the running game.

## Current art direction: modern tech city (2026-10-22)
Delivered: replaced the fantasy setting with Variable District, a modern coding campus.
Boy/girl developers wear hoodies, carry laptops and backpacks; quests use coding
terminals and a Firewall data-hub challenge. Preserve the solid-object physics,
walking, wider spacing, camera, task IDs, runners and version-1 saves.

- [x] Correct developer walking to remove the extra-leg overlap; validate all 48 frames.
- [x] Create the public game repository, commit/push the playable city and deploy a separate Vercel project.
- [x] Logic Junction conditions lessons, eight tasks and a boss in all four languages; connected area travel and saves. Validated the second-district journey, reset isolation and all 72 reference programs across both districts.

## Current priority: playable first area (2026-10-21)
The user asked to replace the static preview with gameplay. Build a connected
Variable Village slice: New/Continue, language and hero/name selection, movement,
lesson/task interactions, eight tasks and a boss, real workers, grading, HUD and
autosaves. The first editor can be a plain text area; CodeMirror and Tiled map
authoring remain follow-up polish. Keep the version-1 save schema.

**Playable slice delivered:** all four languages have eight tasks and a boss;
movement, interactions, Run/Submit, hearts/gems, hints, victory and Continue are
connected. JavaScript's complete player journey and all 36 reference programs
passed browser checks. Condition Bridge is shown as unlocked after victory but
its gameplay is still coming next.

## Village visual polish (2026-10-21)
- [x] Solid-world behavior (2026-10-22): real transparent environment objects, swept collision, attached chest numbers, greater spacing, following camera and articulated walking; keyboard obstacle and complete-route browser checks.
- [x] Fantasy-adventure art direction (2026-10-22): long-legged sword/helmet warriors, four-direction walking poses, painted woodland outpost, matching quest props and Gatekeeper; full-map keyboard play-through verified.
- [x] Richer forest scenery, warm paths, gardens, house fronts, lanterns, pond details, depth sorting, quest beacons and completion sparkles; redesigned title, panels and HUD, with reduced-motion support.

## M0 — Setup
- [x] Scaffold Vite + TypeScript + Phaser, Biome, Vitest, Playwright, CI, smoke test (Phase 3 of setup)
- [x] **Spike: Java runner**: compile + run `System.out.println` with teavm-javac in a worker; measure load/compile time. Decide wasm vs Piston fallback (FR-8). ✅ wasm works, see DECISIONS
- [x] Spike: Python runner with self-hosted Pyodide in a worker (FR-8)
- [x] Spike: TypeScript runner with `typescript-js` 6.0.3 in a worker (FR-8)
- [x] Pick Kenney CC0 packs (tiles, boy/girl hero, scroll, gem, boss), add `docs/CREDITS.md` (catalogue: `docs/ART.md`; local boot preview)

## M1 — MVP (areas 1–2, all 4 languages)
Core
- [x] `core/state.ts` + `rules.ts`: hearts, gems, solve, reset area, unlock next (FR-9, FR-10, FR-11, FR-13) + unit tests
- [x] `core/save.ts`: per-language slots, versioning, corrupt-save handling (FR-14)
- [x] Content schema + loader + validation test (FR-16)

Runners and grading
- [x] Worker host with 5 s timeout + JS runner (FR-8)
- [x] TS runner (FR-8)
- [x] Python runner (FR-8)
- [x] Java runner (FR-8)
- [x] Grader: output compare + code rules + heart logic (FR-9)

Screens
- [x] Title screen: New / Continue (FR-1, FR-14)
- [x] Language select (FR-1)
- [x] Hero select (FR-2)
- [x] Name screen with dice (FR-3)
- [x] World map with 7 nodes, locks (FR-4; later-area gameplay pending)

World
- [ ] Tiled map: Variable Village (area-01) (FR-5)
- [x] Hero movement, directional animation, swept collisions and following camera (FR-5)
- [x] Interactables + "Press E" prompt + input pause while typing (FR-5)
- [x] HUD: name, hearts, gems, area, progress (FR-15)
- [x] Lesson scroll panel (FR-6)
- [ ] Task panel with CodeMirror, Run, Submit, results (FR-7, FR-8, FR-9)
- [x] Task gates/paths open in order (FR-7; numbered task spots unlock sequentially)
- [x] Out of hearts → area reset (FR-10)
- [ ] Boss panel: health bar, hints shop (FR-12; challenge and hints live, health bar polish pending)
- [x] Victory screen → unlock next area (FR-13)
- [x] Pause menu (FR-15)
- [ ] Tiled map: Condition Bridge (area-02) (FR-5)

Content (lesson + 8 tasks + boss each)
- [x] Java: Variables (FR-16)
- [x] Java: Conditions (FR-16)
- [x] JavaScript: Variables (FR-16)
- [x] JavaScript: Conditions (FR-16)
- [x] TypeScript: Variables (FR-16)
- [x] TypeScript: Conditions (FR-16)
- [x] Python: Variables (FR-16)
- [x] Python: Conditions (FR-16)
- [x] E2E: every reference solution passes in its real runner (FR-16; all 72 programs across both districts)
- [ ] E2E: full play-through of area 1 (FR-1…FR-15; JavaScript journey passed; remaining language UI journeys pending)

## M2 — Full game ("Launch" locally)
- [ ] Areas 3–7 maps: Loop Forest, Array Mountain, Function Valley, Object Castle, Abstraction Realm (FR-5)
- [ ] Content for areas 3–7 × 4 languages (one session per language × area) (FR-16)
- [ ] Sound effects + music (free/CC0) with mute toggle
- [ ] Replay solved tasks for practice (PRD Q1)
- [ ] Accessibility pass (contrast, focus, text alternatives)
- [ ] Playtest with 3 beginners, fix top issues

## Later
- [ ] Login with Google / GitHub + cloud save
- [x] Public GitHub repository and free static hosting on Vercel
- [ ] Gold, spells, inventory, XP/levels
- [ ] AI tutor hint
- [ ] More languages (C#, C++, Go, Rust)
- [ ] Touch controls / mobile
