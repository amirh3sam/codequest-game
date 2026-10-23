# CodeQuest: learning through a city adventure

Design direction recorded on 2026-10-22 after the user's review. The first drone
pilot is implemented in Variable District: Kai, prediction, real-code previews,
an independent repair, a delivery animation, a solid lane that opens and free
transfer practice in all four languages. A T-key tablet adds independent practice.
The broader mission ideas below remain the direction for later work; beginner
playtests have not yet established learning gains or enjoyment.

## The problem identified before the pilot

The browser runners, saves, movement and progression work. The main activity is
still opening a numbered terminal, matching its output and unlocking the next
exercise. Completed terminals change appearance, but the surrounding city does
little in response. Lessons are separate pages rather than help encountered at
the moment a learner needs it. Exploration has few discoveries or choices.

The next milestone should prove that solving a coding problem is an enjoyable
part of an adventure. More districts, longer lessons, badges and prettier panels
alone do not establish that connection.

## The player's purpose

A city network failure has stranded delivery drones, locked smart gates and
disconnected neighborhoods. The player is a junior developer with a laptop,
backpack and a local mentor. Their job is to restore useful systems and help the
people who depend on them. Each district contributes to reconnecting the city.

The player should be able to answer three questions without opening a task list:
who needs help, what is broken, and what will change if they fix it?

## The repeating loop

Explore -> meet someone or discover a fault -> understand the problem -> learn
one small idea -> experiment with code -> repair the system -> watch the world
change -> discover the next route or story event.

Walking supplies discovery and choices. Coding gives the player a useful ability
inside that world. A completed puzzle should leave a visible, lasting result.

## Teaching inside the adventure

Use a short, flexible teaching sequence adapted from PRIMM:

1. Predict what a tiny working example will do.
2. Run it safely and compare the result with the prediction.
3. Investigate: explain a value, expression or chosen branch in plain language.
4. Modify one part and watch the result change.
5. Make a small solution with progressively less starter code.

Reference: Sue Sentance's [original explanation of PRIMM](https://suesentance.net/2017/09/01/primm-a-structured-approach-to-teaching-programming/)
and the authors' [2019 research paper](https://doi.org/10.1080/08993408.2019.1608781).
This is an adaptation for a solo game; classroom findings do not establish that
this game's implementation improves learning. Beginner playtests must assess it.

Keep the help useful and close to the action:

- A brief concept card at the relevant device, with an optional deeper guide.
- A worked example with visible before/after values; examples should not simply
  supply the mission's complete answer.
- Free prediction and practice activities. Existing Run remains free, and the
  current graded Submit/heart policy is preserved for the first pilot.
- Feedback that identifies the mismatch: expected value, actual value, and a
  helpful question about the expression or branch. Avoid immediately showing the
  whole solution.
- Free conceptual help on ordinary missions; existing gem purchases remain
  reserved for boss hints.
- A later variation that checks whether the learner can apply the same idea with
  different values. Completion counts alone are not evidence of understanding.

Avoid requiring unrelated syntax before a concept has been taught. Keep examples
and starter code appropriate to each selected language, including Java's current
browser-runtime limitations.

## First playable pilot: the stranded delivery drone

Aim for a coherent first five to ten minutes, with an untimed learning pace.

1. Near the entrance, a courier and a grounded drone establish a clear problem:
   the drone needs enough charge to deliver a replacement network component.
2. A short conversation explains why the delivery matters and points to the
   nearby charging station. The objective becomes "Help the courier launch the
   drone", rather than "Complete task 1".
3. The mentor introduces a battery variable with a small demonstration. The
   learner predicts a value, runs the example and sees a battery meter respond.
4. A guided edit changes the charge amount. Preview shows what the code would
   do without awarding progress or permanently changing the world.
5. The learner writes a small variables-and-arithmetic solution. Only a verified
   submission completes the repair.
6. The battery fills, the drone takes off, the courier responds, and the delivery
   activates a route or device that was previously unavailable.
7. A short follow-up uses a different charge amount to check understanding and
   introduces the next story objective. The learner can explain the change.

Keep code, messages and the battery display consistent. A correct printed number
with an unexplained animation is insufficient: the learner should see how the
value in their code produced the result. Preserve existing saved progress when
mapping the pilot onto the early missions.

## Mission variety across the curriculum

| Concept | Adventure activity | Visible consequence |
| --- | --- | --- |
| Variables and arithmetic | Charge a drone or configure a neighborhood sign | Battery fills, drone launches, sign changes |
| Conditions | Program a smart gate or choose a safe network route | Gate responds to several visitors or routes |
| Loops | Send a robot through repeated repair checkpoints | Each repetition advances a visible action |
| Arrays/lists | Organize delivery items or recovered data | Items occupy the appropriate slots |
| Functions | Build a reusable repair command | The same tool repairs several devices |
| Objects | Configure a companion robot with its own state | Different robots exhibit their assigned behavior |
| Abstraction | Connect different devices through a shared control system | One command operates several device types |

These are proposed mission designs, including ideas for districts not built yet.
Each district should mix guided repair, prediction, debugging, exploration and
an independent final repair. Repeating one terminal interaction eight times
should not define the pacing of an entire district.

## What creates enjoyment

- Characters remember repairs and react to the player's progress.
- Discoverable shortcuts, optional conversations and small hidden areas give
  exploration a purpose. Avoid compulsory travel between otherwise identical
  exercise screens.
- Some missions allow a choice of whom to help or which route to restore first,
  while preserving the prerequisite order of new programming concepts.
- Successful code has an immediate animation and a lasting environmental effect.
- Milestones can earn a companion upgrade or a cosmetic directly. Keep gems and
  their current boss-hint spending rules intact during the pilot.
- Bosses become multi-step system failures with readable stages and feedback.
  The final repair should combine concepts already practiced.
- Optional later challenges can offer speed or efficiency goals. Core learning
  should give beginners time to think and experiment.

## Build order

1. **Delivered: drone mission pilot.** Kai gives a city-repair objective. The
   second task keeps its stable ID and reward while becoming a battery repair.
   Accepted code opens both lane gates; Watch the delivery runs the flight.
   Old completed saves restore the repaired world without another reward.
2. **Delivered in the pilot: teach through feedback.** The learner predicts
   3 + 2, changes the charge in free real-code previews, writes the repair from
   starter code, and can try a 4 + 3 variation afterward. A live meter and focused
   feedback connect code values to the result. Extend this to later missions.
3. **Delivered first optional discovery: exploration and choice.** Beyond the
   courier lane, Mina's community beacon lets the player choose Garden night or
   Arcade night. A free string-variable exercise previews the announcement; an
   explicit action then lights the courtyard mint or violet. Mina reacts to the
   chosen evening, and the Signal Maker badge appears in the tablet mission log.
   Choices persist on this device, survive an area retry and can be changed for
   free. More optional branches and wearable cosmetics remain future work.
4. **Rework the district finale.** Combine learned ideas in a staged repair with
   clear world effects, then apply the proven pattern to Logic Junction.
5. **Expand the curriculum.** Build later districts and improve the editor after
   the pilot demonstrates a useful learning loop and enjoyable gameplay.

Use the existing worker-only execution model. Game actions must be bounded,
validated reactions to results; player code must not execute on the main thread.
Preview must be reversible. Reopening or replaying a completed repair must not
award duplicate gems. Derive repair state from existing completion data when
possible; do not silently introduce an incompatible save format.

## Pilot acceptance and playtest questions

Automated checks should verify that the quest is reachable, preview does not
grant rewards, accepted code triggers the right repair once, blocked routes
change correctly, all four language solutions work, and reload restores the
same result without losing existing progress. Inspect the animation and its
relationship to the displayed values in a real browser.

Then invite three to five beginners for a manual playtest. Ask whether they can:

- Identify their story goal and why it matters without developer explanation.
- Explain what the battery variable stores and why its value changed.
- Solve a second small example with different values without copying the answer.
- Find help after a mistake and recover without being told what to type.
- Describe something they enjoyed and say whether they want the next mission.

Use those observations to revise pacing, feedback and the heart/reset policy
before expanding. Keep playtest participation voluntary and retain the current
no-account, no-analytics product model.
