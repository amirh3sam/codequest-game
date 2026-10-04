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
