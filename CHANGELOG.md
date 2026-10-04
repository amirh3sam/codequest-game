# Changelog

All notable changes to this project are documented here. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]
### Added
- Java runner: compiles and runs player Java in the browser (teavm-javac in a Web Worker), with compile errors (line numbers), runtime errors, output cap and endless-loop timeout. E2E tests cover what works and the known limits.
- Python runner: Pyodide (Python 3.14) in a Web Worker with `input()` support, syntax errors as compile errors (with line), friendly runtime errors (`IndexError: … (line 3)`), fresh variables, stdin and interpreter state each run, output cap, endless-loop timeout; a crashed runner is replaced automatically. Runtime files copied from npm by `scripts/copy-runtimes.mjs` (recopies when the Pyodide version changes).
- `WorkerHost`: one warm worker per language, queued runs, separate compile cap (20 s) and run timeout (5 s), warmup cap (60 s), `runnerError` for runner failures (never costs a heart). Unit-tested with a fake worker.
### Changed
- E2E tests build with `--mode e2e`; the `window.__codequest` test hook is no longer in normal builds. Test server moved to port 4317.
- Project setup: git, `.gitignore`, reference images in `docs/reference/`.
- Planning docs: PRD, Architecture, Roadmap, Decisions, Progress, Credits.
- Claude Code team: 10 subagents and 8 workflow commands in `.claude/`.
- App skeleton: Vite 8 + TypeScript 7 + Phaser 4 placeholder scene, Vitest and Playwright smoke tests, Biome lint, GitHub Actions CI.
