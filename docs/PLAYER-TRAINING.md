# Player training

New developers enter a 24-step character-led **Guide tour** after choosing a
language, character and name. Ava or Kai appears beside a speech bubble with
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
In the city, **Guide tour** is in the HUD, mobile menu and pause menu.

**Training** opens the separate 13-chapter interactive handbook. Its 2D scenes use
the game's developer sprites, city artwork and illustrated wrist tablet. Players
control the pace with Back/Next, a chapter index, pause/replay animation controls
and Skip training. The guide's **Open detailed handbook** provides direct access.

The chapters cover the city's goal; keyboard/mouse/touch movement; the courier;
real Run versus graded Submit, hearts and rewards; every HUD/mobile menu; all eight
tablet tabs; files/classes/imports/snippets and local folders; tasks/bosses/transit;
programmable district lights; both arcade games; multiple adventures and backups;
and accessibility, audio and the first real mission.

Training is a paused sandbox. Movement follows real obstacle-aware routes in a
miniature map. Code exercises use the selected language's real worker. Training
Submit and every other preview leave adventure tasks, hearts, gems and records
unchanged. Leaving a running lesson cancels execution and removes its animation.

Each of the 23 districts has a three-part briefing with its actual lesson,
selected-language example, first task and boss. The first arrival opens it once;
Finish/Skip remembers that district in the adventure, including downloaded backup
files. Returning players with older saves can opt in without an unsolicited tour.

Use **Training** in the HUD/mobile menu, **Training handbook** in Menu, or
**How to play** on the title screen to replay. **Tablet help** opens the tablet
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

Character controls are available at **Menu → Manage character**, or from the title
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
