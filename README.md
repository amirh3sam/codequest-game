# CodeQuest

A 2D pixel-art RPG that teaches programming. Pick **Java, JavaScript, TypeScript or Python**, choose your hero, and walk through 7 areas, from Variable Village to the Abstraction Realm. Read lesson scrolls, solve coding tasks to earn gems, and spend them on hints to beat each area's boss. Your code runs right in the browser: free, offline, no account.

> Status: early development (M0 setup). See [docs/ROADMAP.md](docs/ROADMAP.md).

![Game flow](docs/reference/game-flow.png)

## Run it locally
Requires Node.js 24+.

```bash
npm install
npm run dev          # open http://localhost:5173
```

## Develop
| Task | Command |
|---|---|
| Unit tests | `npm test` |
| E2E tests | `npx playwright install chromium` (once), then `npm run test:e2e` |
| Lint / format | `npm run lint` / `npm run lint:fix` |
| Type-check | `npm run typecheck` |
| Production build | `npm run build` then `npm run preview` |

## Docs
[PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Roadmap](docs/ROADMAP.md) · [Decisions](docs/DECISIONS.md) · [Progress](docs/PROGRESS.md) · [Credits](docs/CREDITS.md)
