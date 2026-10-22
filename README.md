# CodeQuest

**[Play CodeQuest](https://codequest-game-inky.vercel.app/)** · [Public source](https://github.com/amirh3sam/codequest-game)

A 2D adventure game that teaches programming in a modern tech city. Pick **Java, JavaScript, TypeScript or Python**, choose a hoodie developer, and help Kai repair a delivery drone. Predict a battery value, experiment with real code, then submit a repair to open a city lane. Explore two districts, solve coding terminals and challenge the Firewall and Router. Your code runs in the browser, with no account.

> Status: **Two districts are playable in all four languages.** Walk with WASD/arrows and press E to interact. Complete eight missions and the Firewall in Variable District to unlock Logic Junction, with eight conditions missions and the Router. Travel between unlocked districts through Menu → World map. Progress saves automatically for each language. Areas 3–7 are coming next. See [docs/ROADMAP.md](docs/ROADMAP.md).

![CodeQuest gameplay: hoodie developer, Kai the courier and coding terminals in the modern tech city](docs/screenshots/tech-city.png)

Start with **Mission** to meet Kai. The guided drone lesson lets you predict, run, investigate and change a battery value before writing your own repair. Practice previews are free; accepted repairs earn progress and change the city.

![The actual drone lesson with a working code example, prediction choices and battery meter](docs/screenshots/drone-lesson.png)

Press **T** or click **Tablet** to raise your developer's tablet. Its coding workspace has Editor, Examples and Console tabs, a real Run button and a separate saved practice draft for each language. Free practice never spends hearts or awards gems. Press **Esc** to return to the city.

![The in-game developer tablet with its coding workspace and practice tabs](docs/screenshots/developer-tablet.png)

![Writing and running the drone repair with real output and a full battery](docs/screenshots/code-repair.png)

These are screenshots captured from the running game. [Capture notes](docs/screenshots/README.md).

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
| Ruflo project tooling | `npm run ruflo -- <command>` ([setup](docs/RUFLO.md)) |
| Production build | `npm run build` then `npm run preview` |

## Docs
[PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Roadmap](docs/ROADMAP.md) · [Decisions](docs/DECISIONS.md) · [Progress](docs/PROGRESS.md) · [Credits](docs/CREDITS.md)
