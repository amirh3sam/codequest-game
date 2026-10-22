# CodeQuest — Roadmap

Each task fits in one session. Tags point to PRD requirements.

## Current priority: learning through adventure (2026-10-22)

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
- [ ] Add optional discoveries and story choices beyond the courier mission.
- [x] Validate the pilot in all four languages; preserve old saves and one-time rewards.
- [ ] Playtest comprehension and enjoyment with beginners.
- [x] Add a T-key developer tablet with an animated opening, editor/example/console tabs, real free practice and saved per-language drafts.

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
