# CodeQuest — Roadmap

Each task fits in one session. Tags point to PRD requirements.

## M0 — Setup
- [x] Scaffold Vite + TypeScript + Phaser, Biome, Vitest, Playwright, CI, smoke test (Phase 3 of setup)
- [ ] **Spike: Java runner**: compile + run `System.out.println` with teavm-javac in a worker; measure load/compile time. Decide wasm vs Piston fallback (FR-8)
- [ ] Spike: Python runner with self-hosted Pyodide in a worker (FR-8)
- [ ] Spike: TypeScript runner with `typescript-js` 6.0.3 in a worker (FR-8)
- [ ] Pick Kenney CC0 packs (tiles, boy/girl hero, scroll, gem, boss), add `docs/CREDITS.md`

## M1 — MVP (areas 1–2, all 4 languages)
Core
- [ ] `core/state.ts` + `rules.ts`: hearts, gems, solve, reset area, unlock next (FR-9, FR-10, FR-11, FR-13) + unit tests
- [ ] `core/save.ts`: per-language slots, versioning, corrupt-save handling (FR-14)
- [ ] Content schema + loader + validation test (FR-16)

Runners and grading
- [ ] Worker host with 5 s timeout + JS runner (FR-8)
- [ ] TS runner (FR-8)
- [ ] Python runner (FR-8)
- [ ] Java runner (FR-8)
- [ ] Grader: output compare + code rules + heart logic (FR-9)

Screens
- [ ] Title screen: New / Continue (FR-1, FR-14)
- [ ] Language select (FR-1)
- [ ] Hero select (FR-2)
- [ ] Name screen with dice (FR-3)
- [ ] World map with 7 nodes, locks (FR-4)

World
- [ ] Tiled map: Variable Village (area-01) (FR-5)
- [ ] Hero movement, animation, collisions, camera (FR-5)
- [ ] Interactables + "Press E" prompt + input pause while typing (FR-5)
- [ ] HUD: name, hearts, gems, area, progress (FR-15)
- [ ] Lesson scroll panel (FR-6)
- [ ] Task panel with CodeMirror, Run, Submit, results (FR-7, FR-8, FR-9)
- [ ] Task gates/paths open in order (FR-7)
- [ ] Out of hearts → area reset (FR-10)
- [ ] Boss panel: health bar, hints shop (FR-12)
- [ ] Victory screen → unlock next area (FR-13)
- [ ] Pause menu (FR-15)
- [ ] Tiled map: Condition Bridge (area-02) (FR-5)

Content (lesson + 8 tasks + boss each)
- [ ] Java: Variables (FR-16)
- [ ] Java: Conditions (FR-16)
- [ ] JavaScript: Variables (FR-16)
- [ ] JavaScript: Conditions (FR-16)
- [ ] TypeScript: Variables (FR-16)
- [ ] TypeScript: Conditions (FR-16)
- [ ] Python: Variables (FR-16)
- [ ] Python: Conditions (FR-16)
- [ ] E2E: every reference solution passes in its real runner (FR-16)
- [ ] E2E: full play-through of area 1 (FR-1…FR-15)

## M2 — Full game ("Launch" locally)
- [ ] Areas 3–7 maps: Loop Forest, Array Mountain, Function Valley, Object Castle, Abstraction Realm (FR-5)
- [ ] Content for areas 3–7 × 4 languages (one session per language × area) (FR-16)
- [ ] Sound effects + music (free/CC0) with mute toggle
- [ ] Replay solved tasks for practice (PRD Q1)
- [ ] Accessibility pass (contrast, focus, text alternatives)
- [ ] Playtest with 3 beginners, fix top issues

## Later
- [ ] Login with Google / GitHub + cloud save
- [ ] Free static hosting
- [ ] Gold, spells, inventory, XP/levels
- [ ] AI tutor hint
- [ ] More languages (C#, C++, Go, Rust)
- [ ] Touch controls / mobile
