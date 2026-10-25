# Final release verification — 2026-10-25

Target: https://codequest-game-inky.vercel.app/

| Check | Result |
| --- | --- |
| Biome lint/format | Passed |
| TypeScript | Passed |
| Unit tests | 312 passed across 36 files |
| Complete browser suite | 232 distinct checks verified; all have passing results after fixes and targeted reruns |
| Follow-up regressions | Final 13-check desktop/phone run passed, with no skips or automatic retries |
| Production build | Passed; production entry `index-B4hC9JMH.js`, with development hooks absent |
| Published-game desktop/phone checks | Pending after the browser run |

The complete Playwright run covers Chromium, Chromium touch scenarios and the
iPhone WebKit project. It exercises the ordered newcomer adventure, real code
execution in Java/JavaScript/TypeScript/Python, multi-file projects, arcade
creation and games, sound, character management, downloads/imports, independent
players, movement/collisions, all 23 districts, task/boss progression, portals,
lighting, robot deliveries, city restoration, reviews, rewards and tablet controls.

The complete 40.4-minute browser run initially passed 221 checks and failed 11.
The affected flows were investigated, fixed and retested. A 14-check repair run
passed 13, exposing one remaining capitalization assumption; the final 13-check
regression run then passed completely. Combining the latest result for each
original project/file/scenario leaves 232 passing scenarios, zero unresolved
failures and zero skipped checks. This is a full run followed by targeted reruns,
not a claim that the original full run passed on its first attempt.

Game fixes:

- Returning legacy saves no longer start an unsolicited controls tour or handbook
  on a later reload; intentionally opened help still resumes.
- Opening the title controls tour from Help restores the actual launch screen so
  language/character controls can be highlighted.
- A compact, accessible help control keeps the phone tablet's Close action and code
  output within the available screen height.
- Workshop and tram status signs no longer overlap campus or Logic Junction
  buildings; the rendered clearance check passed across all 23 maps.
- The robot lab has a full styled editor, spaced controls and visible compiler/
  runtime diagnostics. Invalid code cannot deploy a route. Real loop/list and
  invalid-program checks passed in all four languages.

The initial diagnostic run also identified test setup and navigation drift. Rotation
tests now use manual orientation emulation rather than entering the headless
browser's native fullscreen window. A dedicated mobile-layout test still checks
the supported/rejected orientation API path. Loading assertions allow the real
asset preload to finish; complete multi-step journeys have appropriate budgets.
Legacy Tasks navigation, pre-transit spawn assumptions and expanded-phone-menu assertions now follow the
current Progress entry and seven-choice menu. The player-isolation test explicitly
chooses free exploration in each independent profile. Game behavior and saves are
unchanged by these test-only corrections.

Failures retain screenshots, and the Java phone rescue reports its real compiler
output if an assertion fails. CI allows the complete suite to finish, limits its
browser workers and cancels superseded branch runs. Raw reports, browser profiles,
traces and screenshots from verification remain in ignored test output.

The final regression run includes the complete unseeded eight-step newcomer
adventure, legacy reloads in all four languages, district tasks and a boss,
restored services, explicit tour resume, and Chromium/iPhone WebKit rotation.
Production build and public release verification are recorded below when complete.
