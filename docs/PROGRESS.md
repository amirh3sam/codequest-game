## 2026-10-23 (locked category level badges)
- Locked Study Path categories now show a lock icon in the badge instead of a level number. Once a category unlocks, it shows its level number; completed categories show a check mark. Kept the seven existing story districts and all 17 Study Path categories in the map.
- **Checks:** 251 unit tests passed; lint, typecheck and production build passed. Chromium passed the sequential category unlock and story-district map tests.
- **Release:** pending publication.
- **Next:** confirm whether “remove 3–8” means remove story-level cards or only their displayed numbers; earlier map instructions said to preserve the seven story districts and category levels 8–24.
- **Blockers:** clarification needed before changing map content.
# Progress log (newest on top)

## 2026-10-23 (all seven story districts and direct map access)
- Made Loop Transit, Array Towers, Function Labs, Object Campus and Abstraction Cloud playable in Java, JavaScript, TypeScript and Python. Every district has eight missions and its own boss. Its tasks use the matching language-specific Study Path examples; its Phaser scene has its own themed route, collision layout and landmarks.
- The world map category cards now use the same card class and layout as story levels 1–7 while preserving category lock and progress states. Completing the seven district bosses makes level 8 available, and category bosses continue unlocking the level portals in order.
- Added a persistent World Map button to the top-right game HUD for direct map access without opening the pause menu.
- **Checks:** unit tests verify all 5 × 4 generated district courses, their eight tasks and separate boss, and the full seven-district boss progression. Chromium confirmed the Logic Junction boss unlocks Loop Transit, completed a Loop Transit mission, used the HUD button to visit all five unique district scenes with eight terminals, and checked that category levels remain sequential and use the shared map card design. All 251 unit tests, lint, typecheck and production build passed.
- **Release:** source commit `5b340ce` is public on `main`. Production deployment `dpl_3PrHXP91nwVpft3DVgUUD2Urvef4` is READY at https://codequest-game-inky.vercel.app/; the production alias returned the new build.
- **Next:** continue expanding category-level game missions and activities.
- **Blockers:** none.

## 2026-10-23 (sequential Java levels and teleport doors)
- Levels 8–24 follow Abstraction Cloud in one continuous map. Level 8 unlocks after the Abstraction Cloud boss; each next category unlocks only after the previous category's eight tasks and boss. Each category has exactly eight tasks plus a separate boss. After each boss, portal doors provide direct travel to every unlocked category, including the newly unlocked next level.
- **Checks:** Chromium confirmed fresh-save locks, level 8 unlocking, level 9 remaining locked until the first category boss, the complete eight-task-plus-boss flow, and portal travel through all 17 category bosses. All 17 category starters passed in Java, JavaScript, TypeScript and Python. All 249 unit tests, lint, typecheck, and production build passed.
- **Release:** source commit `0183c46` is public on `main`. Production deployment `dpl_DUEFZD9uubJ6LtgvMsUytwWSVxrh` is READY at https://codequest-game-inky.vercel.app/; the production alias returned the updated game.
- **Current dependency:** resolved here; districts 3–7 are now playable, so new saves can reach Abstraction Cloud and unlock level 8.
- **Next:** continue expanding category-level game missions and activities.
- **Blockers:** none.

## 2026-10-23 (Study Path added to the world map)
- The world map now shows all 22 coding categories as clickable skill levels with per-adventure task progress. Selecting a category opens that exact level in the tablet Study Path. The seven city districts remain in a separate Story Districts section and retain their existing travel/unlock behavior.
- **Checks:** Chromium confirmed 22 skill levels, 7 story districts and navigation from the map to the selected level. All 248 unit tests, TypeScript and lint passed.
- **Release:** source commit `1f80c9c` is public on `main`. Production deployment `dpl_AhBgDrZdb3JZRnW1msrJzjmGqfJR` is READY at https://codequest-game-inky.vercel.app/; the production alias returned the updated build.
- **Next:** continue improving optional play activities.
- **Blockers:** none.

## 2026-10-23 (Packet Dash data combos)
- Added a visible 0/3 data combo to each runner round. Every three pickups awards 100 bonus points and restores one arcade shield, up to the normal three-shield cap. The mechanic stays separate from coding hearts and gems.
- **Checks:** two unit tests cover combo rewards and the shield cap; the City Arcade / Packet Dash browser flow passed. All 248 unit tests, lint, TypeScript and production build passed.
- **Release:** source commit `850b169` is public on `main`. Production deployment `dpl_AnDPxrXPn6AiAZ5wGmmx9TCQwqbB` is READY at https://codequest-game-inky.vercel.app/; the production alias returned the new build.
- **Next:** continue improving optional play activities.
- **Blockers:** none.

## 2026-10-23 (176-task Study Path)
- Expanded all 22 study topics to eight sequential checkpoints each: 176 per language, with separate saved progress and editable drafts for each adventure. Each checkpoint requires both a correct program output and a correct prediction; finishing a topic marks that level mastered. Existing one-checkpoint topic completions migrate as task 1.
- Added progress counts for tasks and mastered levels. The Code Scholar badge now requires all 176 tasks. Java's exception example uses a custom message field supported by the browser Java runtime.
- **Checks:** all 88 topic starters ran successfully across Java, JavaScript, TypeScript and Python. The eight-task completion flow passed in Chromium; old progress migration and task ordering passed unit tests. Tablet practice and Explorer resize regressions passed. All 246 unit tests, lint, TypeScript and production dependency audit passed (zero vulnerabilities); production build passed.
- **Release:** source commit `09bc5e3` is public on `main`. Production deployment `dpl_C1JLZJYZGFvpRheuPTQB2fAVMpP6` is READY at https://codequest-game-inky.vercel.app/; the production alias returned the new build.
- **Next:** add another arcade challenge to make free play more rewarding.
- **Blockers:** none.

## 2026-10-23 (22-topic study path and mouse steering)
- Added every category from the supplied Java study screenshot as a Study Path in the tablet. All 22 topics have a short explanation, an editable runnable example and a free checkpoint in Java, JavaScript, TypeScript and Python. Progress and drafts save per adventure; completing all topics unlocks the Code Scholar badge. The JDK/IntelliJ topic explains the browser setup and equivalent local tools for each language.
- Mouse users can click a destination to walk or hold the left button and drag to steer. The field guide and HUD explain the controls; collision rules still stop the character at solid objects.
- **Checks:** all 88 curriculum examples passed browser runs (22 × 4 languages); left/right mouse steering passed; five project-quest/resizer regressions passed. All 245 unit tests, lint, TypeScript, production build and the production dependency audit passed (zero vulnerabilities).
- **Release:** commit `bca32e9` is public on `main`. Production deployment `dpl_HF2JsECRXiZy9WR1r21G6NJKHjWT` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the new build.

## 2026-10-23 (resizable tablet Explorer)
- Added a draggable divider between the Explorer and editor. It resizes the Explorer width on desktop and its height on narrow screens, supports arrow-key adjustments, has min/max bounds, and remembers both sizes locally.
- **Checks:** the desktop/mobile drag browser test passed; lint, TypeScript, all 243 unit tests and production build passed.
- **Release:** commit `0ec0899` is public on `main`. Production deployment `dpl_C3Tze5b9LapZ5pyHLeXzPjD982UR` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the game.

## 2026-10-23 (project quests, debugging guide, badges and project sharing)
- Added a two-step Badge Builder quest that practices class composition across separate files in JavaScript, TypeScript, Python and Java. Its workspace and milestone progress are saved per adventure, separately from the player's regular project.
- Tablet and mission editors now translate diagnostics into beginner-friendly tips and offer a Go to line action. Tablet line hints map bundle offsets back to the player's source file.
- Added six Progress-page badges for mission completion, district restoration, the community beacon, the project quest and arcade high scores.
- Added `.codequest.json` project export/import with language/version checks, unsafe path filtering and an import size limit. Local adventure saves remain device-local.
- **Checks:** all 243 unit tests, lint, TypeScript, production build and production dependency audit passed (zero vulnerabilities). Five focused Chromium flows passed: project export/import and debugging guidance, plus quest completion in all four languages. The full 124-case browser sweep was stopped after unrelated pre-existing adventure/audio tests timed out waiting for an obsolete `Tasks` control; another old adventure selector now matches both the language chooser and saved-adventure row. The edited flows passed their focused tests.
- **Release:** commit `17ddb98` is public on `main`. Production deployment `dpl_4cMAbKYkRkZSepo7Ub7jkfDh4cMz` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the game.

## 2026-10-23 (multi-class runs in all four languages)
- Expanded browser projects so JavaScript, TypeScript and Python each use `Main → Badge → Player` across separate files. Java runs `Main → Badge → Formatter` across packaged classes.
- **Results:** Java printed `Hello from a package!`; JavaScript, TypeScript and Python each printed `Hello from a file! plus Badge`. All four focused Chromium flows passed together. This verifies the project-source bundler and Java compiler; no runtime source fix was needed.
- **Release:** test and progress-note update only; the live game bundle is unchanged.

## 2026-10-23 (run the active Java class)
- **Bug fix:** Java Run used the project starter as its entry source even when another Java file was active. It now compiles that active file under its filename and runs its `main` method when present; other project classes remain available. If the active file has no `main`, it falls back to a detected project entry.
- **Checks:** browser regression test created `src/Test1.java`, ran its `main`, and confirmed output is exactly lowercase `hello`. The packaged Java class flow also passed. All 242 unit tests, lint, TypeScript and production build passed; dependency audit reports zero vulnerabilities.
- **Release:** commit `20031a8` is public on `main`. Deployment `dpl_Bn1macu6cFRjXtMuhMmf1pRwBtzX` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the app.

## 2026-10-23 (Java editor typing shortcuts)
- Monaco now offers Java snippet completions for `main`/`psvm`, `sout`/`sysout`/`syso`, `serr`, `soutv`, `print`, `fori`, `foreach`/`iter`, `if`/`ifelse`, `while`, `dowhile`, `switch`, `trycatch`, `class`, `interface`, `enum`, and `ctor`. Tab stops make the generated code quick to customize; the editor shows a shortcut reference.
- **Checks:** browser typing test confirmed `sout` expands to `System.out.println` and `main` expands to the full entry method. All 242 unit tests, lint, TypeScript and production build passed; dependency audit reports zero vulnerabilities.
- **Release:** commit `9e81531` is public on `main`. Deployment `dpl_C81V5F1KiDLWEhv5YkhymhvygnZ2` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the app.

## 2026-10-23 (Java class scaffolds)
- Creating a `.java` file now pre-fills its package based on its folder under `src/`, a `java.util.*` import, and a public class whose name matches the file. Java source files are passed to the browser compiler by basename so packaged classes compile correctly.
- **Checks:** the Java tablet browser flow created a class under `src/models`, verified the generated package/import/class scaffold, imported it from `Main`, and ran it. All 242 unit tests, lint and TypeScript passed.
- **Release:** commit `6f3503d` is public on `main`. Deployment `dpl_22Lcf1QuhSF791KLbJ3jN2qhtuNb` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the app.

## 2026-10-23 (close editor tabs)
- Each open file tab now has an × button at its right edge. Closing the active tab switches to a neighboring tab; closed files stay in the Explorer and can be reopened. The workspace keeps one tab open at all times.
- **Checks:** Java browser flow passed through opening, closing and reopening tabs plus folder collapse/selection, rename and delete. Lint, TypeScript, all 241 unit tests and production build passed.
- **Release:** commit `ea5cba1` is public on `main`. Deployment `dpl_BUyPkgRHoh7aRQRfKZTCVTqhd4Zj` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the app.

## 2026-10-23 (clear folder selection and expand controls)
- Folder names now select the destination for new items without collapsing the folder. A separate chevron expands or collapses contents; the selected folder is highlighted, nested items show a guide line, and controls remain keyboard and touch accessible.
- **Checks:** Java tablet browser flow passed with collapse/expand, folder selection, rename and delete coverage. All 241 unit tests, lint, TypeScript and production build passed.
- **Release:** commit `d77b7b7` is public on `main`. Deployment `dpl_7nztBjbpYHUVBiNffVVLtoUFnkz2` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the app.

## 2026-10-23 (rename and delete project files)
- **Explorer actions:** each file and folder now has Rename and Delete controls. Folder operations include nested files; deleting asks for confirmation, the last file is protected, and the run entry and open editor tabs follow renames. The controls stay visible on touch screens.
- **Local folders:** rename copies files and subfolders to the new path before removing the old path. Deletes remove the selected item from both the browser project and connected local folder.
- **Checks:** 241 unit tests passed; the Java tablet browser flow passed through file rename, folder rename, file delete and folder delete. Lint, TypeScript, production build and dependency audit passed.
- **Release:** commit `49ad32e` is public on `main`. Deployment `dpl_EooTKfnJAUMYJ8aU23BSWadoMDcy` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the app.

## 2026-10-23 (browser IDE and cross-language project files)
- **Closer to VS Code:** the tablet now lazy-loads Monaco, the browser editor from VS Code. It adds language highlighting, line numbers, indentation, completion, multi-file editor tabs, the clickable folder tree and the run output panel beneath the editor. The Explorer selects a target folder; creating an item asks only for its name and adds the selected language's extension when needed.
- **Projects run together:** Java compiles the entry class with all sibling `.java` files. JavaScript/TypeScript local imports and Python `from module import Name` imports are resolved from workspace files. Each editor model is scoped to the player's adventure. Opening a local computer folder can import and save edits back to disk.
- **Checks:** 240 unit tests passed. All 18 tablet Chromium cases passed, plus the three JavaScript/TypeScript/Python file-import examples. Checks include Monaco initialization, Java classes, nested folder/file creation, editor tabs, reload persistence, free Daily Quest, all four language runners and mobile dimensions. Lint, TypeScript and production build passed; Monaco has zero reported package vulnerabilities.
- **Release:** commit `4ae2812` is public on `main`. Deployment `dpl_D4oRBaR5CX3bvgrRVWVUM53Nraf2` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the app.

## 2026-10-23 (project workspace, daily quest and modal guide fix)
- **VS Code-style tablet:** replaced the decorative Explorer with a per-adventure project tree. Players can create nested folders and files, switch files, edit them, run code into the panel below the editor and keep the whole project across reloads. Chromium browsers with the File System Access API can open a chosen computer folder and write changes back. Java practice compiles `Main.java` and all project `.java` files together; its starter calls a real `Player` class in a separate file.
- **More to practice:** added four rotating free Daily Quest puzzles covering arithmetic, conditions, loops and strings in all four languages. Drafts and daily completions are saved separately for each adventure. Solving them never changes hearts or gems.
- **Polish:** saved adventures and tablet tabs now use each language's first-screen accent color. The field guide hides while any modal page is open, including the tablet and mini-games, so it cannot cover their content.
- **Checks:** 239 unit tests passed. All 14 tablet Chromium cases passed serially, including every language runner, Java classes across files, nested file/folder creation, project reload, mobile layout and field-guide dismissal. The new Daily Quest solve/save Chromium flow passed. Lint, TypeScript and production build passed.
- **Next:** extend module-aware multi-file execution to JavaScript, TypeScript and Python.
- **Release:** commit `7b18925` is public on `main`. Deployment `dpl_EWCfSUNXbuBG3X64dibZVh6nu5qc` is READY at https://codequest-game-inky.vercel.app/; `vercel curl` confirmed the production alias serves the new JS and CSS assets.

## 2026-10-23 (accessibility settings and Signal Stack arcade)

- **Accessibility:** added persistent larger-text and high-contrast settings, adjustable effects volume and selectable WASD, arrow-only or IJKL keyboard movement. HUD instructions and the first-run guide reflect the chosen keys. Camera and decorative motion continue to respect the device's Reduce Motion preference; touch movement remains available.
- **More to play:** the city cabinet now opens an arcade lobby with Packet Dash and Signal Stack. Signal Stack is a keyboard- and touch-friendly timing game, with a separate personal best saved in each adventure. Neither arcade game changes coding hearts or gems.
- **Checks:** added a keyboard-remap and settings-persistence browser flow, extended the arcade walkthrough through both games and added validation for tower records. 235 unit tests, the focused Chromium flows, lint, TypeScript and production build passed.
- **Release:** source commit `8eeed1b` is public on `main`. Deployment `dpl_BdnxiPoXSswCpEYeYHbocYAWtTaD` is READY at https://codequest-game-inky.vercel.app/; the production alias serves the new app and styles.

## 2026-10-23 (first-run onboarding and skill progress)

- **Language selection:** JavaScript, Python, TypeScript and Java now have distinct accent colors across their first-screen cards, selected state and focus styling.
- **First-run guide:** each newly created adventure gets a dismissible three-step field guide. It explains movement on keyboard and mobile, meeting the selected adventure's courier, and safely running the first coding mission. The step is saved per adventure and resumes after reload.
- **Skill progress:** the Progress panel now summarizes solved missions and restored playable districts, shows an accessible per-district mission meter and next task, and previews the five future skill tracks.
- **Adventure story:** the Progress panel now tracks the network outage from the broken courier route to the first restored relay, reflects the garden or game-night choice, and explains why Logic Junction is next. Courier naming stays consistent with the selected hero throughout the mission and tablet.
- **Practice variety:** the tablet Examples tab now has a free typo-repair activity and a predict-before-run battery exercise. Both are ungraded, preserve mission rewards and do not cost hearts.
- **Checks:** Chromium flows cover all four distinct language colors, guide movement and mission stages, guide dismissal, progress totals/meters, story opening and both practice activities. All 233 unit tests, lint, TypeScript and production build passed.
- **Release:** source commit `3d03954` is public on `main`. Deployment `dpl_HCSqEUhXoe52kmXJt2hUATR5W5qM` is READY at https://codequest-game-inky.vercel.app/; the production alias serves the latest JS and CSS assets.

## 2026-10-23 (player-specific battery courier)

- **First district guide:** the delivery courier now appears as the opposite hero: selecting the boy shows Ava, and selecting the girl shows Kai. The map character, nameplate, battery mission portrait, introduction and task prompt use the same identity.
- **Coverage:** added a Chromium regression flow that opens the first mission for both hero choices and checks each guide's avatar and dialogue.
- **Checks:** 231 unit tests, the focused two-hero browser flow, lint, TypeScript and production build passed.
- **Release:** source commit `1be3a44` is public on `main`. Deployment `dpl_5WBaUWRx8GZK8TiudswAzH8mrHYg` is READY at https://codequest-game-inky.vercel.app/; the deployment-protected production alias returned the CodeQuest HTML through `vercel curl`.

## 2026-10-23 (Packet Dash, task consoles and audible footsteps)

- **Free arcade game:** added Packet Dash, an original 2D city runner reachable at a solid arcade cabinet. Players jump glitches, collect data bits and keep a personal high score with each adventure. Arcade shields and points are separate from coding hearts and gems. Keyboard and touch Jump controls are supported.
- **Footsteps:** raised the filtered shoe layers and added a browser check for a clearly audible step envelope while keeping the slower attack that removes the sharp transient.
- **Task console:** task openings now use their own mission-terminal boot sequence with the task prompt and city node; they no longer reuse the wrist-tablet animation. Running code animates its output into the console. The practice tablet keeps its illustrated wrist opening.
- **Runner character:** Packet Dash now animates the developer's six right-facing walk frames instead of showing a front-facing portrait.
- **Audio review:** `agent-sounds` is for Codex/Claude CLI session events and its README restricts the included game voice packs to personal, non-commercial use. Tone.js is a browser audio framework rather than a game sound pack, so the game keeps its original local Web Audio effects without another dependency.
- **Screenshots:** added live captures of the arcade map, Packet Dash gameplay and task console to the game README and screenshot notes.
- **Checks:** 231 unit tests, lint, TypeScript, production build and focused Chromium flows for footsteps, Packet Dash, the console opening/output and tablet missions passed.
- **Release:** source commit `151a44f` is public on `main`. Deployment `dpl_9W195iLJRFdqDV2t7NEe3Uhv7acV` is READY at https://codequest-game-inky.vercel.app/; the live alias returned HTTP 200.

## 2026-10-23 (touch controls, portable saves and staged hub repair)

- **Adventure list:** title screen now shows each saved hero under its language with a compact `0/8 tasks` progress line. The manager remains available for switching and starting another run.
- **Save recovery:** progress continues to autosave in the browser profile. Players can download a versioned JSON adventure backup and import it later as a new UUID-keyed save, preserving all existing adventures. Optional tablet drafts travel with the file.
- **Mobile:** added a four-direction touch pad, interact button and tap-to-walk. Both use the same scene collision data as keyboard movement. Touch movement is checked in Chromium on a phone-sized viewport.
- **Audio:** lowered and varied shoe/fabric/grit footsteps, reducing the hard synthetic impact while retaining local Web Audio generation.
- **Hub finale:** added two free worker-backed checkpoints (power arithmetic, then a name-built signal) before the existing graded Firewall boss. Checkpoints persist in the version-1 state, inlaid hub lights reflect them, tablet Missions offers the log, and completed players can watch the hub boot. Existing save records remain compatible.
- **Checks:** 227 unit tests passed; Biome lint, TypeScript and production build passed. All 106 Chromium cases passed with one worker; a fresh six-case run also passed against the final hub lesson checks and backup/mobile changes. The adventure title capture and narrow library had no browser errors or overflow.
- **Release:** public source commit `1d6534c`; production deployment `dpl_6CNeKVDxLVWxzoi2PHnazfgZeN6R` is READY at https://codequest-game-inky.vercel.app/.
- **Live verification:** the canonical game returned HTTP 200. The adventure/library walkthrough also passed against production with no browser errors and no overflow in the narrow manager.
- **Next:** run beginner sessions using the [playtest plan](BEGINNER-PLAYTEST.md); no participant observations have been collected yet.

## 2026-10-23 (multiple adventures, distinct districts and revised audio)

- **Done:** added an adventure library, available from the title and Menu → Switch adventure. Players can keep multiple named journeys in the same or different languages; new journeys preserve older ones. Each adventure has independent progress, discoveries, position and tablet draft. Old per-language games and practice drafts import without deletion. Corrupt/future data and failed writes preserve existing saves; canceled runtime warmups cannot report errors in a different adventure.
- **World:** Logic Junction now has original elevated-skyrail artwork, a separate transparent routing-control hub, its own entrance, walk bounds, terminal route and solid props. Changing districts rebuilds scenery, releases old tweens and repositions both objects and collisions. Older invalid coordinates fall back to the new entrance. Variable District keeps its campus and courier/beacon activities.
- **Audio:** replaced simple tones with filtered texture layers, alternating soft foot impacts, tactile clicks, device swishes, low error knocks and bell partials for completions. Menu now has an effects-volume slider; volume and mute persist independently. No downloaded audio or added dependencies.
- **Checks:** 225 unit tests passed. Focused Chromium suites passed for multiple same/different-language adventures, old-save import, separate browser players, all four beacon/practice languages, volume/mute and audio fallback, both 2D tablet openings, district travel, full Logic progression and collisions. A reachability search verified paths to all ten Logic interaction points using the actual scene collision rules. The previous beacon movement test now waits for actual positions instead of a fixed frame-rate assumption. Lint, types and production build passed.
- **Visual review:** inspected actual desktop library and new-map captures, including the generated hub's alpha and attached live sign. Narrow library and tablet layouts passed. Saved map art and exact prompts in [Logic Junction artwork](../public/assets/logic-junction/ARTWORK.md); updated real game screenshots and capture scripts.
- **Next (authorized):** staged Variable District finale with visible subsystem repairs, then beginner playtesting before further curriculum expansion.
- **Release:** source commit `424104d` is public and deployed as `dpl_82gnQKGSTuAV8Fnz3i5EKsaP8oQT` (READY) at https://codequest-game-inky.vercel.app/.
- **Public verification:** all five adventure/audio Chromium cases passed against the real public URL: Java plus two JavaScript adventures, separate progress/drafts, old-save import, audio playback, mute, saved volume and audio fallback. The map and both new art assets returned HTTP 200. Public captures of the library and skyrail map matched the inspected design; the narrow library passed without page errors.
- **CI:** GitHub run `39943697038` passed lint, types, 225 unit tests and all 104 Chromium cases without retries.

## 2026-10-22 (community beacon and sound effects)

- **Done:** added Mina's optional community beacon beside the courier lane. After the drone repair, choose Garden night or Arcade night, practice printing a string variable in a real worker, and explicitly activate the matching announcement. The solid sign and courtyard lights change mint/violet; Mina reacts and the tablet mission log records the Signal Maker badge. Tasks and Tablet → Missions link to the activity.
- **Progress:** previews, mistakes and reconfiguration are free. Activation requires a successful preview of the current code and choice; edits, choice changes or closing the panel invalidate it. A bounded optional `discoveries.beacon` field preserves version-1 saves, independent language slots, all mission counters and one-time rewards. The cosmetic survives a district retry; starting a new adventure clears it.
- **Audio:** added original Web Audio effects for footsteps, buttons, tablet opening, code results, beacon activation, delivery and boss victory. One context unlocks after interaction, voices have a limit, and effects stop when muted or the tab is hidden. Title/HUD sound controls remember the preference separately from progress. Unsupported audio remains playable.
- **Checks:** 219 unit tests and 33 focused Chromium checks passed, including all four beacon languages, safe previews, stale-result cancellation, save reloads, event changes, collisions, the full first-district journey, the courier mission and the approved 2D tablet. Audio checks verified gesture unlocking, walking effects, immediate mute, preference persistence and unsupported-audio fallback. Lint, types and production build passed; production test hooks are absent.
- **Visual review:** inspected the running lesson and restored courtyard at 1440 × 900; the capture script also checked the panel at 390 pixels wide. Added actual game screenshots and `scripts/capture-beacon.mjs`. No new dependencies or downloaded audio.
- **Next:** a staged district finale and beginner playtesting. Comprehension and enjoyment have not yet been measured with beginners.
- **Release:** source commit `a5fc54a` is public and deployed to the separate CodeQuest project as `dpl_8B5bsCmpRZiF42EswHHVTHwVJXJF` (READY), aliased at https://codequest-game-inky.vercel.app/.
- **Public verification:** two fresh unauthenticated browser profiles received HTTP 200, completed both prerequisite missions with real code and announced different events (Nova/garden and Ari/arcade). Each retained its character, choice, two gems and three hearts after reload. Audio played after interaction, stopped when muted and retained the mute setting after reload. No page errors or production test hooks.
- **CI:** GitHub run `39892652545` succeeded for source commit `a5fc54a`: lint, types, 219 unit tests, 99 Chromium cases on the first attempt and one beacon movement case on retry. The movement check used a fixed wall-clock delay; the follow-up waits for actual movement instead.

## 2026-10-22 (illustrated 2D wrist animation)

- **Done:** replaced the 3D hands and wrist model with an original transparent 2D illustration of a hoodie sleeve, natural hand and attached wrist tablet. Canvas 2D raises, settles and rotates the illustrated foreground, draws the player's display inside the bezel and zooms into the full-screen editor. The real city camera still approaches the character. The editor, Run button and output share the existing page.
- **Lifecycle:** T/Skip and Esc remain available; reduced motion opens the editor instantly. Missing artwork or an unavailable animation canvas opens the workspace directly. Closing during delayed module/image loading cannot reopen it. Temporary canvas, frame loop, listeners and observers are released.
- **Checks:** 213 unit tests and all 13 focused Chromium cases passed. Coverage includes all four practice languages, both 2D openings, responsive screen-entry geometry, phone layout, worker cancellation, saved drafts, mission navigation, interrupted drone delivery/camera recovery, missing art, delayed loads and canvas fallback. Lint, types and production build passed; production test hooks are absent.
- **Art/media:** saved the generated RGBA sprite and exact built-in image-tool prompt in [the tablet asset directory](../public/assets/tablet/ARTWORK.md). Inspected the actual animated frame with the live display correctly inside its bezel, and replaced the opening screenshot/video. Capture now advances rendered frames so the city zoom appears in the image.
- **Dependencies:** removed Three.js, its types and both obsolete rig files. The animation module is now 3.90 kB (1.83 kB gzip); its 1.62 MB illustrated PNG loads on demand. No changes to saves or grading.
- **Release:** source commit `189c9ba` is public and deployed to the separate CodeQuest project as `dpl_43h1QGRP82SmM1W9joDhLxfQENdB` (READY), aliased at https://codequest-game-inky.vercel.app/.
- **Public verification:** fresh unauthenticated browsers received HTTP 200 and loaded the actual illustrated PNG in the 2D renderer for both developers. Each completed the opening, ran code printing 42 with code/output visible together, displayed a syntax error and returned to the city. No page errors or production test hooks. Inspected a real public frame to confirm the illustration and display fit the bezel.
- **CI:** GitHub run `39889170956` passed lint, types, 213 unit tests and all 91 Chromium cases for source commit `189c9ba`.

## 2026-10-22 (slim wrist-device model)

- **Done:** replaced the bulky 3D arms and illuminated casing with fitted woven hoodie sleeves, shaped hands, continuous curled fingers, a slim metal tablet, small bezel controls, a rear cradle and two bands around the forearm. The supporting arm now follows the bezel through a joint-length-preserving pose. Softened lighting keeps skin and cloth readable. The approved camera movement, three-second timing and editor/output layout retain their behavior.
- **Checks:** 211 unit tests and five focused Chromium cases passed, including both character openings, walking/camera restoration, reduced-motion phone layout, skip/early close and unavailable WebGL. Lint, type checking and production build passed; production test hooks are absent. Inspected actual model captures and refreshed the opening screenshot/video without page errors. No dependencies or save changes.
- **Release:** source commit `cfc5f0b` is public and deployed to the separate game project as `dpl_AoQKxivCZshcNK6xKDj9LbqguSSS` (READY), aliased at https://codequest-game-inky.vercel.app/. GitHub CI run `39887220519` passed lint, types, 211 unit tests and all 90 Chromium cases.
- **Public verification:** inspected a fresh browser capture of the new slim model from the public URL. Both developers completed the opening and ran code printing 42 while the editor and output remained visible, displayed a syntax error and returned to the city. HTTP 200, no page errors and no production test hooks. An initial error assertion exceeded its five-second wait; both profiles passed when the UI check allowed 30 seconds.

## 2026-10-22 (first-person wrist view and inline practice results)

- **Done:** revised the opening to a three-second city zoom, followed by the developer's own view looking down at an attached wrist tablet and entering its screen. Removed the external full-body/head shot. Both hoodie styles retain connected arms and hands; the screen faces the wearer's eyes. Skip, reduced motion, WebGL fallback, cancellation and camera restoration remain available.
- **Done:** placed the Run button and live output below practice code. Running keeps the editor visible; Console offers a larger view of the same result. Per-language drafts, mission grading, hearts and gems retain their existing rules.
- **Checks:** 211 unit tests and 18 focused Chromium cases passed, covering all four tablet languages and drone missions, both first-person openings, connected wrist geometry, phone sizing, skip/close/fallback, worker cancellation, saved drafts and missions inside the device. Lint, type checking and production build passed. Production test hooks are absent. The final first-person framing and editor/output layout were inspected in actual browser captures.
- **Media:** updated the real tablet screenshots and opening video, capture script and current documentation to match the new view and inline results; both browser captures completed without page errors.
- **Release:** source commit `6119082` is public and deployed to the separate CodeQuest project as `dpl_5m3rxQD9eswWnM65VZRbQvyMdN51` (READY), aliased at https://codequest-game-inky.vercel.app/.
- **Public verification:** fresh unauthenticated browsers received HTTP 200 and entered the first-person wrist view for both developers. Each ran code printing 42 with the editor and output visible together, then displayed a syntax error below the editor. Closing returned to the city; no page errors or production test hooks were present.
- **CI:** GitHub run `39864184820` passed lint, types, 211 unit tests and all 90 Chromium cases for source commit `6119082`.

## 2026-10-22 (verified public 3D tablet release)
- **Release:** commit `ae867b9` is deployed by Vercel as `dpl_FZdk1sWYSQgrtoPCYx3SumwqwzrG`, READY at https://codequest-game-inky.vercel.app/. GitHub CI run `39861733403` passed lint, types, 211 unit tests and all 90 Chromium tests, without retries reported.
- **Public verification:** a fresh unauthenticated browser received HTTP 200, watched the real 3D boy/tablet sequence, entered the full-screen workspace, completed a graded mission inside its frame and ran free practice successfully. The temporary 3D canvas was removed afterward; production test hooks were absent and no page errors occurred.
- **Independent players:** two fresh public browser profiles used the same URL. Nova retained a boy character, one solved mission, one gem and Nova's own practice draft. Luna retained a girl character, zero solved missions, zero gems and Luna's own draft. Both reloaded successfully without sharing progress or characters. Saves remain local to the browser profile rather than following an account across devices.
- **Next:** beginner playtesting of the courier learning loop and the tablet interaction; optional discoveries and later story missions remain on the roadmap.
- **Blockers:** none for the public game.

## 2026-10-22 (3D wrist tablet and independent players)
- **Done:** replaced the flat tablet reveal with an original procedural 3D boy/girl developer, hoodie/backpack, articulated shoulders/elbows/hands and a wrist-mounted display. The city camera approaches the player, the arms lift the device, the head and eyes follow its screen, then a perspective camera moves into the full-screen tablet. T / Skip bypasses the shot; Esc cancels it. Closing, late imports and unavailable 3D contexts leave the workspace/city usable. Geometry, textures and renderer are disposed after the shot.
- **Done:** added Missions and Guide tabs alongside practice, examples and console. Mission tasks stay inside the device frame and use the existing grader; Tablet home returns without replaying the opening. No save schema or reward changes. The title and README now explain that characters, progress and drafts belong to the player's browser profile. Two isolated players using the same URL retain different names, heroes, mission progress and drafts through reload; cross-device account synchronization is not part of the current save model.
- **Checks:** 211 unit tests and all 24 focused Chromium cases passed. These cover both full 3D shots, screen-facing head/device geometry and connected arm joints, full-screen sizing, camera restoration, skip/cancel/late loading, unavailable WebGL, all four language runtimes, missions in the tablet, independent players, drone repair/reload and solid-world collisions. The two character shots and skip/late-load case passed again after switching the shot to real elapsed time, preventing slow frames from stretching its duration. Lint, types and production build passed; the 3D renderer is a separate ~546 kB chunk (~137 kB gzip), loaded only for the shot. Production test hooks remain excluded.
- **Media:** refreshed five actual-game screenshots, including the 3D wrist-device shot and full-screen workspace, and recorded a 1.16 MB WebM of the real opening. Browser capture completed without page errors. The reproducible screenshot script freezes the shot at a deterministic point for the image.
- **Dependencies:** added Three.js 0.186.1 with its types for real 3D rendering. Updated Vite to 8.3.5 after installation surfaced existing development-server advisories; `npm audit` reports zero vulnerabilities.
- **Next:** push the completed changes, publish the Vercel release and verify it publicly.
- **Blockers:** none.

## 2026-10-22 (courier and tablet public release)
- **Release:** source commit `d5f1199` and screenshot commit `f539315` are public on `amirh3sam/codequest-game`. The separate Vercel project reports READY for deployment `dpl_2iVNey5pL8ECu1JGcCGYhABv9HLR`, aliased at https://codequest-game-inky.vercel.app/.
- **Public verification:** a fresh unauthenticated Chromium browser received HTTP 200 and ran a real battery program printing 7 in the tablet in JavaScript, TypeScript, Python and Java. Practice left all mission progress, hearts and gems unchanged. The public JavaScript journey completed the badge, prediction, editable preview, accepted repair and delivery; reloading restored Kai's repaired mission. All four browsers reported zero page errors and confirmed production test hooks are absent. GitHub's contents API confirmed the four new PNGs and removal of the reference-art directory.
- **Checks:** the production build, lint, type checking, 208 unit tests and 27 focused browser cases passed. The source release's full GitHub browser suite was still running when this entry was written; its install, lint, types and unit steps had passed.
- **Next:** beginner playtesting of the learning/adventure loop; further discoveries and story choices remain on the roadmap.
- **Blockers:** none for the public game.

## 2026-10-22 (GitHub game screenshots)
- **Done:** removed the four superseded planning pictures under `docs/reference/`. The README now shows four real screenshots of the current tech city, drone lesson, repair editor and developer tablet. Updated PRD/architecture references and added a repeatable Playwright capture script plus capture notes.
- **Checks:** all four captures completed through the real game UI without page errors and were visually reviewed. The examples printed 5 and 12 through the actual JavaScript worker, including a correctly filled 12-cell meter. Production build passed; test hooks are absent from its JavaScript. Lint and whitespace checks passed.
- **Next:** publish the validated source, pictures and production game; verify the public release.
- **Blockers:** none.

## 2026-10-22 (courier adventure and developer tablet)
- **Done:** added Kai's stranded-drone mission to Variable District in all four languages. The guided sequence predicts a value, runs a worked example, explains the changing variable, lets the learner modify a real-code preview, then asks for an independent repair. A battery meter follows worker output. Accepted task `variables-2` opens a solid courier passage and enables an animated delivery; a free 4 + 3 variation checks transfer. Existing task IDs, version-1 saves and one-time rewards remain intact.
- **Done:** added T / Tablet to raise a developer tablet with a character-and-device opening animation and perspective transition. Its editor, examples and console run the selected language through existing workers, save independent local drafts and never change mission progress, hearts or gems. Closing or changing panels cancels active execution. Tabs support keyboard navigation; reduced motion skips the reveal.
- **Checks:** 208 unit tests passed, along with 27 focused Chromium cases across the feature and regression runs: all 72 reference programs, both district journeys, all four language lesson/tablet flows, gate collision, old-save restoration, one-time rewards, transfer practice, worker cancellation, interrupted delivery/camera recovery, the complete physical terminal/Firewall route and all 48 walking frames. The first mixed run exposed Kai crowding the lower route and a short cold-start assertion under load. Kai now stands outside that route; its physical journey and TypeScript cold-start check passed after correction. Lint and type checking passed. Production build and deployment are recorded in the following release entry.
- **Next:** replace the GitHub planning pictures with current gameplay captures, publish this release and playtest the pilot with beginners before expanding the adventure.
- **Blockers:** none for release. Beginner comprehension and enjoyment still need real player feedback.

## 2026-10-22 (education and game-design review)
- **Done:** reviewed the live feature set, lessons and progression against the user's concern that the game feels like completing exercises. Added `docs/GAME-DESIGN.md`: city-restoration story, discover/learn/experiment/repair loop, PRIMM-inspired teaching sequence, a stranded-drone pilot, concept-to-gameplay mapping, build order and beginner playtest criteria. Moved this pilot ahead of adding more districts or editor polish in the roadmap and recorded the current direction in the PRD.
- **Checks:** documentation and links reviewed; `git diff --check` passed. No runtime changes, so no additional game tests or Vercel release are needed. Existing public release and GitHub CI are green.
- **Next:** implement the small drone mission with contextual teaching and visible world consequences; retain four-language execution, saves and current reward rules.
- **Blockers:** none. The gameplay ideas in the design are planned, not yet implemented.

## 2026-10-22 (Logic Junction)
- **Done:** added four lesson pages, eight conditions missions and the Router boss with three hints in JavaScript, TypeScript, Python and Java. Generalized the loader, HUD, journal, drafts, penalties, victory and world markers to use the active district. The world map now opens Logic Junction after the Firewall; travel and Continue retain independent district progress. Logic Junction uses a violet campus tint and decision-network signage, reusing the existing solid map. No save migration or new dependencies.
- **Checks:** 201 unit tests and all 71 Chromium cases passed across the complete UI run and a 58-case worker recheck. The first full run passed 69 cases and exposed two Java checks competing with title-screen rendering; worker-only fixtures now sleep the renderer, retain the real workers and pass unchanged runtime assertions. The Java recovery test allows two compile caps plus the run timeout. All 72 reference programs passed. District travel, Continue, reset isolation, hints/victory and all 48 walking frames were verified; a Logic Junction screenshot was inspected. Lint, type checking and the production build passed; production test hooks are absent.
- **Release:** game commit `3f0f671` is deployed at https://codequest-game-inky.vercel.app/ (`dpl_CynDAn9qAixZqwB3M7oYijatS8tm`). An unauthenticated production browser received HTTP 200, entered Logic Junction, completed all eight missions and the Router, reported no page errors and confirmed test hooks are absent. The earlier public check also submitted real code in all four languages successfully.
- **Next:** CodeMirror and later districts, following the user's authorization to continue without routine confirmation and to commit each completed task.
- **Blockers:** none for the public game; CLI publication remains available while GitHub app repository access is unconnected.

## 2026-10-22 (public verification and interaction timing)
- **Done:** launched https://codequest-game-inky.vercel.app/ from public commit `8a9fd28`. A fresh, unauthenticated browser successfully submitted real code in JavaScript, TypeScript, Python and Java; each returned a correct answer with HTTP-200 runtime assets and no page errors. Added the live link to the README. Fixed a quick-key interaction race found by Linux CI: E/Space now dispatches on key-down instead of relying on the next render frame.
- **Checks:** the full physical eight-terminal/Firewall route passed after the input fix. Initial Linux CI passed 68 of 69 tests and exposed the missed short press; the following CI run for commit `508f81f` passed all 69 browser tests plus lint, types and unit tests.
- **Next:** Logic Junction content and area travel; commit and publish it after validation.
- **Blockers:** GitHub-to-Vercel automatic builds need GitHub app repository access; CLI deployment works and publishes the public game successfully.

## 2026-10-22 (walking fix and public launch)
- **Done:** replaced overlapping standing/animated legs with exactly two extracted leg layers per developer pose; retained complete shoes and removed detached edge fragments. The boy and girl keep their laptop, backpack and upper body while their legs walk. Created public `amirh3sam/codequest-game` and separate Vercel `codequest-game` project in `amirhesam-tech`; the original private repository and calculator project remain intact. Added deployment configuration and persistent instructions to commit completed tasks and continue authorized roadmap work.
- **Checks:** 196 unit tests and nine focused Chromium tests passed, including all 48 walking frames, both avatars/Continue, full physical quest route, rewards, victory, reset, terminal/trunk collision and transparent tree layering. Three final art/avatar/walking checks also passed after removing tiny edge fragments. Lint, type checking and the production build passed.
- **Next:** publish and verify the public game, then implement Logic Junction (conditions) without another confirmation.
- **Blockers:** none; GitHub and Vercel authentication are available.

## 2026-10-22 (modern tech city)
- **Done:** replaced the fantasy setting with Variable District, a modern glass-and-steel coding campus. Added distinct boy/girl developers in blue/violet hoodies with laptops and backpacks, directional poses and articulated walking. Replaced chests with coding terminals, the scroll with a digital guide and the Gatekeeper with a Firewall server core. Added city street trees, utility cabinets and metal rails, blue/cyan menus and tech-district names. Aligned building, planter and reflecting-pool collision with the new terrain. Task IDs, runnable solutions, rewards and version-1 saves remain compatible.
- **Checks:** 196 unit tests and all eight focused Chromium checks passed. Browser coverage includes the full physical eight-terminal/Firewall journey, coding/rewards/Continue, hints/victory, heart reset, local assets and both avatar choices. Obstacle checks cover numbered terminals, solid trunks and transparent canopy layering. The terminal-detour test now follows the open left lane around the new raised planter. Desktop title/district/editor and mobile title were inspected. Lint, type checking and production build passed.
- **Next:** Logic Junction content/map, CodeMirror and audio.
- **Blockers:** none. Generated assets and final prompts are recorded in `public/assets/tech-city/ARTWORK.md`.

## 2026-10-22 (solid world objects and walking)
- **Done:** separated the painted ground from transparent tree/rock/fence sprites; removed rectangular foreground crops. Added solid chest, trunk, rock, fence, building, pedestal and boss footprints plus a polygonal pond shore. Swept foot collision prevents tunneling and permits sliding. Chest numbers are attached to their fronts. Enlarged the world to 1536 × 864 with 1.6× chest spacing and a following camera. Added six articulated walking poses, alternating planted/lifted feet, torso registration and distance-driven timing; walking stops when blocked.
- **Checks:** 196 unit tests and seven Chromium tests passed. New tests push against chests/trunks, verify the attached numbers, walk around obstacles and check transparent canopy layering. The full physical quest route still reaches and solves all eight tasks and the boss. Existing rewards, saves, reset and art checks passed. Browser screenshots were inspected.
- **Next:** Condition Bridge content/map; CodeMirror and audio.
- **Blockers:** none. Save schema unchanged; invalid positions return to the safe entrance while retaining progress.

## 2026-10-22 (fantasy adventure artwork)
- **Done:** replaced the small chibi hero with tall sword-and-helmet knights, long armored legs, shield, cape and sixteen directional/stride poses. Added crimson/amethyst variants, boot alignment and a readable HUD portrait. Integrated a detailed painted woodland outpost, ornate closed/open treasure chests, magical lesson scroll and armored Gatekeeper. Aligned quest locations, collisions and foreground layers with the new map; existing saves retain their version-1 shape.
- **Checks:** 190 unit tests and five Chromium tests passed. The new browser journey turns in all four directions, walks to all eight chests, opens each with E, solves the tasks and walks to/defeats the boss. Existing movement/rewards/reload, hints/victory, reset and art smoke checks passed. Lint, type checking and production build passed. Desktop title, village and editor plus mobile title were inspected.
- **Next:** Condition Bridge content/map; CodeMirror and audio remain future work.
- **Blockers:** none. Generated PNGs and final prompts are kept in `public/assets/adventure/`.

## 2026-10-21 (village graphics)
- **Done:** polished the playable village with textured grass, warm paths, layered tree varieties, house windows/doors, garden beds and fences, a pond with reeds and lily pads, lanterns and a stone boss shrine. Added subtle ripples, smoke, motes, quest beacons, completion sparkles and depth sorting. Redesigned the title screen, language cards, panels and HUD; added segmented quest progress and preserved crisp sprite pixels. Decorative animations respect reduced-motion preferences.
- **Checks:** 190 unit tests and six Chromium checks passed, including the full eight-task/boss journey, movement, heart reset and saves. Lint passed. Desktop title, village and editor screenshots were inspected, plus the mobile title layout. No new dependencies or save changes.
- **Next:** Condition Bridge content and map; CodeMirror and directional walk frames remain future work.
- **Blockers:** none. The new visuals are available on the existing local dev server.

## 2026-10-21 (playable village)
- **Done:** replaced the static preview with a connected game: language/hero/name selection, Continue and confirmed replacement, village walking and collisions, scroll/chest/boss interactions, HUD, eight tasks and a boss in every language, Run/Submit through real workers, grading, hearts, gems, boss hints, retries, victory, world map and automatic saves. Added a JavaScript worker, JSON content validation and loader. The current editor is a plain text area; map layout uses JSON rather than Tiled.
- **Checks:** 190 unit tests passed. JavaScript, TypeScript and Java reference-solution browser tests passed; Python passed in isolation after a parallel cold-load timeout. All 36 programs passed real runners/graders. Three player-flow tests passed: movement/code/rewards/reload, eight tasks plus boss/hint/victory, and last-heart reset with the lesson preserved. Save and art browser checks also passed. Lint, types and production build passed; test hooks remain excluded from production.
- **Next:** Condition Bridge content and map; CodeMirror, directional walking animations, boss health-bar polish, and remaining language UI journeys.
- **Blockers:** none for playing Variable Village. Heavy runtime reference tests now execute sequentially within their file to avoid cold-load contention. Areas 2–7 are displayed as future content.

## 2026-10-21 (browser saves)
- **Done:** implemented `core/save.ts` with independent `codequest:v1:<lang>` slots, the existing version-1 shape, validation before loading/writing, and explicit empty/corrupt/unsupported-version/storage-error results. Corrupt and unsupported saves stay untouched; quota and access failures are reported without crashing. Test-mode hooks expose save APIs for real-browser verification.
- **Checks:** 180 unit tests passed (61 new save cases); three Chromium tests passed (two saves tests and the art smoke). Verified complete per-language progress survives reload and one invalid language slot leaves the others intact. Type-checking, lint and the production build passed. Unchanged runner E2E suites were not rerun.
- **Next:** content schema, loader and validation tests (FR-16).
- **Blockers:** none. The save adapter is ready for gameplay integration; the visible screen remains the art preview. Continue/New screens and calling saves after gameplay transitions remain later roadmap tasks.

## 2026-10-21 (core progression)
- **Done:** implemented `core/state.ts` with the documented version-1 shape and pure, immutable state changes. Added task ordering, one-time gem rewards, three-heart penalties and area resets, lesson discovery, ordered boss hints, boss completion and seven-area unlocks. Delayed failures from another area are ignored. Reset notifications are returned for the future UI; completed areas remain completed.
- **Checks:** 119 unit tests passed (28 new progression tests), including a full seven-area rules journey, penalties, duplicate rewards, immutable inputs, hint costs, last-heart resets and earlier-area preservation. Type-checking, lint and the production build passed. No UI or worker implementation changed, so browser/runner E2E suites were not rerun for this task.
- **Next:** `core/save.ts` for per-language browser slots, version checking and corrupt-save handling (FR-14).
- **Blockers:** none. Game rules are ready for integration; the visible screen is still the art preview.

## 2026-10-21
- **Done:** installed the core Ruflo skill for Codex; initialized project runtime and local memory; added the pinned `npm run ruflo` command. Completed M0 art selection: vendored four Kenney CC0 sheets and original licenses, catalogued hero/scroll/gem/boss frames, and added a static boot preview. Updated the Chromium smoke test to verify local art loading and capture a preview.
- **Checks:** all 91 unit tests, lint, type-checking, production build and the Chromium art smoke test passed. Visually inspected the captured preview. Ruflo memory initialization passed 6/6 checks; project context was stored and retrieved successfully. The unchanged runner E2E suites were not rerun for this art milestone.
- **Next:** M1 `core/state.ts` and game rules for hearts, gems, solving tasks, resetting the current area and unlocking the next area.
- **Blockers:** none for game development. Optional Ruflo integrations remain unconfigured; see `docs/RUFLO.md`.

## 2026-10-04
- **Done:** git init, base files, reference images moved to `docs/reference/`. Requirements gathered; PRD, ARCHITECTURE, ROADMAP, DECISIONS written and approved. Created 10 subagents and 8 workflow commands. Scaffolded Vite + TS + Phaser; lint, typecheck, unit and e2e smoke tests pass; dev server runs on :5173. CI workflow added.
- **Next:** M0 spike: run Java in the browser with teavm-javac.
- **Blockers:** none.
