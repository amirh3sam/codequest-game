import { BEACON_EVENTS } from "../content/community-beacon";
import { dronePilot } from "../content/drone-pilot";
import { isAreaAvailable, loadArea, loadVariables } from "../content/loader";
import type { AreaContent, Boss, Task } from "../content/schema";
import village from "../content/village.json" with { type: "json" };
import { canLightBeacon, lightBeacon } from "../core/discoveries";
import { DRONE_TASK_ID, isDroneRepaired, readBatteryOutput } from "../core/drone-mission";
import { GEM_REWARD, isValidHeroName } from "../core/rules";
import { loadGame, saveGame } from "../core/save";
import {
  applySubmissionFailure,
  buyNextHint,
  canFightBoss,
  canSolveTask,
  createGame,
  defeatBoss,
  discoverLesson,
  enterArea,
  type GameState,
  isAreaUnlocked,
  type Position,
  solveTask,
} from "../core/state";
import { SPRITES } from "../game/assets";
import { gameAudio } from "../game/audio";
import type { BootScene, VillageCallbacks } from "../game/scenes/BootScene";
import { executionError, grade } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { WorkerHost } from "../runners/worker-host";
import { openCommunityBeacon } from "./community-beacon";
import { button, el } from "./dom";
import { batteryCard, openDroneLesson } from "./drone-lesson";
import { openTablet } from "./tablet";

const now = () => new Date().toISOString();
const LANGUAGES: { id: Lang; name: string; badge: string; description: string }[] = [
  { id: "javascript", name: "JavaScript", badge: "JS", description: "The language of the web" },
  { id: "python", name: "Python", badge: "Py", description: "Readable, friendly first steps" },
  { id: "typescript", name: "TypeScript", badge: "TS", description: "JavaScript with helpful types" },
  { id: "java", name: "Java", badge: "Jv", description: "Build with types and classes" },
];

export class GameApp {
  private scene: BootScene;
  private state: GameState | null = null;
  private area: AreaContent = loadVariables("javascript");
  private runner: WorkerHost | null = null;
  private lang: Lang = "javascript";
  private heroKind: "boy" | "girl" = "girl";
  private heroName = "Ada";
  private hud = el("header", "hud");
  private overlay = el("div", "overlay");
  private notice = el("div", "toast");
  private saved = el("span", "save-state");
  private savingAllowed = true;
  private busy = false;
  private runToken = 0;
  private toastTimer = 0;
  private tabletCleanup: (() => void) | null = null;
  private tabletNavigation = false;
  private callbacks: VillageCallbacks = {
    interact: (id) => this.interact(id),
    position: (position) => this.storePosition(position),
    message: (text) => this.toast(text),
  };
  constructor(root: HTMLElement, scene: BootScene) {
    gameAudio.init();
    this.scene = scene;
    this.notice.setAttribute("role", "status");
    this.notice.setAttribute("aria-live", "polite");
    root.replaceChildren(this.hud, this.overlay, this.notice);
    window.addEventListener("keydown", (event) => {
      if (
        event.code === "KeyT" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        !event.repeat &&
        this.state &&
        this.overlay.hidden &&
        !document.activeElement?.matches("input,textarea,select")
      ) {
        event.preventDefault();
        this.tablet();
      }
      if (event.key === "Escape" && this.state) {
        event.preventDefault();
        if (this.overlay.hidden) this.pause();
        else this.close();
      }
      if (
        this.overlay.hidden &&
        !document.activeElement?.matches("textarea,input") &&
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(event.key)
      )
        event.preventDefault();
      if (!this.overlay.hidden && event.key === "Tab") {
        const nodes = [
          ...this.overlay.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input, textarea:not(:disabled), select, [tabindex="0"]',
          ),
        ].filter((node) => node.getClientRects().length > 0 && node.tabIndex >= 0);
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (
          first &&
          last &&
          ((event.shiftKey && document.activeElement === first) || (!event.shiftKey && document.activeElement === last))
        ) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    });
    window.addEventListener("pagehide", () => {
      this.tabletCleanup?.();
      this.capturePosition();
    });
    const latest = LANGUAGES.map(({ id }) => loadGame(id))
      .filter((result) => result.status === "loaded")
      .sort((a, b) => Date.parse(b.state.updatedAt) - Date.parse(a.state.updatedAt))[0];
    if (latest?.status === "loaded") this.lang = latest.state.lang;
    this.intro();
  }
  getState(): GameState | null {
    return this.state;
  }
  private icon(name: keyof typeof SPRITES, portrait = false): HTMLCanvasElement {
    const canvas = el("canvas", "sprite");
    if (name === "heroBoy" || name === "heroGirl") canvas.classList.add("developer-sprite");
    const sprite = SPRITES[name],
      frame = this.scene.textures.getFrame(sprite.texture, sprite.frame);
    const crop = portrait
      ? { x: 18, y: 3, width: 60, height: 66 }
      : { x: 0, y: 0, width: frame.cutWidth, height: frame.cutHeight };
    canvas.width = crop.width;
    canvas.height = crop.height;
    canvas
      .getContext("2d")
      ?.drawImage(
        frame.source.image as CanvasImageSource,
        frame.cutX + crop.x,
        frame.cutY + crop.y,
        crop.width,
        crop.height,
        0,
        0,
        crop.width,
        crop.height,
      );
    canvas.setAttribute("aria-hidden", "true");
    return canvas;
  }
  private panel(title: string, subtitle = "", wide = false): HTMLElement {
    this.tabletCleanup?.();
    this.tabletCleanup = null;
    if (this.busy) {
      this.runToken++;
      this.runner?.kill();
      this.busy = false;
    }
    this.scene.previewDrone();
    this.scene.setBlocked(true);
    this.overlay.classList.remove("title-overlay", "tablet-overlay");
    this.overlay.hidden = false;
    const panel = el("section", `panel${wide ? " panel-wide" : ""}`);
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-modal", "true");
    const heading = el("h2", "", title);
    heading.id = "dialog-title";
    panel.setAttribute("aria-labelledby", heading.id);
    const head = el("div", "panel-heading");
    head.append(heading);
    if (this.tabletNavigation) {
      panel.classList.add("tablet-shell", "tablet-task-view");
      this.overlay.classList.add("tablet-overlay");
      head.append(button("Tablet home", () => this.tablet(false)));
    }
    if (this.state) {
      const close = button("×", () => this.close(), "close-button");
      close.setAttribute("aria-label", "Close panel");
      head.append(close);
    }
    panel.append(head);
    if (subtitle) panel.append(el("p", "subtitle", subtitle));
    this.overlay.replaceChildren(panel);
    queueMicrotask(() => {
      if (panel.isConnected) panel.querySelector<HTMLElement>("button,input,textarea")?.focus();
    });
    return panel;
  }
  private intro(): void {
    this.tabletNavigation = false;
    this.runToken++;
    this.runner?.kill();
    this.state = null;
    this.hud.hidden = true;
    this.scene.setSession(null, null, this.callbacks);
    const panel = this.panel(
      "Your next build starts here",
      "Grab your laptop. Master your code. Bring the city network online.",
      true,
    );
    panel.classList.add("intro");
    this.overlay.classList.add("title-overlay");
    const artwork = el("div", "intro-art");
    artwork.setAttribute("aria-hidden", "true");
    artwork.append(el("span", "art-orbit orbit-one"), el("span", "art-orbit orbit-two"), el("span", "art-code", "{ }"));
    const hero = this.icon(this.heroKind === "girl" ? "heroGirl" : "heroBoy");
    hero.classList.add("art-hero");
    const gem = this.icon("gem");
    gem.classList.add("art-gem");
    const scroll = this.icon("scroll");
    scroll.classList.add("art-scroll");
    artwork.append(
      el("span", "art-platform"),
      hero,
      gem,
      scroll,
      el("span", "art-spark spark-one", "✦"),
      el("span", "art-spark spark-two", "✧"),
    );
    const wordmark = el("div", "wordmark");
    wordmark.append(el("span", "brand-rune", "</>"), el("span", "", "Code"), el("span", "wordmark-accent", "Quest"));
    panel.prepend(wordmark, el("span", "eyebrow", "BUILD SKILLS. EXPLORE THE CITY."), artwork);
    panel.append(el("h3", "section-label", "1 · Choose your language"));
    const choices = el("div", "language-grid");
    for (const language of LANGUAGES) {
      const card = button(
        "",
        () => {
          this.lang = language.id;
          this.intro();
        },
        `choice${this.lang === language.id ? " selected" : ""}`,
      );
      card.setAttribute("aria-pressed", String(this.lang === language.id));
      card.dataset.language = language.id;
      const badge = el("span", "language-badge", language.badge);
      badge.setAttribute("aria-hidden", "true");
      card.append(badge, el("strong", "", language.name), el("span", "language-description", language.description));
      choices.append(card);
    }
    panel.append(choices);
    const existing = loadGame(this.lang);
    if (existing.status === "loaded") {
      const saved = el("div", "saved-adventure");
      saved.append(
        el(
          "div",
          "",
          `${existing.state.hero.name}'s adventure · ${existing.state.areas[existing.state.currentArea].solved.length}/8 tasks`,
        ),
        button("Continue adventure", () => this.begin(existing.state), "button primary"),
      );
      panel.append(saved);
    } else if (existing.status === "corrupt" || existing.status === "unsupported-version")
      panel.append(
        el("p", "warning", "This saved adventure couldn't be read. Starting new will replace it after confirmation."),
      );
    else if (existing.status === "storage-error")
      panel.append(el("p", "warning", "Browser saving is unavailable. You can still play this session."));
    panel.append(el("h3", "section-label", "2 · Make it your adventure"));
    const form = el("form", "hero-form"),
      heroes = el("div", "hero-choices");
    for (const kind of ["girl", "boy"] as const) {
      const choice = button(
        "",
        () => {
          this.heroKind = kind;
          this.intro();
        },
        `hero-choice${this.heroKind === kind ? " selected" : ""}`,
      );
      choice.setAttribute("aria-label", `${kind === "girl" ? "Girl" : "Boy"} hero`);
      choice.setAttribute("aria-pressed", String(this.heroKind === kind));
      choice.append(this.icon(kind === "girl" ? "heroGirl" : "heroBoy"));
      choice.append(el("span", "hero-label", kind === "girl" ? "Girl" : "Boy"));
      heroes.append(choice);
    }
    const naming = el("div", "naming"),
      label = el("label", "", "Developer name"),
      input = el("input");
    input.id = "hero-name";
    label.htmlFor = input.id;
    input.value = this.heroName;
    input.maxLength = 32;
    input.autocomplete = "off";
    const start = button(
      existing.status === "loaded" ? "Start a new adventure" : "Start adventure",
      () => {},
      "button primary start-button",
    );
    start.type = "submit";
    start.disabled = !isValidHeroName(input.value);
    input.addEventListener("input", () => {
      this.heroName = input.value;
      start.disabled = !isValidHeroName(input.value);
    });
    const field = el("div", "name-field");
    field.append(
      input,
      button(
        "⚄",
        () => {
          this.heroName = village.heroNames[Math.floor(Math.random() * village.heroNames.length)] ?? "Ada";
          input.value = this.heroName;
          start.disabled = false;
        },
        "dice-button",
      ),
    );
    field.lastElementChild?.setAttribute("aria-label", "Random hero name");
    naming.append(label, field, el("small", "", "1–16 letters, numbers or spaces"));
    form.append(heroes, naming, start);
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!isValidHeroName(this.heroName)) return;
      if (
        ["loaded", "corrupt", "unsupported-version"].includes(existing.status) &&
        !window.confirm("Start a new adventure? This will replace the saved game for this language.")
      )
        return;
      this.savingAllowed = existing.status !== "storage-error";
      this.begin(createGame(this.lang, { kind: this.heroKind, name: this.heroName.trim() }, now()));
    });
    panel.append(
      form,
      el("p", "intro-footer", "Your character and progress save in this browser · No account needed"),
      this.soundToggle(),
    );
  }
  private begin(state: GameState): void {
    if (!isAreaAvailable(state.currentArea)) state = enterArea(state, "variables", now());
    const area = loadArea(state.lang, state.currentArea);
    if (
      village.worldAreas.some(
        ({ id }) =>
          isAreaAvailable(id as GameState["currentArea"]) &&
          !state.areas[id as GameState["currentArea"]].solved.every(
            (taskId, index) => loadArea(state.lang, id as GameState["currentArea"]).tasks[index]?.id === taskId,
          ),
      )
    ) {
      this.toast("This save doesn't match the district tasks. Choose Start new to replace it.");
      return;
    }
    this.runner?.kill();
    this.runner = new WorkerHost(state.lang);
    this.lang = state.lang;
    this.area = area;
    this.hud.hidden = false;
    this.commit(state);
    this.close();
    this.runner.warmup().catch(() => this.toast("The language runtime couldn't load. Run your code to retry."));
    this.toast("Welcome! Use WASD or arrows to walk. Press E near the guide or a terminal.");
  }
  private persist(): void {
    if (!this.state) return;
    const result = this.savingAllowed ? saveGame(this.state) : { status: "storage-error" };
    this.saved.textContent =
      result.status === "saved" ? "✓ Saved on this device" : "Saving unavailable · progress stays in this session";
  }
  private commit(state: GameState): void {
    this.state = state;
    this.area = loadArea(state.lang, state.currentArea);
    this.scene.setSession(state, this.area, this.callbacks);
    this.renderHud();
    this.persist();
  }
  private storePosition(position: Position): void {
    if (!this.state) return;
    this.state = { ...this.state, position, updatedAt: now() };
    this.persist();
  }
  private capturePosition(): void {
    if (this.state) this.storePosition(this.scene.getPosition());
  }
  private soundToggle(): HTMLButtonElement {
    const toggle = button(
      "",
      () => {
        gameAudio.setMuted(!gameAudio.muted);
        for (const control of document.querySelectorAll<HTMLButtonElement>(".sound-toggle")) refresh(control);
      },
      "button sound-toggle",
    );
    const refresh = (node: HTMLButtonElement) => {
      node.textContent = gameAudio.muted ? "Sound off" : "Sound on";
      node.setAttribute("aria-label", gameAudio.muted ? "Enable sound effects" : "Mute sound effects");
      node.setAttribute("aria-pressed", String(!gameAudio.muted));
    };
    refresh(toggle);
    return toggle;
  }
  private renderHud(): void {
    if (!this.state) return;
    const state = this.state,
      progress = state.areas[this.area.id];
    const identity = el("div", "identity");
    const portrait = el("div", "hero-portrait");
    portrait.append(this.icon(state.hero.kind === "girl" ? "heroGirl" : "heroBoy", true));
    identity.append(portrait);
    const name = el("div");
    name.append(
      el("strong", "hero-name", state.hero.name),
      el("span", "language-name", LANGUAGES.find((lang) => lang.id === state.lang)?.name),
    );
    identity.append(name);
    const stats = el("div", "stats"),
      hearts = el("span", "hearts", "♥".repeat(progress.hearts) + "♡".repeat(3 - progress.hearts));
    hearts.setAttribute("aria-label", `${progress.hearts} hearts`);
    hearts.dataset.testid = "hearts";
    const gems = el("span", "gems", `◆ ${progress.gems}`);
    gems.dataset.testid = "gems";
    stats.append(hearts, gems, el("span", "task-count", `${progress.solved.length}/8 tasks`));
    const actions = el("nav", "hud-actions");
    actions.append(button("Tablet", () => this.tablet()));
    if (this.area.id === "variables") actions.append(button("Mission", () => this.mission()));
    actions.append(
      button("Lesson", () => this.lesson()),
      button("Tasks", () => this.journal()),
      button("Menu", () => this.pause()),
      this.soundToggle(),
    );
    const objective = el("div", "objective");
    objective.append(
      el("span", "eyebrow", "✦  YOUR NEXT QUEST"),
      el(
        "strong",
        "",
        progress.bossDefeated
          ? "The district is online. Well played!"
          : progress.solved.length === 8
            ? `${this.area.boss.name} is ready. Visit the data hub!`
            : this.area.id === "variables" && !isDroneRepaired(state)
              ? "Help Kai launch the delivery drone · Mission"
              : `Next: ${this.area.tasks[progress.solved.length]?.title ?? "Explore the district"}`,
      ),
    );
    const meter = el("div", "quest-meter");
    meter.setAttribute("role", "progressbar");
    meter.setAttribute("aria-label", "District tasks completed");
    meter.setAttribute("aria-valuemin", "0");
    meter.setAttribute("aria-valuemax", "8");
    meter.setAttribute("aria-valuenow", String(progress.solved.length));
    for (let i = 0; i < 8; i++) meter.append(el("span", i < progress.solved.length ? "complete" : ""));
    objective.append(meter);
    const location = el("div", "location-banner");
    location.append(
      el("span", "eyebrow", `DISTRICT ${String(this.area.order).padStart(2, "0")}`),
      el("span", "location-name", this.area.name),
    );
    const footer = el("div", "game-footer");
    this.saved = el("span", "save-state");
    footer.append(
      el("span", "", "WASD / Arrows · Move     E / Space · Interact     T · Tablet     Esc · Menu"),
      this.saved,
    );
    this.hud.replaceChildren(identity, stats, actions, objective, location, footer);
  }
  private close(): void {
    this.tabletNavigation = false;
    this.tabletCleanup?.();
    this.tabletCleanup = null;
    this.overlay.classList.remove("tablet-overlay");
    if (this.busy) {
      this.runToken++;
      this.runner?.kill();
      this.busy = false;
    }
    this.overlay.hidden = true;
    this.overlay.replaceChildren();
    this.scene.previewDrone();
    this.scene.setBlocked(false);
    this.capturePosition();
  }
  private toast(text: string): void {
    clearTimeout(this.toastTimer);
    this.notice.textContent = text;
    this.notice.classList.add("visible");
    this.toastTimer = window.setTimeout(() => this.notice.classList.remove("visible"), 4400);
  }
  private interact(id: string): void {
    if (!this.state) return;
    gameAudio.play("open");
    if (id === "courier") this.mission();
    else if (id === "discovery-beacon") this.communityBeacon();
    else if (id === "lesson") this.lesson();
    else if (id === "boss") {
      if (canFightBoss(this.state, this.area)) this.editor(this.area.boss);
      else
        this.toast(
          this.state.areas[this.area.id].bossDefeated
            ? `You already cleared ${this.area.boss.name}!`
            : `Complete all eight terminals to challenge ${this.area.boss.name}.`,
        );
    } else {
      const task = this.area.tasks.find((entry) => entry.id === id);
      if (task && canSolveTask(this.state, this.area, id)) this.editor(task);
      else
        this.toast(
          this.state.areas[this.area.id].solved.includes(id)
            ? "Already solved! Find the next numbered task."
            : "Solve the earlier tasks to unlock this one.",
        );
    }
  }
  private mission(): void {
    if (!this.state || this.area.id !== "variables") return;
    this.capturePosition();
    if (!this.state.areas.variables.solved.includes("variables-1")) {
      const panel = this.panel(
        "Kai · A delivery worth debugging",
        "A stranded drone. A city lane waiting for your code.",
      );
      panel.classList.add("drone-lesson");
      const portrait = el("div", "courier-intro");
      portrait.append(this.icon("heroBoy", true), el("p", "lesson-body", dronePilot.intro));
      panel.append(
        portrait,
        el("p", "lesson-body", dronePilot.goal),
        el("p", "lesson-feedback explained", dronePilot.badge),
      );
      const badge = this.area.tasks[0];
      if (badge) panel.append(button("Create the training badge", () => this.editor(badge), "button primary"));
      panel.append(button("Look around the city", () => this.close()));
      return;
    }
    openDroneLesson({
      lang: this.lang,
      panel: (title, subtitle, wide) => this.panel(title, subtitle, wide),
      run: (code) => this.practice(code),
      preview: (value) => this.scene.previewDrone(value),
      build: () => {
        const repair = this.area.tasks.find((task) => task.id === DRONE_TASK_ID);
        if (repair) this.editor(repair, true);
      },
      close: () => this.close(),
      delivered: isDroneRepaired(this.state),
      canLaunch: this.scene.canLaunchDrone(),
      launch: () => {
        this.close();
        this.scene.launchDrone();
      },
    });
  }
  private communityBeacon(): void {
    if (!this.state || this.area.id !== "variables") return;
    this.capturePosition();
    openCommunityBeacon({
      lang: this.lang,
      choice: this.state.discoveries?.beacon,
      available: canLightBeacon(this.state),
      panel: (title, subtitle, wide) => this.panel(title, subtitle, wide),
      run: (code) => this.practice(code),
      activate: (choice) => {
        if (this.state) this.commit(lightBeacon(this.state, choice, now()));
        gameAudio.play("beacon");
      },
      courier: () => this.mission(),
      close: () => this.close(),
    });
  }
  private async practice(code: string): Promise<RunResult> {
    if (!this.runner || this.busy) throw new Error("A program is already running.");
    this.busy = true;
    const token = ++this.runToken;
    try {
      const result = await this.runner.run(code);
      if (token === this.runToken) gameAudio.play(executionError(result) ? "error" : "success");
      return result;
    } finally {
      if (token === this.runToken) this.busy = false;
    }
  }
  private tablet(animate = true): void {
    if (!this.state) return;
    gameAudio.play("open");
    this.tabletNavigation = false;
    this.capturePosition();
    const progress = this.state.areas[this.area.id];
    this.tabletCleanup = openTablet({
      lang: this.lang,
      name: this.state.hero.name,
      kind: this.state.hero.kind,
      animate,
      focusCamera: () => this.scene.focusTablet(),
      panel: (title, subtitle, wide) => this.panel(title, subtitle, wide),
      run: (code) => this.practice(code),
      district: this.area.name,
      hearts: progress.hearts,
      gems: progress.gems,
      guide: this.area.lesson.pages,
      discovery:
        this.area.id === "variables"
          ? {
              title: "Community beacon",
              status: this.state.discoveries?.beacon
                ? `Signal Maker · ${BEACON_EVENTS[this.state.discoveries.beacon].title} is on air`
                : canLightBeacon(this.state)
                  ? "A message from Mina is waiting beyond the courier lane."
                  : "Help Kai repair the drone to reconnect the courtyard.",
              open: () => {
                this.tabletNavigation = true;
                this.communityBeacon();
              },
            }
          : undefined,
      missions: this.area.tasks.map((task) => ({
        title: task.title,
        prompt: task.prompt,
        status: progress.solved.includes(task.id)
          ? "complete"
          : this.state && canSolveTask(this.state, this.area, task.id)
            ? "available"
            : "locked",
        open: () => {
          this.tabletNavigation = true;
          this.editor(task);
        },
      })),
      story:
        this.area.id === "variables"
          ? () => {
              this.tabletNavigation = true;
              this.mission();
            }
          : undefined,
    });
  }
  private lesson(page = 0): void {
    if (!this.state) return;
    this.capturePosition();
    this.commit(discoverLesson(this.state, now()));
    const panel = this.panel(this.area.lesson.title, `Lesson ${page + 1} of ${this.area.lesson.pages.length}`),
      content = this.area.lesson.pages[page];
    if (!content) return;
    panel.append(el("h3", "", content.heading), el("p", "lesson-body", content.body));
    if (content.code) panel.append(el("pre", "code-example", content.code));
    const actions = el("div", "panel-actions");
    if (page > 0) actions.append(button("Previous", () => this.lesson(page - 1)));
    actions.append(
      page + 1 < this.area.lesson.pages.length
        ? button("Next page", () => this.lesson(page + 1), "button primary")
        : button("Back to the district", () => this.close(), "button primary"),
    );
    panel.append(actions);
  }
  private journal(): void {
    if (!this.state) return;
    this.capturePosition();
    const panel = this.panel("District missions", "Solve them in order. Each correct answer earns gems.");
    if (this.area.id === "variables")
      panel.append(button("Courier mission · Launch the drone", () => this.mission(), "button mission-link"));
    if (this.area.id === "variables")
      panel.append(
        button("Optional discovery · Community beacon", () => this.communityBeacon(), "button mission-link"),
      );
    for (const [index, task] of this.area.tasks.entries()) {
      const solved = this.state.areas[this.area.id].solved.includes(task.id),
        available = canSolveTask(this.state, this.area, task.id);
      const row = button(
        `${solved ? "✓" : available ? "→" : "🔒"} ${index + 1}. ${task.title}`,
        () => this.editor(task),
        `task-row${solved ? " solved" : ""}`,
      );
      row.disabled = !available;
      panel.append(row);
    }
    if (canFightBoss(this.state, this.area))
      panel.append(button(`Challenge ${this.area.boss.name}`, () => this.editor(this.area.boss), "button primary"));
  }
  private pause(): void {
    if (!this.state) return;
    this.capturePosition();
    const panel = this.panel("Take a breath", "Your adventure is saved on this device.");
    const actions = el("div", "menu-actions");
    actions.append(
      button("Resume adventure", () => this.close(), "button primary"),
      button("World map", () => this.worldMap()),
      button("Read the lesson", () => this.lesson()),
      button("Title screen", () => this.intro()),
    );
    panel.append(actions);
  }
  private worldMap(): void {
    if (!this.state) return;
    const panel = this.panel("Your journey", "Bring Variable District online to open the network ahead.", true),
      nodes = el("div", "world-nodes");
    for (const [index, area] of village.worldAreas.entries()) {
      const id = area.id as GameState["currentArea"],
        unlocked = isAreaUnlocked(this.state, id),
        completed = this.state.areas[id].bossDefeated;
      const node = button(
        "",
        () => {
          if (this.state) {
            this.commit(enterArea(this.state, id, now()));
            this.close();
          }
        },
        `world-node${unlocked ? " unlocked" : ""}`,
      );
      node.disabled = !isAreaAvailable(id) || !unlocked;
      node.append(
        el("span", "world-number", completed ? "✓" : unlocked ? String(index + 1) : "🔒"),
        el("strong", "", area.name),
        el(
          "small",
          "",
          !unlocked ? "Defeat the previous boss" : isAreaAvailable(id) ? "Explore district" : "Unlocked · coming next",
        ),
      );
      nodes.append(node);
    }
    panel.append(nodes);
  }
  private draft(task: Task | Boss, code: string): void {
    if (!this.state) return;
    const progress = this.state.areas[this.area.id];
    this.state = {
      ...this.state,
      updatedAt: now(),
      areas: { ...this.state.areas, [this.area.id]: { ...progress, drafts: { ...progress.drafts, [task.id]: code } } },
    };
    this.persist();
  }
  private editor(task: Task | Boss, droneTraining = false): void {
    if (!this.state || !this.runner) return;
    this.capturePosition();
    const boss = task.id === this.area.boss.id,
      panel = this.panel(
        boss ? this.area.boss.name : task.title,
        boss
          ? "Use everything you've learned to bring the data hub online."
          : `${"difficulty" in task ? task.difficulty.toUpperCase() : "BOSS"} · +${"difficulty" in task ? GEM_REWARD[task.difficulty] : 0} gems`,
        true,
      );
    const columns = el("div", "editor-columns"),
      instructions = el("div", "instructions"),
      work = el("div", "code-workspace");
    instructions.append(
      el("span", "eyebrow", boss ? "BOSS CHALLENGE" : "YOUR MISSION"),
      el("p", "task-prompt", task.prompt),
      el("small", "", "Run is free. A wrong submission costs one heart; code errors don't."),
    );
    const drone = task.id === DRONE_TASK_ID ? batteryCard() : null;
    if (drone) {
      if (droneTraining) instructions.prepend(el("span", "lesson-step", "3 / 3 · BUILD THE REPAIR"));
      instructions.append(
        el("p", "drone-context", dronePilot.make),
        drone.node,
        button("Get a guided explanation", () => this.mission()),
      );
    }
    const hints = el("div", "hints");
    const renderHints = () => {
      if (!this.state || !boss) return;
      hints.replaceChildren();
      const progress = this.state.areas[this.area.id];
      for (const hint of this.area.boss.hints.slice(0, progress.hintsBought)) hints.append(el("p", "hint", hint.text));
      const next = this.area.boss.hints[progress.hintsBought];
      if (next) {
        const buy = button(`Get next hint · ${next.cost} gem${next.cost > 1 ? "s" : ""}`, () => {
          if (this.state) {
            this.commit(buyNextHint(this.state, this.area, now()));
            renderHints();
          }
        });
        buy.disabled = progress.gems < next.cost || this.busy;
        hints.append(buy);
      }
    };
    if (boss) {
      instructions.append(hints);
      renderHints();
    }
    const label = el("label", "editor-label", "Your code"),
      code = el("textarea", "code-editor");
    code.id = "code-editor";
    label.htmlFor = code.id;
    code.spellcheck = false;
    code.value = this.state.areas[this.area.id].drafts[task.id] ?? task.starter;
    code.setAttribute("autocapitalize", "off");
    code.addEventListener("input", () => this.draft(task, code.value));
    code.addEventListener("keydown", (event) => {
      if (event.key === "Tab" && !event.shiftKey) {
        event.preventDefault();
        code.setRangeText("  ", code.selectionStart, code.selectionEnd, "end");
        this.draft(task, code.value);
      }
    });
    if (drone)
      instructions.append(
        button("Use mission starter", () => {
          code.value = task.starter;
          this.draft(task, code.value);
          drone.setValue(3);
          this.scene.previewDrone(3);
          code.focus();
        }),
      );
    const output = el("pre", "output", "Your output will appear here."),
      feedback = el("div", "feedback");
    feedback.setAttribute("role", "status");
    const actions = el("div", "editor-actions"),
      run = button("Run code", () => {
        void execute(false);
      }),
      submit = button(
        "Submit answer",
        () => {
          void execute(true);
        },
        "button primary",
      );
    const execute = async (submitting: boolean) => {
      if (!this.state || !this.runner || this.busy) return;
      this.draft(task, code.value);
      this.busy = true;
      const token = ++this.runToken;
      run.disabled = true;
      submit.disabled = true;
      code.disabled = true;
      renderHints();
      feedback.className = "feedback";
      feedback.textContent = submitting ? "Checking your answer…" : "Running your code…";
      try {
        if (!submitting) {
          const result = await this.runner.run(code.value);
          if (token !== this.runToken) return;
          const error = executionError(result);
          output.textContent = result.stdout || "(No output)";
          feedback.textContent = error?.message ?? "Run complete. Submit when you're ready.";
          gameAudio.play(error ? "error" : "success");
          const charge = readBatteryOutput(result.stdout);
          if (drone && !error && charge !== undefined) {
            drone.setValue(charge);
            this.scene.previewDrone(charge);
            feedback.textContent = `Run complete. Battery: ${charge}/12 cells. ${charge === 12 ? "Ready to submit the repair." : `How can you add the missing ${12 - charge} cells?`}`;
          }
        } else {
          const result = await grade(task, code.value, this.runner);
          if (token !== this.runToken || !this.state) return;
          output.textContent = result.output || "(No output)";
          if (result.passed) {
            gameAudio.play(boss ? "victory" : "success");
            this.commit(
              boss ? defeatBoss(this.state, this.area, now()) : solveTask(this.state, this.area, task.id, now()),
            );
            if (boss) {
              this.busy = false;
              this.victory();
              return;
            }
            feedback.className = "feedback success";
            feedback.textContent = `Correct! +${GEM_REWARD[(task as Task).difficulty]} gem${GEM_REWARD[(task as Task).difficulty] > 1 ? "s" : ""}. Your progress is saved.`;
            if (drone) drone.setValue(12, true);
            const next = this.area.tasks[this.state.areas[this.area.id].solved.length];
            actions.replaceChildren(
              button(
                next ? "Next task →" : `Inspect ${this.area.boss.name.replace(/^The /, "the ")} →`,
                () => {
                  if (next) this.editor(next);
                  else this.editor(this.area.boss);
                },
                "button primary",
              ),
              button("Back to district", () => this.close()),
            );
            if (drone)
              actions.prepend(
                button(
                  "Watch the delivery",
                  () => {
                    this.close();
                    this.scene.launchDrone();
                  },
                  "button primary",
                ),
              );
            else if (task.id === "variables-1")
              actions.prepend(button("Continue with Kai", () => this.mission(), "button primary"));
          } else {
            gameAudio.play("error");
            const transition = applySubmissionFailure(
              this.state,
              this.area.id,
              result.failure ?? "wrong-output",
              now(),
            );
            this.commit(transition.state);
            if (transition.areaReset) {
              this.busy = false;
              const reset = this.panel(
                "A fresh start",
                "Out of hearts! This area's tasks and gems reset. Your lesson is still found; earlier areas are safe.",
              );
              reset.append(button("Try the district again", () => this.close(), "button primary"));
              return;
            }
            feedback.className = "feedback error";
            feedback.textContent = `${result.message}${["wrong-output", "rule-failed", "run-timeout"].includes(result.failure ?? "") ? " −1 heart." : " No heart lost."}`;
            const charge = readBatteryOutput(result.output);
            if (drone && result.failure === "wrong-output" && charge !== undefined) {
              drone.setValue(charge);
              this.scene.previewDrone(charge);
              feedback.textContent += ` The battery needs 12; your code printed ${charge}. Starting from 3, what amount fills the gap?`;
            }
          }
        }
      } catch (error) {
        if (token === this.runToken) feedback.textContent = `Couldn't run your code. No heart lost. ${String(error)}`;
      } finally {
        if (token === this.runToken) {
          this.busy = false;
          run.disabled = false;
          submit.disabled = false;
          code.disabled = false;
          renderHints();
        }
      }
    };
    actions.append(run, submit);
    work.append(label, code, actions, el("span", "section-label", "OUTPUT"), output, feedback);
    columns.append(instructions, work);
    panel.append(columns);
    queueMicrotask(() => code.focus());
  }
  private victory(): void {
    const next = village.worldAreas[this.area.order];
    const panel = this.panel(`${this.area.name} is online!`, "You used your code to reconnect the city.");
    panel.classList.add("victory");
    panel.prepend(this.icon("gem"));
    panel.append(
      el(
        "p",
        "",
        `Eight missions complete. ${this.area.boss.name} cleared.${next ? ` ${next.name} is now unlocked.` : " The city network is complete!"}`,
      ),
      button("Continue journey", () => this.worldMap(), "button primary"),
      button("Explore the district", () => this.close()),
    );
  }
}
