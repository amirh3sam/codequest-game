import { adventureStoryBeat } from "../content/adventure-story";
import { BEACON_EVENTS } from "../content/community-beacon";
import { dronePilot } from "../content/drone-pilot";
import { isAreaAvailable, loadArea, loadVariables } from "../content/loader";
import { PROJECT_QUESTS, readProjectQuestProgress } from "../content/project-quests";
import type { AreaContent, Boss, Task } from "../content/schema";
import { STUDY_CURRICULUM, STUDY_TOTAL_TASKS } from "../content/study-curriculum";
import village from "../content/village.json" with { type: "json" };
import { studyAreaId, studyTopicForArea, WORLD_LEVELS } from "../content/world-levels";
import { loadAdventures, saveAdventure } from "../core/adventures";
import { makeAdventureBackup, parseAdventureBackup } from "../core/backup";
import { DRONE_TASK_ID, isDroneRepaired, readBatteryOutput } from "../core/drone-mission";
import { hubStage, restoreHubSubsystem } from "../core/finale";
import { setDistrictLights } from "../core/map-lighting";
import { GEM_REWARD, isValidHeroName, STORY_AREA_IDS, STUDY_AREA_IDS } from "../core/rules";
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
import { type ControlScheme, controlHint } from "../game/control-scheme";
import { portalArrivalPosition } from "../game/district-layout";
import type { BootScene, VillageCallbacks } from "../game/scenes/BootScene";
import { executionError, grade } from "../grader/grade";
import type { Lang, RunResult } from "../runners/types";
import { WorkerHost } from "../runners/worker-host";
import { openArcade } from "./arcade";
import { beginnerHint, diagnosticLine, focusEditorLine } from "./debug-guidance";
import { button, el } from "./dom";
import { batteryCard, openDroneLesson } from "./drone-lesson";
import { openHubFinale } from "./hub-finale";
import { openLightingConsole } from "./lighting-console";
import { mobileControls } from "./mobile-controls";
import { openTablet } from "./tablet";
import { presentTaskConsoleOpening } from "./task-console-opening";

const now = () => new Date().toISOString();
const LANGUAGES: { id: Lang; name: string; badge: string; description: string }[] = [
  { id: "javascript", name: "JavaScript", badge: "JS", description: "The language of the web" },
  { id: "python", name: "Python", badge: "Py", description: "Readable, friendly first steps" },
  { id: "typescript", name: "TypeScript", badge: "TS", description: "JavaScript with helpful types" },
  { id: "java", name: "Java", badge: "Jv", description: "Build with types and classes" },
];

export class GameApp {
  private root: HTMLElement;
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
  private mobile = mobileControls({
    axis: (x, y) => this.scene.setTouchAxis(x, y),
    step: (x, y) => this.scene.touchStep(x, y),
    interact: () => this.scene.interactTouch(),
  });
  private savingAllowed = true;
  private busy = false;
  private runToken = 0;
  private toastTimer = 0;
  private tabletCleanup: (() => void) | null = null;
  private tabletNavigation = false;
  private onboardingStage = 3;
  private onboardingOrigin: Position | null = null;
  private controlScheme: ControlScheme = "wasd";
  private largeText = false;
  private highContrast = false;
  private callbacks: VillageCallbacks = {
    interact: (id) => this.interact(id),
    position: (position) => this.storePosition(position),
    message: (text) => this.toast(text),
  };
  constructor(root: HTMLElement, scene: BootScene) {
    gameAudio.init();
    this.root = root;
    this.scene = scene;
    const preferences = this.readAccessibilitySettings();
    this.controlScheme = preferences.controlScheme;
    this.largeText = preferences.largeText;
    this.highContrast = preferences.highContrast;
    this.scene.setControlScheme(this.controlScheme);
    this.applyAccessibilitySettings();
    this.notice.setAttribute("role", "status");
    this.notice.setAttribute("aria-live", "polite");
    this.mobile.hidden = true;
    root.replaceChildren(this.hud, this.overlay, this.notice, this.mobile);
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
    const library = loadAdventures();
    if (library.status === "loaded" && library.adventures[0]) this.lang = library.adventures[0].lang;
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
    this.hud.classList.add("hud-overlay-open");
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
    this.capturePosition();
    this.tabletNavigation = false;
    this.runToken++;
    this.runner?.kill();
    this.state = null;
    this.mobile.hidden = true;
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
    const library = loadAdventures();
    const archived =
      library.status === "loaded" ? library.adventures.find((entry) => entry.lang === this.lang) : undefined;
    const existing = archived ? { status: "loaded" as const, state: archived } : loadGame(this.lang);
    if (library.status === "loaded" && library.adventures.length) {
      panel.append(el("h3", "section-label", `Your adventures · ${library.adventures.length} saved`));
      const grouped = el("div", "title-adventures");
      for (const language of LANGUAGES) {
        const saves = library.adventures.filter((entry) => entry.lang === language.id);
        if (!saves.length) continue;
        const group = el("section", "title-language-saves");
        group.append(el("h4", "", language.name));
        for (const state of saves) {
          const row = button("", () => this.begin(state), "title-adventure-row");
          row.dataset.language = language.id;
          row.append(
            el("strong", "", `${state.hero.name}'s ${language.name} adventure`),
            el("span", "", `${state.areas[state.currentArea].solved.length}/8 tasks`),
          );
          if (state.adventureId === archived?.adventureId) row.classList.add("selected-adventure");
          group.append(row);
        }
        grouped.append(group);
      }
      panel.append(
        grouped,
        button("Manage adventures", () => this.adventureLibrary(), "button adventure-library-link"),
      );
    }
    if (library.status !== "loaded")
      panel.append(
        el(
          "p",
          "warning",
          "The adventure library is unavailable. Existing data is preserved; new play will stay in this session.",
        ),
      );
    if (existing.status === "corrupt" || existing.status === "unsupported-version")
      panel.append(
        el(
          "p",
          "warning",
          "An older save couldn't be read. It will be kept intact while new adventures use the library.",
        ),
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
      this.savingAllowed = library.status === "loaded";
      this.begin(
        {
          ...createGame(this.lang, { kind: this.heroKind, name: this.heroName.trim() }, now()),
          adventureId: crypto.randomUUID(),
        },
        true,
      );
    });
    panel.append(
      form,
      el("p", "intro-footer", "Start as many adventures as you like. Each keeps its own progress on this device."),
      this.backupControls(),
      this.soundToggle(),
    );
  }
  private begin(state: GameState, firstRun = false): void {
    if (!state.adventureId) state = { ...state, adventureId: `legacy-${state.lang}` };
    this.savingAllowed = loadAdventures().status === "loaded";
    if (!isAreaAvailable(state.currentArea)) state = enterArea(state, "variables", now());
    const area = loadArea(state.lang, state.currentArea);
    if (
      WORLD_LEVELS.some(
        ({ id }) =>
          isAreaAvailable(id as GameState["currentArea"]) &&
          !state.areas[id as GameState["currentArea"]].solved.every(
            (taskId, index) => loadArea(state.lang, id as GameState["currentArea"]).tasks[index]?.id === taskId,
          ),
      )
    ) {
      this.toast("This save doesn't match the district tasks. You can keep it and start a separate adventure.");
      return;
    }
    this.runner?.kill();
    this.runner = new WorkerHost(state.lang);
    this.lang = state.lang;
    this.area = area;
    this.onboardingStage = firstRun ? 0 : this.readOnboarding(state);
    if (firstRun) this.saveOnboarding(0, state);
    this.hud.hidden = false;
    this.mobile.hidden = false;
    this.commit(state);
    this.onboardingOrigin = this.onboardingStage === 0 ? this.scene.getPosition() : null;
    this.close();
    const runner = this.runner,
      adventureId = state.adventureId;
    runner.warmup().catch(() => {
      if (this.runner === runner && this.state?.adventureId === adventureId)
        this.toast("The language runtime couldn't load. Run your code to retry.");
    });
    this.toast(
      this.onboardingStage < 3
        ? "Your first steps are ready in the field guide."
        : "Welcome back! Your adventure is ready.",
    );
  }
  private onboardingKey(state = this.state): string | null {
    return state?.adventureId ? `codequest:onboarding:v1:${state.adventureId}` : null;
  }
  private readOnboarding(state: GameState): number {
    if (state.currentArea !== "variables" || state.areas.variables.bossDefeated) return 3;
    try {
      const stored = localStorage.getItem(this.onboardingKey(state) ?? "");
      if (stored === null) return 3;
      const value = Number(stored);
      return Number.isInteger(value) && value >= 0 && value <= 3 ? value : 3;
    } catch {
      return 3;
    }
  }
  private readAccessibilitySettings(): {
    controlScheme: ControlScheme;
    largeText: boolean;
    highContrast: boolean;
  } {
    try {
      const saved = JSON.parse(localStorage.getItem("codequest:accessibility:v1") ?? "{}") as Record<string, unknown>;
      return {
        controlScheme:
          saved.controlScheme === "arrows" || saved.controlScheme === "ijkl" ? saved.controlScheme : "wasd",
        largeText: saved.largeText === true,
        highContrast: saved.highContrast === true,
      };
    } catch {
      return { controlScheme: "wasd", largeText: false, highContrast: false };
    }
  }
  private applyAccessibilitySettings(): void {
    this.root.dataset.largeText = String(this.largeText);
    this.root.dataset.highContrast = String(this.highContrast);
  }
  private saveAccessibilitySettings(): void {
    try {
      localStorage.setItem(
        "codequest:accessibility:v1",
        JSON.stringify({
          controlScheme: this.controlScheme,
          largeText: this.largeText,
          highContrast: this.highContrast,
        }),
      );
    } catch {
      this.toast("Accessibility changes apply for this session; browser storage is unavailable.");
    }
  }
  private saveOnboarding(stage: number, state = this.state): void {
    try {
      const key = this.onboardingKey(state);
      if (key) localStorage.setItem(key, String(stage));
    } catch {
      // The guide remains usable for this session if browser storage is full.
    }
  }
  private advanceOnboarding(stage: number, completed = false): void {
    if (this.onboardingStage >= 3 || stage <= this.onboardingStage) return;
    this.onboardingStage = Math.min(3, stage);
    this.onboardingOrigin = null;
    this.saveOnboarding(this.onboardingStage);
    this.renderHud();
    if (completed) this.toast("First mission complete! You can see all eight steps in Tasks.");
  }
  private persist(): void {
    if (!this.state) return;
    const result = this.savingAllowed ? saveAdventure(this.state) : { status: "storage-error" };
    // Maintain the old language slot as a compatibility snapshot; the library owns all adventures.
    if (result.status === "saved") {
      const old = loadGame(this.state.lang);
      if (old.status === "loaded" || old.status === "empty") saveGame(this.state);
    }
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
    if (
      this.onboardingOrigin &&
      Math.hypot(position.x - this.onboardingOrigin.x, position.y - this.onboardingOrigin.y) >= 24
    )
      this.advanceOnboarding(1);
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
  private adventureLibrary(): void {
    this.capturePosition();
    const library = loadAdventures();
    const panel = this.panel(
      "Your adventures",
      "Switch languages or start another journey. Every adventure keeps its own progress.",
      true,
    );
    if (library.status !== "loaded") {
      panel.append(el("p", "warning", "Your saved library couldn't be read. Its data has been preserved."));
    } else {
      const grid = el("div", "adventure-library");
      for (const state of library.adventures) {
        const progress = state.areas[state.currentArea],
          area = WORLD_LEVELS.find((entry) => entry.id === state.currentArea);
        const language = LANGUAGES.find((entry) => entry.id === state.lang)?.name ?? state.lang;
        const card = el("article", "adventure-card");
        card.dataset.adventureId = state.adventureId;
        const avatar = this.icon(state.hero.kind === "girl" ? "heroGirl" : "heroBoy", true);
        card.append(
          avatar,
          el("span", "eyebrow", language),
          el("h3", "", state.hero.name),
          el("p", "", `${area?.name ?? state.currentArea} · ${progress.solved.length}/8 missions`),
          el(
            "small",
            "",
            `${progress.hearts} hearts · ${progress.gems} gems${state.discoveries?.beacon ? " · Signal Maker" : ""}`,
          ),
          button(`Resume ${state.hero.name} · ${language}`, () => this.begin(state), "button primary"),
        );
        grid.append(card);
      }
      panel.append(grid);
      if (!library.adventures.length)
        panel.append(el("p", "", "Your first adventure is waiting. Pick a language and a developer to begin."));
    }
    const actions = el("div", "panel-actions");
    actions.append(button("Start another adventure", () => this.intro()));
    actions.append(button("Save backup file", () => this.exportAdventure()));
    actions.append(button("Load backup file", () => this.importAdventure()));
    if (this.state) actions.append(button("Back to current adventure", () => this.close()));
    panel.append(actions);
  }
  private backupControls(): HTMLElement {
    const controls = el("div", "backup-controls");
    controls.append(
      el("p", "", "Download a backup file to keep your adventure safe. Loading one adds a separate adventure."),
      button("Load adventure backup", () => this.importAdventure()),
    );
    if (this.state) controls.prepend(button("Save adventure backup", () => this.exportAdventure()));
    return controls;
  }
  private exportAdventure(): void {
    if (!this.state) {
      this.toast("Start or continue an adventure before saving a backup file.");
      return;
    }
    let tabletDraft: string | undefined;
    try {
      tabletDraft =
        localStorage.getItem(`codequest:tablet:v2:${this.state.adventureId}`) ??
        (this.state.adventureId?.startsWith("legacy-")
          ? (localStorage.getItem(`codequest:tablet:v1:${this.state.lang}`) ?? undefined)
          : undefined);
    } catch {
      /* Optional draft. */
    }
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(makeAdventureBackup(this.state, tabletDraft), null, 2)], { type: "application/json" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `CodeQuest-${this.state.lang}-${this.state.hero.name.replace(/[^a-z0-9]+/gi, "-")}.json`;
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    this.toast("Adventure backup downloaded to your device.");
  }
  private importAdventure(): void {
    const picker = document.createElement("input");
    picker.type = "file";
    picker.accept = ".json,application/json";
    picker.addEventListener(
      "change",
      async () => {
        const file = picker.files?.[0];
        if (!file) return;
        try {
          const parsed = parseAdventureBackup(await file.text());
          const state: GameState = { ...parsed.state, adventureId: crypto.randomUUID(), updatedAt: now() };
          if (loadAdventures().status !== "loaded")
            throw new Error("The adventure library cannot be updated right now.");
          if (saveAdventure(state).status !== "saved")
            throw new Error("Browser storage is full; the backup was not imported.");
          if (parsed.tabletDraft) {
            try {
              localStorage.setItem(`codequest:tablet:v2:${state.adventureId}`, parsed.tabletDraft);
            } catch {
              /* Progress imported even if draft storage is full. */
            }
          }
          this.begin(state);
        } catch (error) {
          this.toast(error instanceof Error ? error.message : "Could not read this adventure backup.");
        }
      },
      { once: true },
    );
    picker.click();
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
      button("Lighting", () => this.communityBeacon()),
      button("Lesson", () => this.lesson()),
      button("Progress", () => this.journal()),
      button("World map", () => this.worldMap()),
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
              ? `Help ${this.courierName()} launch the delivery drone ${String.fromCharCode(183)} Mission`
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
      el(
        "span",
        "",
        `${controlHint(this.controlScheme)} - Move · Click / drag - Mouse move · E / Space - Interact · T - Tablet · Esc - Menu`,
      ),
      this.saved,
    );
    const onboarding = this.onboardingCard();
    this.hud.replaceChildren(identity, stats, actions, objective, location, footer);
    if (onboarding) this.hud.append(onboarding);
  }
  private onboardingCard(): HTMLElement | null {
    if (
      this.onboardingStage >= 3 ||
      !this.state ||
      this.area.id !== "variables" ||
      this.state.areas.variables.bossDefeated
    )
      return null;
    const guide = el("aside", "field-guide");
    guide.setAttribute("aria-label", "First steps guide");
    const stages = [
      [
        "1 / 3 · MOVE",
        "Use WASD or arrows. Click a destination to walk there, or hold the left mouse button and drag to steer. On a phone, hold a direction or tap the ground.",
      ],
      ["2 / 3 · MEET YOUR COURIER", `Walk near ${this.courierName()} and press E / Space, or tap Interact.`],
      [
        "3 / 3 · TRY A MISSION",
        `Talk with ${this.courierName()}, choose Create the training badge, then run your code before submitting.`,
      ],
    ] as const;
    const [title, description] = stages[this.onboardingStage] ?? stages[2];
    guide.append(el("span", "eyebrow", "FIELD GUIDE"), el("strong", "field-guide-title", title));
    guide.append(
      el("p", "", this.onboardingStage === 0 ? `${controlHint(this.controlScheme)} · ${description}` : description),
    );
    const skip = button("Skip guide", () => this.advanceOnboarding(3), "field-guide-skip");
    guide.append(skip);
    return guide;
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
    this.hud.classList.remove("hud-overlay-open");
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
    else if (id === "level-portal") this.worldMap();
    else if (id === "discovery-beacon") this.communityBeacon();
    else if (id === "lesson") this.lesson();
    else if (id === "arcade") this.packetDash();
    else if (id === "boss") {
      if (canFightBoss(this.state, this.area)) this.openBoss();
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
  private packetDash(): void {
    if (!this.state) return;
    const adventureId = this.state.adventureId;
    const runner = this.scene.textures.get(`hero-walk-${this.state.hero.kind}`).getSourceImage() as HTMLCanvasElement;
    const name = this.state.hero.name,
      packetDashBest = this.state.games?.packetDashBest ?? 0,
      signalStackBest = this.state.games?.signalStackBest ?? 0;
    openArcade({
      name,
      runner,
      panel: (title, subtitle, wide) => this.panel(title, subtitle, wide),
      packetDashBest,
      signalStackBest,
      recordPacketDash: (score) => {
        if (!this.state || this.state.adventureId !== adventureId || score <= (this.state.games?.packetDashBest ?? 0))
          return;
        this.state = {
          ...this.state,
          updatedAt: now(),
          games: { ...this.state.games, packetDashBest: score },
        };
        this.persist();
      },
      recordSignalStack: (score) => {
        if (!this.state || this.state.adventureId !== adventureId || score <= (this.state.games?.signalStackBest ?? 0))
          return;
        this.state = {
          ...this.state,
          updatedAt: now(),
          games: { packetDashBest: this.state.games?.packetDashBest ?? 0, signalStackBest: score },
        };
        this.persist();
      },
    });
  }
  private openBoss(): void {
    if (!this.state) return;
    if (this.area.id !== "variables" || hubStage(this.state) >= 2) this.editor(this.area.boss);
    else this.hubFinale();
  }
  private hubFinale(): void {
    if (!this.state || (hubStage(this.state) < 3 && !canFightBoss(this.state, this.area))) return;
    const adventureId = this.state.adventureId;
    const draftIds = ["variables-boss:relay-1", "variables-boss:relay-2"] as const;
    openHubFinale({
      lang: this.lang,
      name: this.state.hero.name,
      stage: hubStage(this.state),
      drafts: draftIds.map((id) => this.state?.areas.variables.drafts[id]),
      panel: (title, subtitle, wide) => this.panel(title, subtitle, wide),
      run: (code) => this.practice(code),
      draft: (step, code) => this.draft({ id: draftIds[step] }, code),
      restore: (stage) => {
        if (!this.state || this.state.adventureId !== adventureId) return false;
        const next = restoreHubSubsystem(this.state, this.area, stage, now());
        if (next === this.state) return false;
        this.commit(next);
        gameAudio.play("success");
        return true;
      },
      finalRepair: () => this.editor(this.area.boss),
      close: () => this.close(),
      inspect: () => {
        this.close();
        this.scene.tourHub();
      },
    });
  }
  private mission(): void {
    if (!this.state || this.area.id !== "variables") return;
    if (this.onboardingStage === 1) this.advanceOnboarding(2);
    if (canFightBoss(this.state, this.area) && !this.state.areas.variables.bossDefeated) {
      this.hubFinale();
      return;
    }
    this.capturePosition();
    if (!this.state.areas.variables.solved.includes("variables-1")) {
      const panel = this.panel(
        `${this.courierName()} - A delivery worth debugging`,
        "A stranded drone. A city lane waiting for your code.",
      );
      panel.classList.add("drone-lesson");
      const portrait = el("div", "courier-intro");
      portrait.append(
        this.icon(this.state.hero.kind === "boy" ? "heroGirl" : "heroBoy", true),
        el("p", "lesson-body", dronePilot.intro.replaceAll("Kai", this.courierName())),
      );
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
      courierName: this.courierName(),
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
  private courierName(): "Ava" | "Kai" {
    return this.state?.hero.kind === "boy" ? "Ava" : "Kai";
  }
  private communityBeacon(): void {
    if (!this.state) return;
    this.capturePosition();
    openLightingConsole({
      lang: this.lang,
      district: this.area.name,
      lighting: this.state.areas[this.area.id].lighting,
      panel: (title, subtitle, wide) => this.panel(title, subtitle, wide),
      run: (code) => this.practice(code),
      apply: (target, command) => {
        if (this.state) this.commit(setDistrictLights(this.state, target, command, now()));
        gameAudio.play("beacon");
      },
      close: () => this.close(),
    });
  }
  private async practice(code: string, files?: Record<string, string>, entryPath?: string): Promise<RunResult> {
    if (!this.runner || this.busy) throw new Error("A program is already running.");
    this.busy = true;
    const token = ++this.runToken;
    try {
      const result = await this.runner.run(code, undefined, files, entryPath);
      if (token === this.runToken) gameAudio.play(executionError(result) ? "error" : "success");
      return result;
    } finally {
      if (token === this.runToken) this.busy = false;
    }
  }
  private tablet(animate = true, studyTopicId?: string, studyLevelOffset = STORY_AREA_IDS.length): void {
    if (!this.state) return;
    gameAudio.play("open");
    this.tabletNavigation = false;
    this.capturePosition();
    const progress = this.state.areas[this.area.id];
    this.tabletCleanup = openTablet({
      lang: this.lang,
      name: this.state.hero.name,
      kind: this.state.hero.kind,
      courierName: this.courierName(),
      animate,
      focusCamera: () => this.scene.focusTablet(),
      panel: (title, subtitle, wide) => this.panel(title, subtitle, wide),
      run: (code, files, entryPath) => this.practice(code, files, entryPath),
      district: this.area.name,
      hearts: progress.hearts,
      gems: progress.gems,
      guide: this.area.lesson.pages,
      adventureId: this.state.adventureId,
      initialStudyTopicId: studyTopicId,
      studyLevelOffset,
      studyPrerequisiteComplete: this.state.areas.abstraction.bossDefeated,
      studyWorld: {
        read: (topicId) => {
          const id = studyAreaId(topicId);
          const saved = id && this.state?.areas[id];
          return {
            tasks: saved?.solved.length ?? 0,
            boss: saved?.bossDefeated ?? false,
            unlocked: Boolean(id && this.state && isAreaUnlocked(this.state, id)),
          };
        },
        complete: (topicId, taskIndex, boss) => {
          const id = studyAreaId(topicId),
            state = this.state;
          if (!id || !state || !isAreaUnlocked(state, id)) return false;
          const content = loadArea(state.lang, id);
          const focused = { ...state, currentArea: id };
          const next = boss
            ? defeatBoss(focused, content, now())
            : solveTask(focused, content, content.tasks[taskIndex]?.id ?? "", now());
          if (next === focused) return false;
          this.commit({ ...next, currentArea: state.currentArea, position: state.position });
          return true;
        },
        visit: (topicId) => {
          const id = studyAreaId(topicId);
          if (id) this.travelTo(id);
        },
        showMap: () => this.worldMap(),
      },
      discovery: {
        title: "Community beacon · City lights",
        status: "Print online/offline and a color to control this map's route lights. No mission prerequisite.",
        open: () => {
          this.tabletNavigation = true;
          this.communityBeacon();
        },
      },
      finale:
        this.area.id === "variables" && (canFightBoss(this.state, this.area) || this.state.areas.variables.bossDefeated)
          ? {
              title: "Firewall data hub",
              status:
                hubStage(this.state) === 3
                  ? "All three repair signals are online. Logic Junction is unlocked."
                  : `${hubStage(this.state)}/3 repair signals restored. Free code previews protect hearts and gems.`,
              open: () => {
                this.tabletNavigation = true;
                this.hubFinale();
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
    const state = this.state;
    const availableAreas = WORLD_LEVELS.filter(({ id }) => isAreaAvailable(id));
    const totalMissions = availableAreas.reduce(
      (total, { id }) => total + loadArea(state.lang, id as GameState["currentArea"]).tasks.length,
      0,
    );
    const solvedMissions = availableAreas.reduce(
      (total, { id }) => total + state.areas[id as GameState["currentArea"]].solved.length,
      0,
    );
    const restoredDistricts = availableAreas.filter(
      ({ id }) => state.areas[id as GameState["currentArea"]].bossDefeated,
    ).length;
    const panel = this.panel(
      "Your coding progress",
      "See the skills you are building, what is complete, and what is coming next.",
      true,
    );
    const storyBeat = adventureStoryBeat(state),
      story = el("article", "story-chapter");
    story.append(
      el("span", "eyebrow", storyBeat.chapter),
      el("strong", "", storyBeat.title),
      el("p", "", storyBeat.message),
    );
    panel.append(story);
    const summary = el("div", "skill-progress-summary");
    const adventureKey = state.adventureId ?? `guest-${state.lang}`;
    const missionSummary = el("div"),
      districtSummary = el("div"),
      studySummary = el("div"),
      completedTopics = STUDY_AREA_IDS.filter((id) => state.areas[id].bossDefeated),
      completedStudyTasks = STUDY_AREA_IDS.reduce((sum, id) => sum + state.areas[id].solved.length, 0);
    missionSummary.append(el("strong", "", `${solvedMissions} / ${totalMissions} missions`));
    missionSummary.append(el("span", "", "across playable districts"));
    districtSummary.append(el("strong", "", `${restoredDistricts} / ${availableAreas.length} districts restored`));
    districtSummary.append(el("span", "", "district bosses defeated"));
    studySummary.append(el("strong", "", `${completedStudyTasks} / ${STUDY_TOTAL_TASKS} Study Path tasks`));
    studySummary.append(
      el("span", "", `${completedTopics.length} / ${STUDY_CURRICULUM.length} category bosses defeated`),
    );
    summary.append(missionSummary, districtSummary, studySummary);
    panel.append(summary);
    const badges = [
      { title: "First Repair", detail: "Complete your first coding mission", earned: solvedMissions > 0 },
      { title: "District Restorer", detail: "Defeat a district boss", earned: restoredDistricts > 0 },
      {
        title: "Community Helper",
        detail: state.discoveries?.beacon
          ? `${BEACON_EVENTS[state.discoveries.beacon].title} is on air`
          : "Light the community beacon",
        earned:
          Boolean(state.discoveries?.beacon) || WORLD_LEVELS.some((level) => Boolean(state.areas[level.id].lighting)),
      },
      {
        title: "Badge Builder",
        detail: "Finish the multi-file project quest",
        earned: PROJECT_QUESTS.some((quest) => readProjectQuestProgress(adventureKey, quest.id) >= quest.steps.length),
      },
      {
        title: "Code Scholar",
        detail: `Practice all ${STUDY_CURRICULUM.length} Study Path topics`,
        earned: completedTopics.length >= STUDY_CURRICULUM.length,
      },
      {
        title: "Skyline Sprinter",
        detail: "Score 15 in Packet Dash",
        earned: (state.games?.packetDashBest ?? 0) >= 15,
      },
      {
        title: "Signal Architect",
        detail: "Stack 6 signals in Signal Stack",
        earned: (state.games?.signalStackBest ?? 0) >= 6,
      },
    ];
    const badgeGrid = el("div", "adventure-badges");
    badgeGrid.append(
      ...badges.map(({ title, detail, earned }) => {
        const badge = el("article", `adventure-badge${earned ? " earned" : " locked"}`);
        badge.append(
          el("span", "adventure-badge-mark", earned ? "✦" : "◇"),
          el("strong", "", title),
          el("p", "", detail),
          el("small", "", earned ? (title === "Community Helper" ? "ON AIR" : "UNLOCKED") : "NOT YET"),
        );
        return badge;
      }),
    );
    panel.append(el("h3", "badge-heading", "Adventure badges"), badgeGrid);
    const tracks = el("div", "skill-tracks");
    panel.append(el("h3", "badge-heading", `City districts · ${WORLD_LEVELS.length} maps`));
    for (const [index, district] of WORLD_LEVELS.entries()) {
      const id = district.id,
        progress = state.areas[id],
        complete = progress.bossDefeated;
      const unlocked = isAreaUnlocked(state, id),
        category = studyTopicForArea(id);
      const track = el(
        "article",
        `skill-track${category ? " study-skill-track" : ""}${unlocked ? " playable" : " upcoming"}${complete ? " mastered" : ""}`,
      );
      track.dataset.levelId = id;
      track.append(
        el("span", "eyebrow", `LEVEL ${String(index + 1).padStart(2, "0")} · ${district.concept.toUpperCase()}`),
        el("strong", "skill-track-name", district.name),
      );
      const label = el("span", "skill-track-count", `${progress.solved.length} / 8 ${category ? "tasks" : "missions"}`);
      const meter = el("div", "skill-track-meter");
      meter.setAttribute("role", "progressbar");
      meter.setAttribute("aria-label", `${district.name} missions completed`);
      meter.setAttribute("aria-valuemin", "0");
      meter.setAttribute("aria-valuemax", "8");
      meter.setAttribute("aria-valuenow", String(progress.solved.length));
      for (let step = 0; step < 8; step++) meter.append(el("span", step < progress.solved.length ? "complete" : ""));
      const next = loadArea(state.lang, id).tasks[progress.solved.length];
      track.append(
        label,
        meter,
        el(
          "p",
          "",
          complete
            ? "District restored · boss defeated."
            : !unlocked
              ? `Locked · defeat the boss in level ${index}.`
              : next
                ? `Next: ${next.title}`
                : "8/8 tasks · visit the district boss.",
        ),
      );
      track.append(
        el("small", "", unlocked ? "Transit online · return to any unlocked map" : "Transit destination locked"),
      );
      if (unlocked) track.append(button(`Visit level ${index + 1}`, () => this.travelTo(id)));
      tracks.append(track);
    }
    panel.append(tracks);
    if (this.area.id === "variables")
      panel.append(
        button(
          `Courier mission - Help ${this.courierName()} launch the drone`,
          () => this.mission(),
          "button mission-link",
        ),
      );
    panel.append(button("Community beacon · City lights", () => this.communityBeacon(), "button mission-link"));
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
      panel.append(button(`Challenge ${this.area.boss.name}`, () => this.openBoss(), "button primary"));
    else if (this.area.id === "variables" && this.state.areas.variables.bossDefeated)
      panel.append(button("Review the restored data hub", () => this.hubFinale(), "button mission-link"));
  }
  private pause(): void {
    if (!this.state) return;
    this.capturePosition();
    const panel = this.panel("Take a breath", "Your adventure is saved on this device.");
    const actions = el("div", "menu-actions");
    actions.append(
      button("Resume adventure", () => this.close(), "button primary"),
      button("Switch adventure", () => this.adventureLibrary()),
      button("Save backup file", () => this.exportAdventure()),
      button("Load backup file", () => this.importAdventure()),
      button("World map", () => this.worldMap()),
      button("Accessibility & controls", () => this.accessibility()),
      button("Read the lesson", () => this.lesson()),
      button("Title screen", () => this.intro()),
    );
    panel.append(actions);
    const audio = el("div", "sound-settings"),
      label = el("label", "", "Effects volume"),
      volume = el("input"),
      value = el("output", "", `${Math.round(gameAudio.volume * 100)}%`);
    volume.type = "range";
    volume.id = "effects-volume";
    volume.min = "0";
    volume.max = "100";
    volume.step = "5";
    volume.value = String(Math.round(gameAudio.volume * 100));
    label.htmlFor = volume.id;
    volume.addEventListener("input", () => {
      gameAudio.setVolume(Number(volume.value) / 100);
      value.textContent = `${volume.value}%`;
    });
    volume.addEventListener("change", () => gameAudio.play("tap"));
    audio.append(label, volume, value, this.soundToggle());
    panel.append(audio);
  }
  private accessibility(): void {
    const panel = this.panel(
      "Accessibility & controls",
      "Choose comfortable text and movement settings for this device.",
      true,
    );
    const controls = el("div", "accessibility-setting"),
      label = el("label", "", "Movement keys");
    const select = el("select") as HTMLSelectElement;
    select.id = "movement-controls";
    select.setAttribute("aria-label", "Movement keys");
    for (const [value, title] of [
      ["wasd", "WASD + arrow keys"],
      ["arrows", "Arrow keys only"],
      ["ijkl", "IJKL + arrow keys"],
    ] as const) {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = title;
      select.append(option);
    }
    select.value = this.controlScheme;
    label.htmlFor = select.id;
    select.addEventListener("change", () => {
      if (select.value !== "wasd" && select.value !== "arrows" && select.value !== "ijkl") return;
      this.controlScheme = select.value;
      this.scene.setControlScheme(this.controlScheme);
      this.saveAccessibilitySettings();
      this.renderHud();
    });
    controls.append(label, select);

    const largerText = button(
      this.largeText ? "Large text: on" : "Large text: off",
      () => {
        this.largeText = !this.largeText;
        largerText.textContent = this.largeText ? "Large text: on" : "Large text: off";
        largerText.setAttribute("aria-pressed", String(this.largeText));
        this.applyAccessibilitySettings();
        this.saveAccessibilitySettings();
      },
      "button accessibility-toggle",
    );
    largerText.setAttribute("aria-pressed", String(this.largeText));
    largerText.setAttribute("aria-label", "Large text");
    const contrast = button(
      this.highContrast ? "High contrast: on" : "High contrast: off",
      () => {
        this.highContrast = !this.highContrast;
        contrast.textContent = this.highContrast ? "High contrast: on" : "High contrast: off";
        contrast.setAttribute("aria-pressed", String(this.highContrast));
        this.applyAccessibilitySettings();
        this.saveAccessibilitySettings();
      },
      "button accessibility-toggle",
    );
    contrast.setAttribute("aria-pressed", String(this.highContrast));
    contrast.setAttribute("aria-label", "High contrast");
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const motionNote = el(
      "p",
      "accessibility-note",
      motion
        ? "Reduced motion is active. The game has shortened its camera and decorative animations."
        : "The game follows your device's Reduce Motion setting for camera and decorative animations.",
    );
    const audio = el("div", "accessibility-setting"),
      audioLabel = el("label", "", "Effects volume"),
      volume = el("input"),
      value = el("output", "", `${Math.round(gameAudio.volume * 100)}%`);
    volume.type = "range";
    volume.id = "accessibility-volume";
    volume.min = "0";
    volume.max = "100";
    volume.step = "5";
    volume.value = String(Math.round(gameAudio.volume * 100));
    audioLabel.htmlFor = volume.id;
    volume.addEventListener("input", () => {
      gameAudio.setVolume(Number(volume.value) / 100);
      value.textContent = `${volume.value}%`;
    });
    audio.append(audioLabel, volume, value, this.soundToggle());
    panel.append(
      controls,
      largerText,
      contrast,
      motionNote,
      audio,
      button("Back to menu", () => this.pause()),
    );
  }
  private worldMap(): void {
    if (!this.state) return;
    const state = this.state;
    const panel = this.panel(
      "Your journey",
      "23 playable city maps. Each district has eight coding tasks, one boss and its own transit building.",
      true,
    );
    const nodes = el("div", "world-nodes level-map-nodes");
    const solved = WORLD_LEVELS.reduce((total, level) => total + state.areas[level.id].solved.length, 0);
    const bosses = WORLD_LEVELS.filter((level) => state.areas[level.id].bossDefeated).length;
    panel.append(
      el("span", "eyebrow", `LEVEL MAP · ${WORLD_LEVELS.length} CITY DISTRICTS`),
      el(
        "h3",
        "world-map-section-title",
        `${solved} / ${WORLD_LEVELS.length * 8} tasks · ${bosses} / ${WORLD_LEVELS.length} bosses defeated`,
      ),
      el(
        "p",
        "world-map-hint",
        "Defeat each district boss to unlock the next map. Transit stays online in every unlocked district, so you can return at any time. You arrive beside its transit building.",
      ),
    );
    for (const [index, level] of WORLD_LEVELS.entries()) {
      const progress = state.areas[level.id],
        unlocked = isAreaUnlocked(state, level.id);
      const category = studyTopicForArea(level.id);
      const node = button(
        "",
        () => this.travelTo(level.id),
        `world-node${category ? " world-skill-node" : ""}${unlocked ? " unlocked" : " locked"}${progress.bossDefeated ? " complete" : ""}`,
      );
      node.dataset.levelId = level.id;
      node.disabled = !unlocked;
      node.append(
        el("span", "world-number", unlocked ? String(index + 1).padStart(2, "0") : "🔒"),
        el("strong", "", level.name),
        el(
          "small",
          "",
          !unlocked
            ? `Locked · defeat the boss in level ${index}`
            : progress.bossDefeated
              ? "✓ Boss defeated · explore district"
              : `${progress.solved.length}/8 tasks · ${progress.solved.length === 8 ? "boss ready" : "explore district"}`,
        ),
        el("small", "world-transit-status", unlocked ? "TRANSIT ONLINE" : "DESTINATION LOCKED"),
      );
      nodes.append(node);
    }
    panel.append(nodes);
  }
  private travelTo(id: GameState["currentArea"]): void {
    if (!this.state || !isAreaUnlocked(this.state, id)) return;
    this.commit(enterArea(this.state, id, now(), portalArrivalPosition(id)));
    this.close();
    this.toast(`Arrived at ${this.area.name} transit. Choose a terminal or open the world map to travel again.`);
  }
  private draft(task: Pick<Task, "id">, code: string): void {
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
    panel.classList.remove("tablet-shell", "tablet-task-view");
    this.overlay.classList.remove("tablet-overlay");
    panel.classList.add("task-console-shell", "task-console-view");
    const columns = el("div", "editor-columns"),
      instructions = el("div", "instructions"),
      work = el("div", "code-workspace");
    instructions.append(
      el("span", "eyebrow", boss ? "BOSS CHALLENGE" : "YOUR MISSION"),
      el("p", "task-prompt", task.prompt.replaceAll("Kai", this.courierName())),
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
      feedback = el("div", "feedback"),
      debugHelp = el("div", "debug-guidance");
    const revealOutput = (text: string) => {
      output.textContent = text;
      output.classList.remove("console-reveal");
      void output.offsetWidth;
      output.classList.add("console-reveal");
    };
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
          revealOutput(result.stdout || "(No output)");
          feedback.textContent = error?.message ?? "Run complete. Submit when you're ready.";
          debugHelp.replaceChildren();
          if (error) {
            const line = diagnosticLine(error.message);
            debugHelp.append(
              el("strong", "", line ? `Try line ${line}` : "Debugging hint"),
              el("p", "", beginnerHint(error.message, this.lang)),
            );
            if (line) debugHelp.append(button(`Go to line ${line}`, () => focusEditorLine(code, line)));
          }
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
          revealOutput(result.output || "(No output)");
          if (result.passed) {
            gameAudio.play(boss ? "victory" : "success");
            this.commit(
              boss ? defeatBoss(this.state, this.area, now()) : solveTask(this.state, this.area, task.id, now()),
            );
            if (task.id === "variables-1" && this.onboardingStage === 2) this.advanceOnboarding(3, true);
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
                  else this.openBoss();
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
              actions.prepend(button(`Continue with ${this.courierName()}`, () => this.mission(), "button primary"));
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
    work.append(label, code, actions, el("span", "section-label", "OUTPUT"), output, feedback, debugHelp);
    columns.append(instructions, work);
    panel.append(columns);
    this.tabletCleanup = presentTaskConsoleOpening(panel, task, this.state.hero.name);
  }
  private victory(): void {
    const next = WORLD_LEVELS[this.area.order];
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
    if (this.area.id === "variables")
      panel.append(button("Watch the hub boot", () => this.hubFinale(), "button mission-link"));
  }
}
