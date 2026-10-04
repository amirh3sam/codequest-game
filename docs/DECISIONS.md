# Decision log

| Date | Decision | Why | Alternatives |
|---|---|---|---|
| 2026-10-04 | Web game, desktop browsers, localhost only for now | User choice; no hosting cost | Desktop app (Electron), mobile |
| 2026-10-04 | Launch languages: Java, JavaScript, TypeScript, Python | User choice | Java only first |
| 2026-10-04 | All code runs in the browser (Web Workers), no server | Free, offline, private | Hosted Judge0/Piston (costs money) |
| 2026-10-04 | Java via teavm-javac (WASM), pending M0 spike; fallback Piston in local Docker | Only free real-`javac`-in-browser option that is actively maintained (commit Sep 2026) | CheerpJ (free only for non-commercial/personal), Doppio (unmaintained) |
| 2026-10-04 | Student TypeScript compiled with `typescript` 6.0.3 (alias `typescript-js`); project itself uses TS 7.0.2 | TS 7 has no JS compiler API (expected in 7.1) | Sucrase/esbuild-wasm (strip types only, no type errors) |
| 2026-10-04 | Phaser 4 + Tiled for the game; plain DOM for panels | Proven free 2D engine; text UI is easier and more accessible in DOM | Kaboom/Kaplay, PixiJS, Godot web export |
| 2026-10-04 | Biome for lint + format | One tool, fast, simple config | ESLint + Prettier |
| 2026-10-04 | 3 hearts per area; losing all resets **current area only** | User wants no full restart; area reset keeps the stakes | Full game reset; checkpoint per task |
| 2026-10-04 | Gems earned only from tasks (easy 1, normal 2, hard 3), spent only on boss hints (1/2/3 gems) | User rule: gems are earned, not bought | Gold shop |
| 2026-10-04 | Compile/runtime errors on Submit don't cost a heart; wrong output does | Encourages trying; punishes wrong logic, not typos | Every failed submit costs a heart |
| 2026-10-04 | Same 7 areas for every language; content per language in JSON | Engine stays language-agnostic; easy to add languages | Hard-coded per language |
| 2026-10-04 | Kenney CC0 art | Free for any use, consistent style | itch.io packs with mixed licenses |
| 2026-10-04 | Reference images moved to `docs/reference/` | Keep root clean, back them up in git | Leave in root |
| 2026-10-04 | **Java spike passed: use teavm-javac in the browser** (Piston fallback not needed) | Runtime loads in ~0.5–0.7 s, compile 1.4–3.5 s, run < 50 ms. Variables, loops, strings, arrays, collections, records, switch, streams, OOP, interfaces, abstract classes all work; compile errors have line numbers | Piston in local Docker |
| 2026-10-04 | Java tasks can't read input (no `Scanner`/`System.in`) or use `%f`/`%n`/`DecimalFormat`. Content uses fixed values, `%d`/`%s`/`.formatted()`, and `Math.round(x * 100) / 100.0` for decimals. Varied test cases for functions come from grader-generated test calls (decide in the grader task) | teavm-javac class library limits; e2e tests guard these so we notice if they go away | Patch the classlib; switch to Piston |
| 2026-10-04 | Run timeout (5 s) counts only the player's program; compiling has its own 20 s safety cap | Java compile alone takes up to ~3.5 s, which shouldn't eat the player's run time | One combined timeout |
| 2026-10-04 | Vendor the Java runtime files (6.7 MB) in `public/runtimes/java/` with SHA-256 hashes | No npm package or GitHub release exists; keeps the game offline and CI independent of teavm.org | Download at install time |
| 2026-10-04 | E2E test server uses port 4317 and never reuses an existing server | Port 4173 clashed with another local project's preview server | Default 4173 |
| 2026-10-04 | **Python spike passed: Pyodide 314.0.7 (Python 3.14.2) in a worker** | Runtime load ~2.4–5.4 s (once per session), syntax check < 1 ms, run a few ms. input()/stdin, f-strings, classes, ABCs, dataclasses work; syntax errors → compile errors with line; runtime errors → "IndexError: … (line N)"; each run gets fresh variables | — |
| 2026-10-04 | Pyodide files copied from node_modules into `public/runtimes/python/` by `scripts/copy-runtimes.mjs` (npm predev/prebuild hooks), git-ignored | Pinned by package-lock, no 14 MB of binaries in git, still served by us (offline) | Commit the files; load from CDN |
| 2026-10-04 | Python syntax errors count as compile errors (no heart lost) | Same rule as Java/TS: typos aren't wrong logic | Treat as runtime errors |
