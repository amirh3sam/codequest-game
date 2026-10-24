import {
  batteryExampleBody,
  beginnerProgram,
  beginnerStarter,
  FIRST_PROGRAM,
  wrapBeginnerProgram,
} from "../content/first-program";
import {
  BEGINNER_STEPS,
  type BeginnerCodeStep,
  type BeginnerProgress,
  completeBeginnerStep,
  isRobotName,
  type RobotCommand,
  runRobotPlan,
} from "../core/beginner";
import { readBatteryOutput } from "../core/drone-mission";
import { gameAudio } from "../game/audio";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { beginnerHint } from "./debug-guidance";
import { button, el } from "./dom";
import { firstProgramScene } from "./first-program-scene";
import type { TrainingArtwork } from "./training-visual";
import "./first-program.css";

type Host = {
  lang: Lang;
  courier: string;
  artwork: TrainingArtwork;
  progress: BeginnerProgress;
  panel(): HTMLElement;
  save(progress: BeginnerProgress): boolean;
  run(code: string): Promise<RunResult>;
  cancelRun(): void;
  leave(): void;
  mission(): void;
  tour(): void;
};
const COMMANDS: Record<RobotCommand, string> = {
  move: "Move to supplies",
  collect: "Collect the kit",
  deliver: "Deliver to clinic",
};

export function openFirstProgram(host: Host): () => void {
  const panel = host.panel();
  panel.classList.add("zero-shell");
  panel.parentElement?.classList.add("zero-overlay");
  const banner = el("div", "zero-banner"),
    count = el("span"),
    saved = el("span", "", "Progress is part of your adventure backup");
  banner.append(el("span", "eyebrow", `START FROM ZERO / ${host.lang.toUpperCase()}`), count, saved);
  const layout = el("div", "zero-layout"),
    left = el("div", "zero-world"),
    work = el("section", "zero-work");
  const scene = firstProgramScene(host.artwork, host.progress.robotName);
  const mentor = el("div", "zero-mentor"),
    portrait = el("canvas"),
    speech = el("p");
  portrait.width = 96;
  portrait.height = 112;
  portrait.setAttribute("aria-hidden", "true");
  portrait.getContext("2d")?.drawImage(host.artwork.courier, 0, 0, 96, 112, 0, 0, 96, 112);
  mentor.append(portrait, el("strong", "", host.courier), speech);
  const concept = el("p", "zero-concept"),
    nav = el("nav", "zero-steps");
  nav.setAttribute("aria-label", "Beginner chapter lessons");
  left.append(scene.node, mentor, concept);
  layout.append(left, work);
  const footer = el("nav", "zero-footer");
  footer.setAttribute("aria-label", "Beginner chapter navigation");
  const back = button("Back", () => go(progress.step - 1)),
    leave = button("Save & explore city", host.leave);
  const next = button("Next lesson →", () => go(progress.step + 1), "button primary");
  footer.append(back, leave, next);
  panel.append(banner, nav, layout, footer);
  let progress = structuredClone(host.progress),
    alive = true,
    generation = 0,
    running = false,
    hintCount = 0;
  const save = () => {
    if (alive)
      saved.textContent = host.save(structuredClone(progress))
        ? "Saved on this device · included in adventure backups"
        : "Saving unavailable · keep this tab open and download an adventure backup";
  };
  const status = el("p", "zero-feedback");
  status.setAttribute("role", "status");
  function syncNavigation() {
    count.textContent = `${progress.completed.length} / ${BEGINNER_STEPS.length} discoveries`;
    nav.replaceChildren(
      ...BEGINNER_STEPS.map((id, index) => {
        const entry = button(
          `${progress.completed.includes(id) ? "✓" : index + 1} ${FIRST_PROGRAM[id].title}`,
          () => go(index),
          "zero-step",
        );
        entry.disabled = running || index > progress.completed.length;
        entry.setAttribute("aria-current", String(index === progress.step ? "step" : "false"));
        return entry;
      }),
    );
    const current = nav.children[progress.step] as HTMLElement | undefined;
    if (current) nav.scrollLeft = Math.max(0, current.offsetLeft - (nav.clientWidth - current.clientWidth) / 2);
    back.disabled = running || progress.step === 0;
    next.disabled = running || !progress.completed.includes(BEGINNER_STEPS[progress.step]);
    next.hidden = progress.step === BEGINNER_STEPS.length - 1;
  }
  function complete() {
    const previous = progress.completed.length;
    progress = completeBeginnerStep(progress, BEGINNER_STEPS[progress.step]);
    save();
    syncNavigation();
    if (progress.completed.length > previous) gameAudio.play(progress.status === "complete" ? "victory" : "beacon");
    if (progress.status === "complete") celebration();
  }
  function celebration() {
    if (work.querySelector(".zero-achievement")) return;
    const card = el("article", "zero-achievement");
    card.append(
      el("span", "eyebrow", "RESCUE CODER / CHAPTER COMPLETE"),
      el("h3", "", `${progress.robotName} made its first rescue!`),
      el(
        "p",
        "",
        "You gave instructions, stored text and numbers, predicted a result, changed a value and tested your own solution with two starting batteries.",
      ),
      el(
        "p",
        "",
        "Your robot and lessons are saved with this adventure. Save backup file in Menu keeps a copy on your computer. Your next city mission is waiting with your courier.",
      ),
      button("Meet my courier", host.mission, "button primary"),
      button("Tour the game controls", host.tour),
      button("Explore the city", host.leave),
    );
    work.append(card);
  }
  function go(index: number) {
    if (index < 0 || index >= BEGINNER_STEPS.length || index > progress.completed.length) return;
    if (running) host.cancelRun();
    scene.stop();
    running = false;
    generation++;
    progress.step = index;
    save();
    render();
  }
  function render() {
    const id = BEGINNER_STEPS[progress.step],
      lesson = FIRST_PROGRAM[id];
    panel.dataset.beginnerStep = id;
    hintCount = 0;
    speech.textContent = lesson.story;
    concept.textContent = lesson.concept;
    status.textContent = "Take your time. Every experiment is free; there is no countdown.";
    work.replaceChildren(el("h3", "", lesson.title), el("p", "zero-goal", lesson.goal));
    scene.update(
      {
        name: id === "transfer" ? "Relay" : progress.robotName,
        battery: id === "rescue" ? 3 : id === "transfer" ? 4 : 2,
        station: "dock",
        carrying: false,
        delivered: id === "transfer",
        other: id === "transfer",
      },
      id === "transfer"
        ? "Relay starts with 4 cells. The clinic already has your repair kit."
        : `${progress.robotName} is at the robot lab. Run this lesson to see what changes.`,
    );
    if (id === "instructions") instructions();
    else if (id === "investigate") investigate();
    else if (id === "predict" || id === "transfer") prediction(id === "transfer");
    else editor(id);
    const hint = el("p", "zero-hint");
    work.append(
      status,
      button(
        "Ask for a clue",
        () => {
          hint.textContent = `${host.courier}: ${lesson.hints[Math.min(hintCount++, lesson.hints.length - 1)]}`;
        },
        "button zero-clue",
      ),
      hint,
    );
    if (progress.status === "complete" && id === "transfer") celebration();
    syncNavigation();
  }
  function instructions() {
    const choices = el("div", "zero-command-choices"),
      list = el("ol", "zero-plan");
    list.setAttribute("aria-label", "Your robot instructions");
    const draw = () => {
      list.replaceChildren(
        ...progress.plan.map((command, index) => {
          const row = el("li");
          row.append(
            el("span", "", COMMANDS[command]),
            button(
              "↑",
              () => {
                if (!index) return;
                [progress.plan[index - 1], progress.plan[index]] = [command, progress.plan[index - 1]];
                save();
                draw();
              },
              "zero-card-action",
            ),
            button(
              "×",
              () => {
                progress.plan.splice(index, 1);
                save();
                draw();
              },
              "zero-card-action",
            ),
          );
          row.children[1].setAttribute("aria-label", `Move instruction ${index + 1} earlier`);
          (row.children[1] as HTMLButtonElement).disabled = index === 0;
          row.children[2].setAttribute("aria-label", `Remove instruction ${index + 1}`);
          return row;
        }),
      );
      for (const node of choices.querySelectorAll("button")) node.disabled = progress.plan.length >= 3;
    };
    for (const command of ["deliver", "move", "collect"] as const)
      choices.append(
        button(COMMANDS[command], () => {
          if (progress.plan.length < 3) progress.plan.push(command);
          save();
          draw();
        }),
      );
    const run = button(
      "Run instructions",
      () => {
        if (!progress.plan.length) {
          status.textContent = "Choose your first instruction card above.";
          return;
        }
        const result = runRobotPlan(progress.plan),
          token = generation;
        running = true;
        run.disabled = true;
        choices.inert = true;
        list.inert = true;
        syncNavigation();
        scene.play(result.frames, () => {
          if (!alive || token !== generation) return;
          running = false;
          run.disabled = false;
          choices.inert = false;
          list.inert = false;
          status.textContent = result.frames.at(-1)?.message ?? "Choose an instruction.";
          if (result.success) {
            status.textContent += " Order matters! Next, write your first real line of code.";
            complete();
          }
          syncNavigation();
        });
      },
      "button primary",
    );
    draw();
    work.append(choices, list, run);
  }
  function investigate() {
    const lines = batteryExampleBody(host.lang),
      listing = el("ol", "zero-trace"),
      value = el("p", "zero-trace-value");
    for (const line of lines) listing.append(el("li", "", line));
    let index = -1;
    const replay = button(
      "Step through next line",
      () => {
        index = Math.min(2, index + 1);
        for (const [i, line] of [...listing.children].entries()) line.classList.toggle("current", i === index);
        scene.update({ battery: index === 0 ? 2 : 5 });
        value.textContent = [
          "Store: battery now contains 2.",
          "Update: read 2, add 3, store 5. The battery label stays the same.",
          "Print: show the stored value 5 in output.",
        ][index];
        status.textContent =
          index === 2
            ? "What did += do to the stored value? Choose below."
            : "Follow the highlighted instruction and the battery meter.";
        replay.disabled = index === 2;
        for (const choice of answers.querySelectorAll("button")) choice.disabled = index < 2;
      },
      "button primary",
    );
    const answers = el("div", "zero-answers");
    for (const text of ["Replace it with 3", "Add to the stored value", "Change its name"])
      answers.append(
        button(text, () => {
          const correct = text === "Add to the stored value";
          status.textContent = correct
            ? "Exactly: += adds to what is already there. 2 becomes 5, and battery keeps its name."
            : "Look at the update: the original 2 is still part of 2 + 3 = 5. Try another answer.";
          if (correct) complete();
        }),
      );
    for (const choice of answers.querySelectorAll("button")) choice.disabled = true;
    work.append(
      el("p", "zero-note", "Guided replay of the working example you ran. Step at your own pace."),
      listing,
      replay,
      value,
      answers,
    );
  }
  function prediction(transfer: boolean) {
    const start = transfer ? 4 : 2,
      add = transfer ? 2 : 3;
    const body = batteryExampleBody(host.lang, start, add).join("\n"),
      code = wrapBeginnerProgram(host.lang, body);
    const choices = el("div", "zero-answers");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", "Predict robot energy");
    let picked: number | undefined;
    const run = button(
      "Run working example",
      () => {
        void execute(code, run, async (result) => {
          const value = readBatteryOutput(result.stdout);
          if (value !== start + add) {
            status.textContent = "The example returned an unexpected value. Try running it again.";
            return;
          }
          scene.update({ battery: value });
          status.textContent = `${picked === value ? "You predicted it!" : `You chose ${picked}; the program printed ${value}.`} ${start} + ${add} = ${value}. ${transfer && picked !== value ? "Think it through, choose again and rerun. No hearts were spent." : "The updated value is stored under battery."}`;
          if (!transfer || picked === value) complete();
        });
      },
      "button primary",
    );
    run.disabled = true;
    for (const number of transfer ? [2, 4, 6] : [2, 3, 5]) {
      const choice = button(`${number} cells`, () => {
        picked = number;
        for (const item of choices.querySelectorAll("button"))
          item.setAttribute("aria-pressed", String(item === choice));
        run.disabled = false;
      });
      choice.setAttribute("aria-pressed", "false");
      choices.append(choice);
    }
    work.append(el("pre", "zero-code-preview", body), choices, run);
  }
  function editor(id: BeginnerCodeStep) {
    const source = el("textarea", "zero-code"),
      label = el(
        "label",
        "zero-editor-label",
        id === "name" ? "Your robot name instruction" : "Your charging instruction",
      );
    source.setAttribute("aria-label", "Beginner code");
    source.spellcheck = false;
    source.rows = 3;
    source.maxLength = 16000;
    source.value = progress.drafts[id] ?? beginnerStarter(host.lang, id);
    source.placeholder =
      id === "rescue" ? "Write the instruction that adds the missing charge to battery" : "Edit this instruction";
    label.append(source);
    const full = el("details", "zero-full-program"),
      preview = el("pre", "zero-code-preview");
    full.append(el("summary", "", "See the whole program"), preview);
    const start = id === "rescue" ? 3 : 2;
    const update = () => {
      progress.drafts[id] = source.value;
      preview.textContent = beginnerProgram(host.lang, id, source.value, start);
      save();
    };
    source.addEventListener("input", update);
    preview.textContent = beginnerProgram(host.lang, id, source.value, start);
    const run = button(
      id === "rescue" ? "Test my rescue code" : "Run my code",
      () => {
        const submitted = source.value;
        void execute(
          beginnerProgram(host.lang, id, submitted, start),
          run,
          async (result) => {
            if (id === "name") {
              const name = result.stdout.trim();
              if (!isRobotName(name)) {
                status.textContent =
                  "Print one robot name using 1–16 letters, numbers, spaces or hyphens. Keep your text inside quotes.";
                return;
              }
              if (name === "Pixel") {
                status.textContent =
                  "The robot is called Pixel. Try choosing your own name by changing the text inside the quotes.";
                return;
              }
              progress.robotName = name;
              scene.update({ name }, `Your real program named the robot ${name}.`);
              status.textContent = `${name} it is! robotName stores your text, and the print instruction reads that stored value.`;
              complete();
              return;
            }
            const value = readBatteryOutput(result.stdout),
              goal = id === "charge" ? 8 : 10;
            scene.update({ battery: value ?? null });
            if (value !== goal) {
              status.textContent =
                value === undefined
                  ? "Print one whole battery value from 0 to 12. Look at your output and try again."
                  : `Your code produced ${value}; the goal is ${goal}. Start at ${start} and work out the missing charge. Unlimited retries.`;
              return;
            }
            if (id === "rescue") {
              status.textContent = "First robot: 3 → 10. Testing the same instruction with a starting value of 4…";
              const token = generation;
              const variation = await host.run(beginnerProgram(host.lang, id, submitted, 4));
              if (!alive || token !== generation) return;
              const error = executionError(variation);
              if (error) {
                status.textContent = error.message;
                return;
              }
              const alternate = readBatteryOutput(variation.stdout);
              const output = work.querySelector(".zero-output");
              if (output) output.textContent = `Starting at 3:\n${result.stdout}\nStarting at 4:\n${variation.stdout}`;
              if (alternate !== 11) {
                status.textContent = `Your instruction reached 10 from 3, but produced ${alternate ?? "unexpected output"} from 4. Add the missing charge to battery instead of replacing its value with 10.`;
                return;
              }
              scene.update(
                { station: "clinic", carrying: false, delivered: true },
                `${progress.robotName} delivered the repair kit. The clinic is back online!`,
              );
              status.textContent =
                "Rescue successful! Both checks passed: 3 → 10 and 4 → 11. You made a solution that works with a different starting value too.";
            } else
              status.textContent =
                "You changed the result! Starting at 2, your program reached 8. Now try a rescue with less help.";
            complete();
          },
          source,
        );
      },
      "button primary",
    );
    const note =
      host.lang === "java"
        ? "Edit the instruction above. We supply Main, the main method and the print line; expand the whole program to see them."
        : "Edit the instruction above. We supply the starting battery (when needed) and the print line. Expand the whole program to see exactly what runs.";
    work.append(label, el("p", "zero-note", note), full, run);
    source.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        run.click();
      }
    });
  }
  async function execute(
    code: string,
    run: HTMLButtonElement,
    apply: (result: RunResult) => Promise<void>,
    input?: HTMLTextAreaElement,
  ) {
    if (running || !alive) return;
    running = true;
    run.disabled = true;
    if (input) input.disabled = true;
    for (const choices of work.querySelectorAll<HTMLElement>(".zero-answers")) choices.inert = true;
    syncNavigation();
    let output = work.querySelector<HTMLElement>(".zero-output");
    if (!output) {
      output = el("pre", "zero-output");
      output.setAttribute("aria-label", "Beginner output");
      work.insertBefore(output, status);
    }
    output.textContent = "Starting your language… First startup can take a moment.";
    status.textContent = "Running your real program. Your city hearts and gems are safe.";
    const token = generation;
    try {
      const result = await host.run(code);
      if (!alive || token !== generation) return;
      const error = executionError(result);
      output.textContent = [result.stdout || "(No output)", result.stderr, error?.message].filter(Boolean).join("\n");
      if (error) {
        status.textContent = `${beginnerHint(error.message, host.lang)} You can edit and retry; no hearts were spent.`;
        return;
      }
      await apply(result);
    } catch {
      if (alive && token === generation)
        status.textContent = "The program couldn't finish. Try again, or save and come back. Your progress is kept.";
    } finally {
      if (alive && token === generation) {
        running = false;
        run.disabled = false;
        if (input) input.disabled = false;
        for (const choices of work.querySelectorAll<HTMLElement>(".zero-answers")) choices.inert = false;
        syncNavigation();
      }
    }
  }
  render();
  return () => {
    if (!alive) return;
    alive = false;
    generation++;
    scene.dispose();
    if (running) host.cancelRun();
  };
}
