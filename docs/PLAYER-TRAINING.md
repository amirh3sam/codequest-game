# Player training

New developers enter a 13-chapter interactive handbook after choosing a language,
character and name. Its 2D scenes use the game's developer sprites, city artwork
and illustrated wrist tablet. Players control the pace with Back/Next, a chapter
index, pause/replay animation controls and Skip training. Navigation stays visible
while the lesson scrolls, including on phones. Device Reduce Motion is respected.

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
`codequest:training:v1`. Per-adventure district history is the optional
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
