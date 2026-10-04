# CodeQuest

## Overview
2D top-down pixel-art RPG (web, desktop browser) that teaches programming. Pick a language (Java, JavaScript, TypeScript, Python), pick a boy/girl hero, name them, then walk through 7 areas (Variables → Conditions → Loops → Arrays → Functions → Objects → Abstraction). Each area: lesson scroll(s), 8 coding tasks easy→hard (earn gems; wrong answer = −1 heart), and a boss where gems buy hints. Out of hearts → current area resets only. Player code runs **in the browser** in Web Workers. No server, no login, $0. Localhost only for now.
Full spec: `docs/PRD.md`. Design: `docs/ARCHITECTURE.md`.

## Tech stack
TypeScript 7 · Vite 8 · Phaser 4 + Tiled maps · plain DOM UI panels · CodeMirror 6 · runners: JS worker, TS via `typescript-js` (typescript@6.0.3), Pyodide, teavm-javac (Java) · Vitest 5 · Playwright · Biome 2 · GitHub Actions · Kenney CC0 art · localStorage saves.

## Commands
- Install: `npm install` (first time also `npx playwright install chromium`)
- Dev: `npm run dev` → http://localhost:5173 (pre-hook copies Pyodide into public/runtimes/python)
- Test: `npm test` (Vitest unit) · `npm run test:e2e` (Playwright; builds + previews on :4317)
- Lint: `npm run lint` (Biome) · auto-fix `npm run lint:fix` · types `npm run typecheck`
- Build: `npm run build` → `dist/` · preview `npm run preview` · `npm run build:e2e` (adds `window.__codequest` test hooks; used by Playwright)

## Folder map
- `src/game/` Phaser scenes + entities · `src/ui/` DOM screens/panels · `src/core/` state, rules, save (pure, unit-tested)
- `src/content/` schema + `data/<lang>/<NN-area>.json` · `src/runners/` language workers · `src/grader/`
- `public/assets/` art · `public/maps/` Tiled `.tmj` · `public/runtimes/` Pyodide/Java WASM
- `tests/unit/` Vitest · `tests/e2e/` Playwright · `docs/` specs, logs · `docs/reference/` concept art
- `.claude/agents/` subagents · `.claude/skills/` workflow commands

## Code conventions
- TypeScript strict. No `any` without a comment explaining why.
- Game rules live in `src/core/` as pure functions; Phaser and UI only call them.
- Player code never runs on the main thread: always via `runners/worker-host.ts` with the timeout.
- Content is data (JSON), never hard-coded in engine code. Every task needs a reference `solution` that tests verify.
- Files: kebab-case; types/classes: PascalCase; functions/vars: camelCase.
- Small focused modules; comment the *why*, not the *what*.
- Asset/library licenses recorded in `docs/CREDITS.md`.

## Workflow
- Start every session with /start-day. End it with /end-day.
- Work on ONE roadmap task per session. After finishing it: update the roadmap, commit, summarize what was done, then STOP. Never start the next task without the user asking.
- One task at a time: plan → build → test → review → document → commit → push.
- `main` always works. New work goes on `feat/…` or `fix/…` branches and reaches main through /ship.
- Hand research, test runs and reviews to subagents so the main chat stays clean.
- Conventional commits: feat, fix, docs, test, refactor, chore.
- New decision → `docs/DECISIONS.md`. Scope change → update PRD and ROADMAP first.

## Golden rules
- Never commit or print secrets. Keys live in `.env` (git-ignored); keep `.env.example` updated with placeholders.
- Ask the user before: adding dependencies not in ARCHITECTURE.md, deleting files, changing the save schema/data model, force-pushing, or anything that costs money.
- Never say "done" or "it works" unless you ran it and saw it pass.
- Unsure what the user wants? Ask. Something you can decide yourself? Pick a sensible default and log it in DECISIONS.md.
- If a task gets bigger than planned, stop and re-plan with the user.
- Prefer simple, proven, well-supported tech. Keep this file short and current.
- Talk to the user in plain, simple English; keep updates short.

## Definition of Done
Tests pass · lint is clean · reviewer's must-fixes fixed · docs + CHANGELOG updated · committed and pushed.

## Agents & commands
- Agents (`.claude/agents/`): researcher (web research), planner (plans), developer (builds), tester (tests, root causes), reviewer (read-only review), doc-writer (docs sync), devops (git/GitHub/CI), game-dev (Phaser/Tiled), content-author (lessons + tasks JSON), code-runner (in-browser runners + grader).
- Commands (`.claude/skills/`): /start-day, /feature <what>, /bugfix <what>, /qa, /ship, /backup [msg], /end-day, /new-content <language> <area>.

## Docs index
- `docs/PRD.md`: requirements (FR-1…FR-16)
- `docs/ARCHITECTURE.md`: stack, diagram, data model, testing, deployment
- `docs/ROADMAP.md`: milestones + tasks
- `docs/DECISIONS.md`: decision log
- `docs/PROGRESS.md`: daily log
- `docs/CREDITS.md`: licenses for libraries and assets
- `docs/reference/`: concept art (game flow, map style)
