# CodeQuest — Product Requirements (PRD)

_Last updated: 2026-10-23 · Status: adventure backups, mobile controls and staged hub finale_

Current direction: the public release includes Variable District and Logic
Junction in all four languages. The user's latest priority is deeper education
and enjoyable gameplay, with code visibly repairing the city. The stranded-drone
pilot in [GAME-DESIGN.md](GAME-DESIGN.md) now connects guided practice to a world
repair. The developer tablet now opens through a short illustrated 2D animation:
city camera zoom, a wrist tablet lifting into view and settling,
then a move into the full-screen workspace. Code, Run and output share one page,
with results below the editor. Its tabs hold practice code, examples,
console output, mission status and the district guide. Missions use the existing
grader and heart policy; practice remains free. Reduced motion skips the shot.
Beginner playtesting precedes further district expansion. Older fantasy names and localhost
scope below describe the original requirements and will be revised as that
redesign is implemented. Existing heart, reward and save rules remain the pilot's
baseline.

Personal saves belong to the browser profile used to play. The adventure library
supports multiple named journeys in any language, including several in one
language. Switching through Menu → Switch adventure preserves each hero's
missions, discoveries and tablet draft. New adventures never replace old ones.
Older per-language saves remain available through automatic library import.
The shared Vercel URL serves the game assets; it does not serve a shared player
character or save. Separate players' browser profiles keep independent heroes,
missions and tablet drafts. Progress is not synchronized across devices.

Current game screenshots: [tech city](screenshots/tech-city.png), [guided drone lesson](screenshots/drone-lesson.png), [repair editor](screenshots/code-repair.png) and [developer tablet](screenshots/developer-tablet.png). Superseded planning pictures have been removed.

## 1. Problem
Beginners find programming tutorials dry and quit early. Reading theory without practice doesn't stick, and practice sites feel like homework. CodeQuest teaches programming through a 2D top-down RPG. You walk a world, read short lessons found in the map, and solve real coding tasks to move forward.

## 2. Target users
- **Primary:** beginners aged 13+ learning their first programming language, studying on their own on a desktop computer.
- **Secondary:** students who know one language and want to learn another (for example Python → Java).
- Language of the interface and lessons: **English**.

## 3. Goals
- G1. Teach the core concepts (variables → abstraction) in Java, JavaScript, TypeScript and Python through play.
- G2. Make every concept *understood*, not only passed: lesson scroll first, then 8 tasks from easy to hard, then a boss.
- G3. Real code, really run: the player's code is compiled and executed **inside the browser**, free, with no server.
- G4. Fun loop: explore, collect, earn gems, risk hearts, beat bosses, unlock the next area.
- G5. $0 cost: free tools, free code runners, free art (CC0 / free-license assets only).

## 4. Non-goals (for now)
- Accounts, login, cloud save (later: Google / GitHub login).
- Public hosting (MVP runs on localhost only).
- Multiplayer and leaderboards.
- Gold, shop, spells, inventory, XP/levels, AI tutor (shown in the reference picture, planned for "Later").
- Paid anything.

## 5. Game loop (summary)
1. **Pick a language**: Java, JavaScript, TypeScript or Python. Each adventure has its own save; multiple adventures can use the same language.
2. **Pick a hero**: boy or girl.
3. **Name the hero** (or press the dice button to get a random name).
4. **World map:** 7 areas from easy to hard, each locked until the previous boss is defeated:
   1. Variable Village: variables, data types, operators
   2. Condition Bridge: if/else, comparisons, boolean logic
   3. Loop Forest: for/while loops
   4. Array Mountain: arrays/lists, strings
   5. Function Valley: methods/functions, parameters, return
   6. Object Castle: classes, objects, encapsulation, inheritance
   7. Abstraction Realm: abstract classes, interfaces, polymorphism
5. **Inside an area** the hero walks (up/down/left/right) to:
   - **Lesson scrolls**, which explain the area's concept with examples (read them before the tasks).
   - **8 task spots** (stones, gates, chests, NPCs), from easy to hard. Solving one gives **gems** and opens the path to the next.
   - **The boss**, a bigger multi-step coding challenge. Gems can be spent **only here**, on hints and help.
6. **Hearts:** a wrong submission costs 1 heart. When all hearts are gone, the **current area restarts** (its tasks and gems reset). Finished areas stay finished and the game is **never** reset to the very beginning.
7. **Victory:** beating the boss unlocks the next area.

## 6. User stories
- US-1 As a learner, I pick the language I want to learn, so the whole world teaches that language.
- US-2 As a learner, I create a hero (boy/girl + name) so the game feels like mine.
- US-3 As a learner, I walk around the map with the keyboard to find lessons, tasks and the boss.
- US-4 As a learner, I read a lesson scroll with examples before trying tasks.
- US-5 As a learner, I write code in an editor, run it to see output, and submit it to be checked.
- US-6 As a learner, I earn gems for solved tasks and spend them on hints in the boss fight.
- US-7 As a learner, I lose hearts for wrong answers, so I think before submitting.
- US-8 As a learner, I keep my progress when I close the browser.
- US-9 As a learner, losing all hearts only restarts the area I'm in, not the whole game.
- US-10 As a learner, I can switch between multiple saved adventures in the same or different languages, keeping separate progress and practice drafts.
- US-11 As a learner, I can download a backup file and load it later as a separate adventure.
- US-12 As a mobile learner, I can walk and interact using touch controls.

## 7. MVP scope
**In:** all 4 languages selectable; hero + name; title / continue screen; world map with 7 area nodes (areas 3–7 shown locked "coming soon"); **areas 1 and 2 fully playable in all 4 languages** (scroll + 8 tasks + boss each = 64 tasks + 8 bosses); in-browser runners for all 4 languages; hearts, gems, boss hints; browser save; keyboard controls; free pixel-art assets.

**Out (later milestones):** areas 3–7 content (M2), sound/music polish (M2), login + cloud save, gold/spells/inventory/XP, AI tutor, hosting, mobile.

## 8. Functional requirements

**FR-1 Language selection**
- Given I'm on the start screen, When I choose "New game", Then I see Java, JavaScript, TypeScript and Python cards with a one-line description.
- Given I pick a language that already has saves, When I select it, Then I can continue the latest adventure, open the full library, or start another without replacing earlier adventures.

**FR-2 Hero selection**
- Given I picked a language, When the hero screen opens, Then I can choose a boy or girl hero with a preview sprite.

**FR-3 Hero name**
- Given I chose a hero, When I type a name (1–16 letters, digits, spaces), Then "Continue Adventure" is enabled. Empty or invalid names keep it disabled.
- Given I press the dice button, When it's clicked, Then a random fantasy name fills the field.

**FR-4 World map**
- Given I'm on the world map, When it loads, Then I see 7 areas in order; unlocked areas are clickable, locked areas show a lock and which boss opens them.
- Given area N's boss is defeated, When I return to the map, Then area N+1 is unlocked.

**FR-5 Movement and interaction**
- Given I'm inside an area, When I hold arrow keys or WASD, Then the hero walks in 4 directions with a walking animation and can't pass walls, water, trees or buildings.
- Given I stand next to a scroll, task spot or boss, When I press E or Space, Then its panel opens. A "Press E" prompt shows when something is in reach.
- Given a panel is open, When I press Esc or the close button, Then it closes and movement resumes. Movement keys don't move the hero while I'm typing.

**FR-6 Lesson scrolls**
- Given I interact with a scroll, When it opens, Then I see the area's lesson in pages (concept, code examples, a tip), with next/previous page buttons.
- Given I've read a scroll, When I reopen it later, Then it's still readable, and the HUD's "Lessons" list shows it as found.

**FR-7 Tasks**
- Given I interact with an unlocked task spot, When the task panel opens, Then I see the title, difficulty (easy/normal/hard), instructions, starter code in a code editor with syntax highlighting, and "Run" and "Submit" buttons.
- Tasks inside an area unlock in order: task K+1 is reachable/active only after task K is solved (the map path or gate opens).

**FR-8 Run code**
- Given I wrote code, When I press Run, Then it runs in the browser and I see its output (stdout) or the compile/runtime error. Run never costs a heart.
- Given my code runs longer than 5 seconds (e.g. infinite loop), When the limit is hit, Then it's stopped and I see "Your code took too long. Check your loop conditions."

**FR-9 Submit and grading**
- Given I press Submit, When my code compiles and passes all of the task's checks (expected output and required code rules), Then I see "Correct!", earn the task's gems (easy 1, normal 2, hard 3), and the next task unlocks.
- Given I press Submit, When the output is wrong or a code rule fails, Then I lose 1 heart and see which check failed (without revealing the answer).
- Given my code doesn't compile or throws an error, When I Submit, Then I see the error and **no heart is lost** (Run first is encouraged).

**FR-10 Hearts and area restart**
- Given I start or restart an area, When it begins, Then I have 3 hearts.
- Given I lose my last heart, When the "Out of hearts" screen shows, Then the current area resets (its tasks unsolved, its gems removed, hearts refilled) and I respawn at the area entrance. Lessons stay found and other areas are untouched.

**FR-11 Gems**
- Given I solve a task, When I'm rewarded, Then the gem counter in the HUD increases with a small animation.
- Given I'm outside a boss fight, When I look at gems, Then they can't be spent anywhere else.

**FR-12 Boss fight**
- Given all 8 tasks in the area are solved, When I reach the boss, Then the boss fight opens with a harder multi-part task and a boss health bar.
- Given I submit, When some test cases pass, Then the boss bar drops by the share of passing cases. All cases passing = boss defeated. Any failing case costs 1 heart.
- Given I have gems, When I press a help option, Then gems are spent: **Small hint (1 gem)**, **Show syntax (2 gems)**, **Reveal one line (3 gems)**. Each boss has at least 3 hints, which are revealed in order and stay visible.

**FR-13 Victory**
- Given I defeat a boss, When the victory screen shows, Then I see the rewards and "Continue Journey" returns me to the world map with the next area unlocked.

**FR-14 Save and load**
- Given I make progress, When a task, hint purchase, heart change or area change happens, Then the game auto-saves to the browser.
- Given I reload the page, When I choose Continue, Then I return to the same area with the same hearts, gems, solved tasks and hero.
- Each adventure has its own ID and saved state. Multiple adventures can use one language; starting another preserves all existing journeys. Broken or future-version data is preserved and reported without crashing or overwriting the library.

**FR-15 HUD and pause**
- Given I'm in an area, Then the HUD shows the hero name, hearts, gems, area name and task progress (e.g. 3/8).
- Given I press Esc with no panel open, When the pause menu opens, Then I can Resume, open World map, open Lessons, or go to the Title screen.

**FR-16 Content system**
- Each language × area is a data file (lesson pages, 8 tasks, 1 boss, each with starter code, checks, hints and a reference solution). Adding an area or language needs no engine code changes.
- Given the test suite runs, When content files are checked, Then every file matches the schema and **every reference solution passes its own checks** in the real runner.

## 9. Non-functional requirements
- **Performance:** 60 FPS walking on a mid-range laptop. First load under 5 s on localhost. A language runtime loads in the background on language select (Pyodide/Java compiler ≈ 10–30 MB, cached after first load). A typical task runs in under 2 s after the runtime is warm.
- **Security:** player code runs only in a Web Worker (no DOM, no access to the game state), with a hard timeout that kills the worker. No secrets exist in the app. No network calls besides loading the game's own files.
- **Privacy:** no accounts, no analytics, no tracking. Data stays in the browser's localStorage.
- **Accessibility:** full keyboard play; the code editor is screen-reader friendly (CodeMirror); text contrast WCAG AA in panels; readable font ≥ 16 px in lessons/tasks; heart and gem changes also shown as text, not only icons.
- **Compatibility:** latest Chrome, Edge, Firefox on desktop (WebAssembly GC required for Java).
- **Offline:** after the first load, the game works without internet (all runtimes are served from our own files, no CDN).
- **Licensing:** all art, fonts and libraries must be free with a license that allows our use, recorded in `docs/CREDITS.md`.

## 10. Success metrics (local playtests)
- A beginner finishes Variable Village in ≤ 45 min.
- ≥ 80 % of playtesters say the lesson scroll helped them solve the first tasks.
- 0 tasks where the reference solution fails (enforced by tests).
- 0 crashes or lost saves in a 1-hour play session.

## 11. Risks
| Risk | Impact | Mitigation |
|---|---|---|
| Java in-browser compiler (teavm-javac) is young; may miss APIs or be slow | Java unplayable | **Spike first in M0**. Fallback: local free Piston code runner in Docker (Docker is installed). |
| Big runtime downloads (Pyodide, Java) | Slow first load | Load only the chosen language, show a progress bar, cache in browser. |
| Writing 64+ good tasks is a lot of content | Delay / weak lessons | Shared curriculum outline per area; same task ideas adapted per language; reference solutions auto-tested. |
| Output-only grading can be gamed (e.g. just printing the answer) | Players skip learning | Add code rules per task (e.g. "must use a for loop", "must declare `age`"). |
| Free asset packs don't match style perfectly | Looks inconsistent | Pick one CC0 family (Kenney) for tiles + characters and stick to it. |

## 12. Open questions
- Q1. Should solved tasks be replayable for practice (without gem reward)? _Default: yes._
- Q2. Music and sound effects in MVP? _Default: M2._
- Q3. Exact boss names and story text per area: drafted during content writing, you review.
