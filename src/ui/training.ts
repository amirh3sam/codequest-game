import { MENU_TRAINING, TABLET_TRAINING, type TrainingChapter, trainingProgram } from "../content/training";
import { executionError } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { button, el } from "./dom";
import { type TrainingArtwork, trainingVisual } from "./training-visual";
import "./training.css";

type TrainingHost = {
  chapters: TrainingChapter[];
  initialChapter?: string;
  completed: readonly string[];
  lang: Lang;
  artwork: TrainingArtwork;
  autoDistricts: boolean;
  district: boolean;
  sample?: string;
  panel(): HTMLElement;
  run(code: string): Promise<RunResult>;
  cancelRun(): void;
  change(chapter: string, completed: string[]): void;
  automatic(value: boolean): void;
  finish(nextMission: boolean): void;
  skip(): void;
  replay(): void;
  briefing?(): void;
};

/** An isolated, paused teaching space. Only host.finish can return to a real mission. */
export function openTraining(host: TrainingHost): () => void {
  const panel = host.panel();
  panel.classList.add("training-shell");
  panel.parentElement?.classList.add("training-overlay");
  const layout = el("div", "training-layout"),
    contents = el("details", "training-contents"),
    summary = el("summary", "", "Training chapters");
  contents.open = matchMedia("(min-width: 900px)").matches;
  contents.append(summary);
  const nav = el("nav", "training-chapters");
  nav.setAttribute("aria-label", "Training chapters");
  contents.append(nav);
  const main = el("div", "training-main"),
    progress = el("p", "training-progress"),
    visual = trainingVisual(host.artwork),
    copy = el("div", "training-copy"),
    actions = el("div", "training-try"),
    footer = el("div", "training-footer");
  footer.setAttribute("role", "navigation");
  footer.setAttribute("aria-label", "Training navigation");
  const title = el("h3");
  title.tabIndex = -1;
  const body = el("div"),
    tip = el("p", "training-tip"),
    status = el("p", "training-status", "Try the controls. You can also move on at any time.");
  status.setAttribute("role", "status");
  copy.append(body, tip);
  const playback = el("div", "training-playback");
  let paused = false;
  const pause = button("Pause animation", () => {
    paused = !paused;
    visual.pause(paused);
    pause.textContent = paused ? "Play animation" : "Pause animation";
    pause.setAttribute("aria-pressed", String(paused));
  });
  pause.setAttribute("aria-pressed", "false");
  playback.append(
    pause,
    button("Replay animation", () => visual.replay()),
    el("span", "", "Interactive 2D preview · no adventure changes"),
  );
  main.append(progress, title, visual.canvas, playback, actions, status, copy);
  layout.append(contents, main);
  const preferences = el("div", "training-preferences"),
    automatic = el("input"),
    label = el("label");
  automatic.type = "checkbox";
  automatic.checked = host.autoDistricts;
  automatic.addEventListener("change", () => host.automatic(automatic.checked));
  label.append(automatic, document.createTextNode(" Show introductions when I enter a new district"));
  preferences.append(label);
  if (host.briefing || host.district)
    preferences.append(
      button(host.district ? "Full game handbook" : "This district's briefing", () =>
        host.district ? host.replay() : host.briefing?.(),
      ),
    );
  main.append(preferences);
  panel.append(layout, footer);
  let index = Math.max(
      0,
      host.chapters.findIndex((chapter) => chapter.id === host.initialChapter),
    ),
    generation = 0,
    disposed = false,
    running = false;
  const completed = new Set(host.completed);
  function say(message: string) {
    status.textContent = message;
    visual.draw();
  }
  function control(label: string, action: () => void) {
    const node = button(label, action);
    actions.append(node);
    return node;
  }
  function codeLesson() {
    const label = el("label", "training-editor-label", `Real ${host.lang} code · free training preview`),
      input = el("textarea", "training-code");
    input.setAttribute("aria-label", "Training code");
    input.spellcheck = false;
    input.value = host.sample ?? trainingProgram(host.lang);
    input.rows = host.lang === "java" ? 7 : 3;
    const output = el(
      "pre",
      "training-output",
      host.sample
        ? "Run this district's lesson example and inspect its output."
        : "Output will appear here. Expected: Signal ready",
    );
    output.setAttribute("aria-label", "Training output");
    label.append(input);
    actions.append(label, output);
    let correct = false;
    const token = generation;
    const run = control("Run training code", () => {
      void execute();
    });
    const submit = control("Submit training signal", () => {
      if (input.value !== lastCode || !correct) {
        say("Run code that prints exactly Signal ready first. This preview never spends hearts.");
        return;
      }
      visual.state.powered = true;
      completed.add(host.chapters[index].id);
      host.change(host.chapters[index].id, [...completed]);
      say(
        "Signal restored! In a real mission, Submit checks the goal and awards progress. Your adventure has not changed.",
      );
    });
    let lastCode = "";
    input.addEventListener("input", () => {
      correct = false;
    });
    async function execute() {
      if (running) return;
      running = true;
      run.disabled = true;
      submit.disabled = true;
      correct = false;
      output.textContent = "Starting the language runtime… The first run can take a moment.";
      lastCode = input.value;
      try {
        const result = await host.run(lastCode);
        if (disposed || token !== generation) return;
        const error = executionError(result);
        output.textContent = [result.stdout, result.stderr, error?.message].filter(Boolean).join("\n") || "(No output)";
        correct = !error && result.stdout.trim() === "Signal ready" && input.value === lastCode;
        say(
          host.sample
            ? error
              ? "Read the diagnostic, fix the example and try again. No hearts were spent."
              : "Lesson example executed. Compare its output with the concept above, then try changing the code."
            : correct
              ? "Your real program printed the expected signal. Try Submit training signal."
              : "Read the output, edit the code and run again. Expected: Signal ready. No hearts were spent.",
        );
      } catch (error) {
        if (!disposed && token === generation) {
          output.textContent = error instanceof Error ? error.message : "Unable to run. Try again.";
          say("The runtime could not finish. You can retry or continue training.");
        }
      } finally {
        if (!disposed && token === generation) {
          running = false;
          run.disabled = false;
          submit.disabled = false;
        }
      }
    }
    if (host.sample) submit.hidden = true;
  }
  function render(focus = false) {
    if (running) host.cancelRun();
    running = false;
    generation++;
    const chapter = host.chapters[index];
    host.change(chapter.id, [...completed]);
    progress.textContent = `${host.district ? "DISTRICT BRIEFING" : "DEVELOPER FIELD TRAINING"} · ${index + 1} / ${host.chapters.length} · Adventure paused`;
    title.textContent = chapter.title;
    body.replaceChildren(...chapter.body.map((value) => el("p", "", value)));
    tip.textContent = chapter.tip;
    visual.setScene(chapter.scene, chapter.title.toUpperCase());
    actions.replaceChildren();
    status.textContent = "Try the controls. You can also move on at any time.";
    const s = visual.state;
    s.powered = false;
    if (chapter.scene === "monitor") codeLesson();
    else if (chapter.id === "movement")
      control("Walk to the marker", () => {
        visual.move();
        say("Follow the dotted route around the lab. Try another spot or use arrows while the map preview is focused.");
      });
    else if (chapter.id === "courier")
      control("Talk to your courier", () => {
        s.powered = true;
        say(
          "Courier: First, create a training badge. Read the goal, run your code and inspect the output before you submit.",
        );
      });
    else if (chapter.id === "menus" || chapter.id === "tablet") {
      const entries = chapter.id === "tablet" ? TABLET_TRAINING : MENU_TRAINING;
      const description = el("p", "training-explanation");
      const choices = el("div", "training-choice-list");
      choices.setAttribute("role", "group");
      choices.setAttribute("aria-label", chapter.id === "tablet" ? "Explore tablet tabs" : "Explore game menus");
      const visited = new Set<number>();
      entries.forEach(([name, explanation], i) => {
        const choice = button(name, () => {
          for (const node of choices.querySelectorAll("button")) node.setAttribute("aria-pressed", "false");
          choice.setAttribute("aria-pressed", "true");
          visited.add(i);
          description.textContent = `${name}: ${explanation}`;
          s.tab = name;
          say(`${visited.size} / ${entries.length} tools explored. ${explanation}`);
        });
        choice.setAttribute("aria-pressed", "false");
        choices.append(choice);
      });
      actions.append(choices, description);
      (choices.firstElementChild as HTMLButtonElement)?.click();
    } else if (chapter.id === "files") {
      let selected = false;
      control("Select src folder", () => {
        selected = true;
        say("src is selected. New items will be created inside it; its arrow only expands/collapses the tree.");
      });
      control("Create preview file", () => {
        if (!selected) {
          say("Select src first so you know where the file will go.");
          return;
        }
        s.file =
          host.lang === "java"
            ? "Player.java"
            : host.lang === "python"
              ? "player.py"
              : host.lang === "typescript"
                ? "player.ts"
                : "player.js";
        say(`Created src/${s.file} in the preview. In the real Explorer, type a name and press Enter.`);
      });
      control("Rename preview file", () => {
        s.file = host.lang === "java" ? "Developer.java" : "developer";
        say(
          "Renaming updates the selected entry. In your project, also update code/imports that refer to the old name.",
        );
      });
      control("Close preview file ×", () => {
        s.file = "No open file";
        say("Closing a tab keeps its file. Delete removes the entry; Export project keeps a backup.");
      });
    } else if (chapter.scene === "map") {
      control("Locate Task 1", () => {
        s.text = "TASK 1 · START HERE";
        say("Start with Task 1. A completed task unlocks the next terminal, until all eight are ready for the boss.");
      });
      control("Complete preview boss", () => {
        s.unlocked = true;
        say("The next district is now unlocked in this preview. Your real tasks and boss are unchanged.");
      });
      control("Use preview transit", () => {
        if (!s.unlocked) {
          say(
            "You can always return to an already unlocked district. Finish the preview boss to demonstrate unlocking a new one.",
          );
          return;
        }
        s.text = "ARRIVED BESIDE THE NEXT TRANSIT";
        say(
          "Choose an unlocked world-map card to travel. The developer arrives beside that district's transit, ready to explore.",
        );
      });
    } else if (chapter.id === "lighting") {
      const target = el("select");
      target.setAttribute("aria-label", "Training light target");
      for (const name of ["All routes", ...Array.from({ length: 8 }, (_, i) => `Task ${i + 1}`)]) {
        const option = el("option", "", name);
        target.append(option);
      }
      target.addEventListener("change", () => {
        s.circuit = target.value;
        say(`${s.circuit} selected. The real Lighting console runs code for this target.`);
      });
      actions.append(target);
      for (const [name, color] of [
        ["Blue", "#67dffa"],
        ["Green", "#78edab"],
        ["Red", "#ff879b"],
        ["White", "#fff"],
        ["Yellow", "#ffe08b"],
        ["Purple", "#b6a0ff"],
      ])
        control(name, () => {
          s.color = color;
          s.lights = true;
          say(
            `Preview: ${s.circuit} online, ${name.toLowerCase()}. In Lighting, print the color and online/offline with your code.`,
          );
        });
      control("Toggle online / offline", () => {
        s.lights = !s.lights;
        say(`Preview: ${s.circuit} ${s.lights ? "online" : "offline"}. Use code to apply it to the real map.`);
      });
    } else if (chapter.id === "arcade") {
      control("Jump glitch", () => {
        s.jump = 1;
        say(
          "Packet Dash: jump with Space, Up or the touch Jump button. Collect bits and avoid glitches. The arcade has its own pause/resume.",
        );
      });
      control("Drop relay", () => {
        s.tower = Math.min(8, s.tower + 1);
        say(
          "Signal Stack: time a drop to overlap the previous relay. Reach 14 in the real game. This small preview has no score or rewards.",
        );
      });
    } else if (chapter.id === "saves") {
      s.saved = false;
      s.browserLost = false;
      s.loaded = false;
      s.projectSaved = false;
      control("Preview: Save backup file", () => {
        if (s.browserLost) {
          say(
            "The preview's browser save is already gone. Reset this demonstration first, then download a backup before clearing data.",
          );
          return;
        }
        s.saved = true;
        s.loaded = false;
        say(
          "Preview backup saved to the hard drive. In the real game, Menu → Save backup file downloads a .json to Downloads or your chosen folder. Save again after each session: this file is a snapshot, not an automatically updated save.",
        );
      });
      control("Preview: Clear browser data", () => {
        s.browserLost = true;
        s.loaded = false;
        say(
          s.saved
            ? "Only the preview's browser data was cleared. The .json backup on disk is still safe! Use Load backup file to restore that saved moment. Your real adventure is untouched."
            : "Only the preview's browser data was cleared. Without a downloaded backup, this demo has nothing to restore. Reset, save to disk, then try again. Your real adventure is untouched.",
        );
      });
      control("Preview: Load backup file", () => {
        if (!s.saved) {
          say(
            "There is no backup file in this preview yet. Reset the demonstration, then use Save backup file before browser data is lost.",
          );
          return;
        }
        s.browserLost = false;
        s.loaded = true;
        say(
          "Preview progress restored from the hard-drive backup! In the real game, Menu → Load backup file lets you select the saved .json and adds a separate adventure. It restores the saved moment, without overwriting your other characters.",
        );
      });
      control("Reset save demonstration", () => {
        s.saved = false;
        s.browserLost = false;
        s.loaded = false;
        s.projectSaved = false;
        say(
          "Preview reset. Try saving a backup, clearing the preview's browser data, then loading from disk. These buttons never change real saves or download files.",
        );
      });
      for (const [name, explanation] of [
        [
          "Export project",
          "Tablet → Code → Export project downloads the coding file tree separately. Import project restores those files.",
        ],
        [
          "Switch adventure",
          "Menu → Switch adventure shows each named adventure and language. Resume one or start another; each has its own progress.",
        ],
      ])
        control(`Preview: ${name}`, () => {
          if (name === "Export project") s.projectSaved = true;
          say(explanation);
        });
    } else if (chapter.id === "comfort") {
      control("Preview high contrast", () => {
        s.contrast = !s.contrast;
        say(
          "Higher contrast separates text and controls. Change your real preference in Menu → Accessibility & controls.",
        );
      });
      control("Preview larger text", () => {
        copy.classList.toggle("training-large");
        say("Larger text helps reading. The real setting applies throughout the game.");
      });
      control("Explain sound controls", () =>
        say(
          "Sound mutes effects quickly; Menu has a volume slider. Your device must allow audio. You can play every mission with sound muted.",
        ),
      );
    } else
      control("Connect the training relay", () => {
        s.powered = true;
        s.color = "#8aefbf";
        say("Connection restored. Learn a concept, try real code and repair the city, at your own pace.");
      });
    nav.replaceChildren(
      ...host.chapters.map((entry, i) => {
        const node = button(
          `${completed.has(entry.id) ? "✓" : String(i + 1).padStart(2, "0")}  ${entry.title}`,
          () => {
            index = i;
            if (matchMedia("(max-width: 899px)").matches) contents.open = false;
            render(true);
          },
          "training-chapter",
        );
        if (i === index) node.setAttribute("aria-current", "step");
        return node;
      }),
    );
    footer.replaceChildren();
    const back = button("Back", () => {
      index--;
      render(true);
    });
    back.disabled = index === 0;
    footer.append(back, button("Skip training", host.skip));
    if (index < host.chapters.length - 1)
      footer.append(
        button(
          "Next chapter",
          () => {
            completed.add(chapter.id);
            index++;
            render(true);
          },
          "button primary",
        ),
      );
    else {
      footer.append(
        button(
          "Finish training",
          () => {
            completed.add(chapter.id);
            host.change(chapter.id, [...completed]);
            host.finish(false);
          },
          "button primary",
        ),
      );
      if (!host.district)
        footer.append(
          button("Start my next mission", () => {
            completed.add(chapter.id);
            host.change(chapter.id, [...completed]);
            host.finish(true);
          }),
        );
    }
    visual.draw();
    if (focus) {
      title.focus({ preventScroll: true });
      main.scrollTop = 0;
    }
  }
  render();
  return () => {
    disposed = true;
    generation++;
    if (running) host.cancelRun();
    visual.destroy();
    panel.parentElement?.classList.remove("training-overlay");
  };
}
