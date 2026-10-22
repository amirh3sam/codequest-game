# Current game screenshots

Captured from the running CodeQuest app in Chromium at 1440 × 900. These show the
real game and working code, rather than concept art or interface mockups.

- `tech-city.png`: Variable District, a developer, city objects and coding terminals.
- `drone-lesson.png`: a real prediction example printing 5 and updating the battery.
- `code-repair.png`: a learner's repair printing 12 in the actual editor.
- `developer-tablet.png`: practice code, Run and real output together on the tablet.
- `tablet-cinematic.png`: the wearer's first-person view of their hands and attached wrist tablet.
- `tablet-opening.webm`: browser video of the city zoom, first-person look down and full-screen transition.

Regenerate with the local game running at `http://127.0.0.1:5173`:

```sh
node scripts/capture-screenshots.mjs
node scripts/capture-tablet-video.mjs
```

The capture uses an isolated browser profile and a valid local save to frame the
city. It completes the first badge and lesson through the visible interface.
No production account, user save or game artwork is modified.
