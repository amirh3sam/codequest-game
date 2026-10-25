# Player training

**Guided adventure** is selected by default on a new player's title screen.
**Start adventure** opens **My adventure** automatically: a character welcome,
one next action, what to learn, what to expect, and a completed/current/upcoming
timeline. There is no requirement to choose between lessons, missions and training.

The order is **Robot Rescue → first city mission → Smart Gate → robot delivery
→ build and beat a game → restore three city services → three review repairs
→ room rewards**. Each verified completion offers the next step directly. The
city objective's **Continue this step**, **Menu → My adventure**, and
**Tablet → Guide → My adventure** return to the same recommendation. A deployed
robot route resumes on its saved map; a saved unbeaten game opens for play;
unfinished review drafts reopen. After eight steps, continue the next normal city
task. The 23 districts still each have eight tasks and a boss with sequential locks.

The desktop and phone menus share seven choices:

| Choice | Purpose |
| --- | --- |
| My adventure | Continue the recommended learning order. |
| Tablet | Files, editor, Run/output and project work. |
| Progress | Actual coding task, boss and badge progress. |
| World map | Travel to unlocked districts. |
| City activities | Arcade, lighting, robot lab, saved games and room. |
| Help & controls | Controls tour, player handbook, district examples and accessibility/sound. |
| Save & profile | Backups, switch adventure, character management and first-time replay. |

Experienced players can choose **Explore freely** at creation. Existing saves
keep their previous mode. **My adventure → All activities · Free play** lets
anyone revisit activities without losing the recommended order.

To try the first-time flow with your current character/language, open
**Menu → Save & profile → Try as a new player** or
[the fresh-start link](https://codequest-game-inky.vercel.app/?first-time=1).
**Start fresh guided adventure** downloads a backup and makes a separate blank
guided adventure. The original adventure and its source projects remain available.
It does not erase the browser profile or force a reset on other players.

The first action opens the beginner robot rescue.
Its seven discoveries introduce ordered instructions, a string variable, numeric
prediction, a three-line value replay, changing a charge, an independent rescue
and a follow-up with different numbers. All four selected language runtimes run
real code. The Java class/main method and print line are supplied, with the exact
full program available to expand. Three clue levels help without replacing drafts.

The rescue tests the same charging instruction from both 3 and 4 cells, requiring
10 and 11 respectively. Simply setting battery to 10 cannot pass both checks.
Animations/meters follow the actual results; the instruction-card puzzle and
guided replay are explicitly teaching activities. There is no countdown or heart
cost. Completing the chapter earns Rescue Coder separately from city tasks.
Guided players continue directly to their first courier/city mission afterward.

Robot name, cards, ordered completion, current lesson and editable drafts are
saved per adventure under its optional version-1 `beginner` field and travel in
**Save backup file / Load backup file**. Refresh resumes an active lesson; leaving
pauses it for reopening from My adventure. Existing saves work without the new field.
Restart resets this chapter too; rename preserves it and deletion removes it with
the adventure. Storage failures are reported in the chapter banner. Phone scenes
remain visible beside/above practice and adapt after rotation; Reduce Motion
removes movement transitions.

The optional **Help & controls → Show controls tour** opens a 24-step
character-led tour. Ava or Kai appears beside a speech bubble with
animated captions, glowing spotlights and arrows pointing at the real controls.
The tour opens the actual tablet tabs, world map, lighting console, arcade lobby,
backup menu, character settings and accessibility controls. It explains each one
without running or replacing code, grading missions or spending hearts/gems.
The visual reference is the guided site tour at https://amirhesamtech.com/; the
implementation uses CodeQuest's own developer artwork and game controls.

Back/Next, topic selection, Show all text, Skip and Escape control the pace. The
full caption is available to screen readers immediately; long captions can scroll
with touch or keyboard. Phone placement scrolls targets into view and adapts the
bubble so it stays separate from the highlighted region in portrait/landscape.
Reduce Motion shows complete captions without animation; large-text and contrast
preferences apply. Refresh resumes an unfinished city tour. Returning existing
players can opt in, and prior handbook sessions continue where they stopped.

The title screen also has a seven-step Guide tour covering languages, avatar/name
selection, saved adventures and backups. Replaying it does not create a character.
In the city, the tour is under **Help & controls** in both menus.

**Help & controls → Open player handbook** opens a 13-chapter interactive handbook. Its 2D scenes use
the game's developer sprites, city artwork and illustrated wrist tablet. Players
control the pace with Back/Next, a chapter index, pause/replay animation controls
and Skip training. The guide's **Open detailed handbook** provides direct access.

The chapters cover the city's goal; keyboard/mouse/touch movement; the courier;
real Run versus graded Submit, hearts and rewards; every HUD/mobile menu; all seven
tablet tabs; files/classes/imports/snippets and local folders; tasks/bosses/transit;
programmable district lights; both arcade games; multiple adventures and backups;
and accessibility, audio and the first real mission.

Training is a paused sandbox. Movement follows real obstacle-aware routes in a
miniature map. Code exercises use the selected language's real worker. Training
Submit and every other preview leave adventure tasks, hearts, gems and records
unchanged. Leaving a running lesson cancels execution and removes its animation.

Each of the 23 districts has a three-part briefing with its actual lesson,
selected-language example, first task and boss. Free-exploration players can enable automatic first-arrival briefings;
Finish/Skip remembers that district in the adventure, including downloaded backup
files. Returning players with older saves can opt in without an unsolicited tour.

Use **Menu → Help & controls → Open player handbook**, or **Help & controls**
on the title screen to replay. **Tablet help** opens the tablet
chapter and returns to the same tab on Finish/Skip, Escape or ×, preserving files
and drafts. The handbook can turn automatic district introductions on/off.

The save animation demonstrates downloading to disk, losing browser site data and
loading the retained file. It also shows the missing-backup case. All clearing and
restoration in that scene affect only the preview. Captions explain that normal
refreshes preserve autosave, downloaded backups are point-in-time snapshots that
must be renewed, and tablet project files need their separate export.

Welcome-tour preferences and last chapter are device-local under
`codequest:training:v1`; the character-led tour uses `codequest:guide-tour:v1`.
Per-adventure district history is the optional
`training.districts` state field; existing version-1 saves remain supported.
Adventure backups and tablet project exports are separate; the training explains
both and does not imply an account or automatic cloud synchronization.

Character controls are available at **Menu → Save & profile → Manage character**, or from the title
screen's **Manage adventures → Manage [name]**. Rename keeps the adventure ID,
missions, records and coding files. Restart keeps the name, appearance and
language but creates a fresh adventure at level 1, resetting all district progress
and removing the old adventure's browser coding work. Delete removes that
character and its browser data. Other adventures stay intact.

Restart/Delete require typing `RESTART`/`DELETE`, and offer a backup download
before continuing. **Manage adventures → Delete all game data** removes the local
profile: every character, browser project/draft and preference. It requires
`DELETE ALL` and reloads the title screen. These actions do not remove downloaded
backups or files in connected computer folders. Other open tabs retire the old
adventure and discard pending drafts when it is removed.
## Learning adventures and your own creations

Open **Menu → My adventure** on desktop or phone. The same path is available in **Tablet → Guide**. Its ordered steps show verified progress; expanded free-play cards show discoveries, delivered routes, saved games, restored services, reviews and rewards. These activities do not bypass district tasks or boss locks.

1. After **Robot Rescue**, continue to **The Smart Gate**. Run a real condition, make a prediction, follow the chosen branch, include the exact minimum energy, then require a delivery badge as well. Expand the complete program whenever you want to see its supplied class/print scaffolding. All four languages work.
2. Open **Robot companion**. Run a loop or a list that prints exactly three different terminal numbers from 1 to 8. **Deploy route in city** becomes available only for valid real output. The named robot walks around obstacles and saves each delivery checkpoint. It waits while menus are open; unfinished routes resume in their saved district. Deliveries do not complete coding tasks.
3. The guided game step opens **Code** directly with GameRules selected and the next goal above the editor. Change the title, Run, then change the gem goal and Run again. Run starts Main for this project in every language, even while editing GameRules. Free players can also start through **Projects → Start Arcade Builder → Open project files**. Experiment with color, walls, scoring, speed and themes. **Play my game** appears for valid output; editing requires another run. Save a playable design and collect all gems to finish the guided step. **My arcade** holds up to eight games per adventure with keyboard/touch controls, pause and restart. Export project downloads editable source separately.
4. In **Restore the city**, Gatekeeper reopens the workshop, one physical robot route repairs tram service, and a workshop/tram plus a beaten saved game reconnect the data exchange. Use the workshop's actual campus door, project services or room. Tram ticket desks open the regular world map and retain its locks. Physical trams run on the districts' existing tracks; reduced motion keeps the art stationary while travel remains available. Courier dialogue remembers repairs.
5. **Review adventures** suggests a recent unresolved idea from beginner answers, robot routes or early district submissions. Every repair uses fresh inputs; fixed answers can fail another check. Three variants per concept cover changing values, cooling decisions and repeated markers. Clues build toward an explained solution. Syntax/runtime errors do not create a concept-mistake record. Completion clears the suggestion and rotates its next story. This information stays on your device and in adventure backups.
6. In **My developer room**, equip earned hoodie colors, robot shells and antenna parts, choose a free wall color, and add earned plants, a lamp or a trophy. Requirements appear beside locked choices. Clothing and robot parts also change in the city. Earned rewards stay earned when you remove a saved mini-game. Restarting the adventure starts fresh; renaming keeps it all.

**Save backup file** includes chapter work, delivery checkpoints, playable game rules/records, restoration, reviews and room rewards. **Export project** includes coding source folders/files. Keep both on your hard drive and refresh the backups after meaningful progress. Loading an adventure backup creates another adventure; it does not overwrite your other characters. Reset/deletion confirmations offer a backup before removing local work.
