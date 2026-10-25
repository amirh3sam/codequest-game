# Current game screenshots

Captured from the running CodeQuest app in Chromium at 1440 × 900. These show the
real game and working code, rather than concept art or interface mockups.

The current GitHub/profile showcase uses six fresh 1440 × 1000 captures:

- `guided-adventure.png`: mentor welcome, one next step and ordered learning progress.
- `current-city.png`: the actual starting city, developer, courier and solid terminals.
- `robot-rescue.png`: a named robot with a successful real-code variable lesson.
- `coding-workspace.png`: GameRules/Main files, real output and the prominent right-aligned Close control.
- `created-game.png`: the saved Byte Run design produced by the code in the workspace.
- `tablet-cinematic.png`: the live illustrated 2D wrist-tablet opening.

Run `node scripts/capture-showcase.mjs` with a preview on `http://localhost:4317`,
or set `CODEQUEST_SCREENSHOT_URL`. It uses isolated desktop/phone browser saves,
checks styled action sizes and spacing across menus, and records phone layout
checks under ignored test output. The captures use the real interface and workers;
they do not change any user's saves. The profile presents them in three rows of two.

Older feature captures below remain available:

- `tech-city.png`: Variable District, a developer, city objects and coding terminals.
- `drone-lesson.png`: a real prediction example printing 5 and updating the battery.
- `code-repair.png`: a learner's repair printing 12 in the actual editor.
- `developer-tablet.png`: practice code, Run and real output together on the tablet.
- `tablet-cinematic.png`: the illustrated 2D forearm, hand and attached wrist tablet, with a live display inside its bezel.
- `tablet-opening.webm`: browser video of the city zoom, 2D wrist lift/settle and full-screen transition.
- `community-beacon.png`: Mina's optional event choice with real code and a successful announcement preview.
- `community-courtyard.png`: the solid beacon and mint courtyard lights after activating Garden night, with the sound toggle in the toolbar.
- `adventure-library.png`: the title screen grouping three named adventures beneath their languages, each with task progress.
- `logic-junction.png`: the distinct skyrail plaza with its transparent routing hub, solid props and relocated terminals.
- `arcade-map.png`: the real developer, glowing Packet Dash cabinet and interaction prompt in the Variable District.
- `packet-dash.png`: the responsive runner panel with its animated side-running character, skyline, score and Jump control.
- `task-console.png`: the task-specific console boot screen showing the live mission title and prompt.

Regenerate with the local game running at `http://127.0.0.1:5173`:

```sh
node scripts/capture-screenshots.mjs
node scripts/capture-tablet-video.mjs
node scripts/capture-beacon.mjs
node scripts/capture-adventures.mjs
```

The capture uses an isolated browser profile and a valid local save to frame the
city. It completes the first badge and lesson through the visible interface.
No production account, user save or game artwork is modified.

The beacon capture earns the two prerequisite missions through real submissions,
then stages the camera beside the beacon in its isolated save. It also checks
the discovery panel at a 390-pixel viewport width.

The adventure capture creates three journeys through the interface, then stages
a valid first-district completion in that isolated profile to frame Logic Junction.
It also checks the library at 390 pixels wide. Map artwork and exact built-in
image-generation prompts are in `public/assets/logic-junction/ARTWORK.md`.
