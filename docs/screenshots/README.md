# Current game screenshots

Captured from the running CodeQuest app in Chromium at 1440 × 900. These show the
real game and working code, rather than concept art or interface mockups.

- `tech-city.png`: Variable District, a developer, city objects and coding terminals.
- `drone-lesson.png`: a real prediction example printing 5 and updating the battery.
- `code-repair.png`: a learner's repair printing 12 in the actual editor.
- `developer-tablet.png`: the tablet's practice editor and tabs.

Regenerate with the local game running at `http://127.0.0.1:5173`:

```sh
node scripts/capture-screenshots.mjs
```

The capture uses an isolated browser profile and a valid local save to frame the
city. It completes the first badge and lesson through the visible interface.
No production account, user save or game artwork is modified.
