# CodeQuest

**[Play CodeQuest](https://codequest-game-inky.vercel.app/)** · [Public source](https://github.com/amirh3sam/codequest-game)

A 2D adventure game that teaches programming in a modern tech city. Pick **Java, JavaScript, TypeScript or Python**, choose a hoodie developer, and help your courier repair the city. Explore 23 districts, each with eight coding tasks and a boss. Your code runs in the browser, with no account.

**Never programmed before? Choose “Start from zero · New to coding.”** Its untimed robot rescue starts with instruction cards, then teaches a name variable, battery predictions, a guided value replay and small real-code changes. Solve an independent rescue using the same instruction with two starting batteries, then try a fresh prediction. Three levels of clues and unlimited retries help you practise. All four languages work, including Java with its surrounding class/main method supplied. Your robot name, drafts and seven discoveries stay with the adventure and its downloaded backup. Existing players can enter through **Menu → Start from zero** or **Tablet → Guide**.

> Status: **23 playable districts in all four languages, plus the beginner chapter.** Move with WASD/arrows, click a destination, or use mobile touch controls. Press E to interact. Eight tasks unlock each boss; defeating it unlocks the next district. See [docs/ROADMAP.md](docs/ROADMAP.md).

Keep **multiple saved adventures**, including several in the same language. The title screen lists every save under its language; use **Menu → Switch adventure** to manage them. Progress, event choices, hub repairs and tablet drafts stay separate. Existing language saves appear automatically.

Progress saves in this browser profile and survives refreshes. Use **Menu → Save backup file** to download a portable JSON backup, and **Load backup file** to restore it as another adventure. Keep that file somewhere safe to move progress between browsers or devices.

![Saved adventures with separate heroes and languages](docs/screenshots/adventure-library.png)

![Logic Junction's skyrail plaza and solid routing-control hub](docs/screenshots/logic-junction.png)

![CodeQuest gameplay: hoodie developer, Kai the courier and coding terminals in the modern tech city](docs/screenshots/tech-city.png)

Choose from color-coded JavaScript, Python, TypeScript or Java, then start a personal adventure. A step-by-step field guide explains keyboard or mobile movement, meeting your courier and opening your first coding task; you can skip it at any time. Open **Progress** to see mission counts, the next skill and the story chapter. **Accessibility & controls** offers larger text, high contrast and remappable movement keys. The guided drone lesson lets you predict, run, investigate and change a battery value before writing your own repair. Practice previews are free; accepted repairs earn progress and change the city.

Use the **Lighting console** or **Menu → Lighting** to program the city's route lights. Choose the whole map or one task's circuit, then print online/offline and a color. Your real program changes the visible lights; each map/adventure remembers its own settings. Lighting practice never spends hearts or gems.

The **City Arcade** now offers Packet Dash, a 2D runner where you jump signal glitches and collect data bits, and Signal Stack, a timing game where you build a tower of relays. Both are optional, cost no coding hearts or gems, and save separate personal bests with each adventure. Touchscreens have dedicated game controls.

<table align="center" width="100%">
  <tr>
    <td width="33%"><img src="docs/screenshots/arcade-map.png" alt="The hoodie developer beside the glowing City Arcade cabinet in CodeQuest's modern city." width="100%"></td>
    <td width="33%"><img src="docs/screenshots/packet-dash.png" alt="Packet Dash runner gameplay with a side-facing developer, city skyline, score and jump controls." width="100%"></td>
    <td width="33%"><img src="docs/screenshots/task-console.png" alt="A task-specific city console opening with a coding mission prompt." width="100%"></td>
  </tr>
  <tr>
    <td align="center"><sub><b>Explore the arcade</b></sub></td>
    <td align="center"><sub><b>Play Packet Dash</b></sub></td>
    <td align="center"><sub><b>Open a coding mission</b></sub></td>
  </tr>
</table>

![Mina's optional community beacon with a chosen event, working code and live preview](docs/screenshots/community-beacon.png)

Sound effects include textured footsteps, tactile clicks, tablet swishes, soft error knocks and layered completion chimes. Set **Effects volume** in **Menu**, or use **Sound on/off** on the title screen or toolbar. Both settings stay on this device. Audio starts after an interaction and stops when the tab is hidden.

![The actual drone lesson with a working code example, prediction choices and battery meter](docs/screenshots/drone-lesson.png)

Press **T** or click **Tablet**: the city camera zooms toward your developer, then an illustrated **2D wrist tablet** lifts into view, settles and zooms into its screen. The opening takes three seconds. Press **T** or **Skip animation** to jump ahead. Reduced motion opens it instantly.

Coding tasks use a separate mission-console boot animation: the city node and task prompt load into a glowing terminal before the full-screen editor opens. Run code there and its output animates into the console below the editor. The wrist tablet remains its own practice space.

![The illustrated 2D wrist tablet during its opening animation](docs/screenshots/tablet-cinematic.png)

[Watch the actual tablet opening](docs/screenshots/tablet-opening.webm).

The full-screen tablet has seven tabs: Code, Examples, Missions, Guide, Daily Quest, Study Path and Projects. Explorer and file tabs show colored file-format icons. The editor, Run button and output stay together; drag the handle above Output to resize it, or focus the handle and use arrows/Home/End. Your panel height is remembered. Open local folder, Export project and Import project manage the coding files and their separate backups. Each adventure keeps its own practice work; free practice never spends hearts or awards gems. Press **Esc** to return to the city. The top bar keeps Tablet, World map and Menu handy; Menu holds the other tools, adventure backups, sound and settings.

![The in-game tablet showing practice code and its real output together](docs/screenshots/developer-tablet.png)

![Writing and running the drone repair with real output and a full battery](docs/screenshots/code-repair.png)

These are screenshots captured from the running game. [Capture notes](docs/screenshots/README.md).

Every player opening the shared link in their own browser profile has an independent character, mission progress and tablet drafts. Saves stay in that browser; they are not shared with other players or synchronized across devices.

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
| E2E tests | `npx playwright install chromium webkit` (once), then `npm run test:e2e` |
| Lint / format | `npm run lint` / `npm run lint:fix` |
| Type-check | `npm run typecheck` |
| Ruflo project tooling | `npm run ruflo -- <command>` ([setup](docs/RUFLO.md)) |
| Production build | `npm run build` then `npm run preview` |

## Docs
[PRD](docs/PRD.md) · [Architecture](docs/ARCHITECTURE.md) · [Roadmap](docs/ROADMAP.md) · [Decisions](docs/DECISIONS.md) · [Progress](docs/PROGRESS.md) · [Credits](docs/CREDITS.md)
