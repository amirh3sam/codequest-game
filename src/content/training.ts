import type { TrainingChapterId } from "../core/training";
import type { Lang } from "../runners/types";
import type { AreaContent } from "./schema";

export type TrainingScene =
  | "city"
  | "walk"
  | "courier"
  | "monitor"
  | "tablet"
  | "files"
  | "map"
  | "lighting"
  | "arcade"
  | "save"
  | "settings";
export type TrainingChapter = { id: string; title: string; scene: TrainingScene; body: string[]; tip: string };
export const TABLET_TRAINING = [
  [
    "Code",
    "Your free coding workspace. Edit and run real programs; output appears below the editor. Practice never spends hearts or gems.",
  ],
  [
    "Examples",
    "Load a starter, try a debugging challenge or predict an answer before running it. Inserting an example replaces the active practice draft.",
  ],
  [
    "Console",
    "Review the output from your latest practice run. It shows the same result as the output area below Code.",
  ],
  [
    "Missions",
    "See all eight tasks in this district, which are complete and which are available. Open the next task, the courier story, lighting or the first hub repairs here.",
  ],
  ["Guide", "Read the current district's explanations and code examples whenever you need a reminder."],
  ["Daily Quest", "Try a new free coding challenge each day. Its draft and completion are saved with your adventure."],
  [
    "Study Path",
    "Follow the category checkpoints in order, run code and answer the prediction. Each category has eight tasks and a boss. Its progress is shared with the matching city district.",
  ],
  [
    "Projects",
    "Build a feature across several files and classes. Follow the milestone instructions, run the project and compare its output with the goal.",
  ],
] as const;
export const MENU_TRAINING = [
  [
    "Tablet",
    "Open your personal coding workspace with T or this button. Escape closes panels. On phones, use the hamburger menu.",
  ],
  ["Mission", "In Variable District, revisit your courier's drone story and guided badge/battery exercises."],
  ["Lighting", "Run code to change the whole district's route lights or the circuit around one task."],
  ["Lesson", "Read this district's programming explanation and examples. Return as often as you like."],
  ["Progress", "Check hearts, gems, badges and all 23 district task/boss tracks. Open the next available task here."],
  ["World map", "Choose any unlocked district. Locked cards explain the previous boss you must finish."],
  ["Training", "Replay this tour, jump to one topic or review the current district's briefing."],
  [
    "Menu",
    "Resume, switch adventures, manage your character, download/load a backup, change accessibility settings or return to the title screen. Manage character lets you rename, restart or delete an adventure; Manage adventures also offers deleting all game data on this device.",
  ],
  [
    "Sound",
    "Mute effects quickly. Menu → Accessibility & controls also has effects volume, larger text, high contrast and movement-key choices.",
  ],
] as const;

export function trainingProgram(lang: Lang, message = "Signal ready"): string {
  const text = JSON.stringify(message);
  if (lang === "java")
    return `public class Main {\n    public static void main(String[] args) {\n        System.out.println(${text});\n    }\n}`;
  if (lang === "python") return `message = ${text}\nprint(message)`;
  return `const message${lang === "typescript" ? ": string" : ""} = ${text};\nconsole.log(message);`;
}

export function welcomeTraining(courier: string): (TrainingChapter & { id: TrainingChapterId })[] {
  return [
    {
      id: "welcome",
      title: "Welcome to CodeQuest",
      scene: "city",
      body: [
        "You are a developer bringing a tech city's network back online. Learn a concept, try real code and use it to repair the city.",
        "Your adventure has 23 districts. Each has eight tasks and a separate boss. You can also practise freely, build projects and play arcade games.",
      ],
      tip: "This is a safe training preview. Your actual adventure is paused and no mission progress, hearts or gems will change.",
    },
    {
      id: "movement",
      title: "Find your way around",
      scene: "walk",
      body: [
        "Use WASD or arrows, or click a destination. A reticle and dotted route show where you are going; your developer walks around obstacles. Blocked clicks choose a nearby reachable spot.",
        "Hold and drag the left mouse button to steer. Keyboard or D-pad input cancels a click route. On phones, rotate to landscape, use the D-pad or tap the ground, then tap E to interact.",
      ],
      tip: "Try the miniature map below, or focus it and use arrow keys. In the city, walk near an object and press E / Space.",
    },
    {
      id: "courier",
      title: `Meet ${courier}`,
      scene: "courier",
      body: [
        `${courier} is your first contact in Variable District. Talk to them, create the training badge and learn how to charge the delivery drone.`,
        "Mission instructions tell you what to build and what output to expect. Lessons and guided explanations are available before you try a repair.",
      ],
      tip: "Talk to your courier in the map, use Mission in the menu, or open the courier story from the tablet's Missions tab.",
    },
    {
      id: "missions",
      title: "Run first. Submit when ready.",
      scene: "monitor",
      body: [
        "Run executes your real program and shows its output. Read the result, fix any errors and run again. Submit checks the task's expected output and code rules; that is what completes a mission.",
        "Run and tablet practice are free. Incorrect graded output, broken task rules or a program that runs too long can cost a heart. Syntax, compiler, runtime and runner errors do not cost a heart. Losing all three hearts restarts this district; other districts stay saved.",
      ],
      tip: "Try this real example. Training Submit only checks this preview; it cannot spend your adventure's hearts or award gems.",
    },
    {
      id: "menus",
      title: "Your HUD and menus",
      scene: "city",
      body: [
        "The top bar shows your developer, language, hearts, gems and district task count. Your Next Quest tells you where to begin. Gems earned from tasks can buy boss hints.",
        "On desktop, tools sit across the top. On phones, the same actions are inside ☰. Panels pause movement and hide the map guide. Explore every menu button below.",
      ],
      tip: "Easy / normal / hard missions award 1 / 2 / 3 gems. Eight solved tasks make this district's boss available.",
    },
    {
      id: "tablet",
      title: "Every tab in your tablet",
      scene: "tablet",
      body: [
        "Your wrist tablet is a place to experiment, review lessons and follow missions. Open it with T or Tablet; close it with Escape or ×.",
        "Tap each preview tab below to learn what it does. Tablet help returns you to the tab you were using.",
      ],
      tip: "Code and its output share one workspace. On short phone screens, scroll inside it to reach Run and output.",
    },
    {
      id: "files",
      title: "Build with files and classes",
      scene: "files",
      body: [
        "Select a folder in the Explorer, then use + File or + Folder. The arrow expands/collapses a folder; the folder name selects where new items go. Rename/delete are beside each entry. Open files have tabs with ×, and the divider resizes Explorer.",
        "Local class imports use your project files. Java compiles its .java files together and new classes get a package/class skeleton. Java shortcuts include main, sout and Ctrl+Space. Ctrl / ⌘ + Enter runs code.",
      ],
      tip: "Open local folder connects a computer folder in supported browsers. Otherwise files stay in this browser. Export project backs up the file tree; Import project loads it.",
    },
    {
      id: "travel",
      title: "Tasks, bosses and transit",
      scene: "map",
      body: [
        "Tasks unlock in order. Complete all eight to challenge the district boss; defeating that boss unlocks the next district. Variable District has two free hub-repair previews before its Firewall challenge.",
        "Transit buildings are online in every unlocked district, even before its boss is finished. Click one, choose an unlocked world-map card and arrive beside that destination's transit building. You can return to earlier districts.",
      ],
      tip: "The world map, Progress page and tablet Study Path use the same category progress. Locked cards always explain their prerequisite.",
    },
    {
      id: "lighting",
      title: "Let code change the city",
      scene: "lighting",
      body: [
        "The Lighting console is available in every district. Choose All routes or one of Task 1–8, then print online/offline, a supported color, or both.",
        "Successful code updates the parallel route rails and corresponding terminal lights. Blue, green, red, white, yellow and purple are supported. Whole-map commands replace individual overrides. Settings save separately for each map and adventure.",
      ],
      tip: "The controls below change only this training preview. In the real console, run the code to apply the change; invalid output leaves the lights as they were.",
    },
    {
      id: "arcade",
      title: "Take a play break",
      scene: "arcade",
      body: [
        "At the arcade cabinet, choose Packet Dash or Signal Stack. These optional games never spend coding hearts or gems; personal bests belong to your adventure.",
        "Packet Dash: jump glitches and collect bits. Every three bits earns bonus points and recharges a shield. A round lasts 60 active seconds or until three shields are lost. Pause/resume keeps the round; Run again starts a new one. Signal Stack: time Drop relay, keep the overlap and build up to 14 relays.",
      ],
      tip: "Try a jump and a relay drop below. The story's delivery-drone repair is a separate coding mission, not an arcade round.",
    },
    {
      id: "saves",
      title: "Keep your adventures safe",
      scene: "save",
      body: [
        "Autosave keeps your character, tasks and progress on this browser/device, including after a normal or hard refresh. Different browsers, private browsing and cleared site data do not share that save. Other people opening the public game link have their own adventures.",
        "Menu → Save backup file downloads a .json snapshot to your computer's Downloads folder or the location you choose. Keeping that file on your hard drive is safer than relying on browser storage alone: you can restore it after site data is cleared, a browser is reset, or you copy the file to another computer. Normal refreshes already keep autosaves.",
        "To restore, choose Menu → Load backup file and select your saved .json. It adds a separate adventure without overwriting your other characters. A backup remembers the moment you saved it; it does not update itself. Download a fresh backup after each study session or important milestone.",
        "Use the tablet's Export project separately to save its coding folders/files, and Import project to restore them. Keep that project file alongside your adventure backup. Manage adventures lets you rename, restart or delete individual characters, or delete all game data from this browser. Back up anything you want to keep before restarting or deleting.",
      ],
      tip: "Try Save → Clear browser data → Load in this safe animation. Only the preview is cleared. The game has no account or automatic cloud sync; keep your downloaded backups on disk and make new ones as you progress.",
    },
    {
      id: "comfort",
      title: "Make the game comfortable",
      scene: "settings",
      body: [
        "Menu → Accessibility & controls lets you choose WASD, arrow keys or IJKL, larger text, high contrast and effects volume. Sound also has a quick mute button.",
        "The game respects your device's Reduce Motion preference. First-time training and district briefings can be skipped, resumed or replayed from Training. Turn automatic district introductions on or off in this handbook.",
      ],
      tip: "Try the preview controls below. They demonstrate the options; change your real preferences from Menu → Accessibility & controls.",
    },
    {
      id: "ready",
      title: "Your first repair is waiting",
      scene: "city",
      body: [
        `Begin with ${courier}'s mission in Variable District, or open the next available task from Progress or Tablet → Missions. Read its goal, try the code with Run, then Submit.`,
        "Follow Your Next Quest, check your progress and enjoy the optional activities. This handbook is always here when you need a reminder.",
      ],
      tip: "Finish training to return to your adventure. You can also go straight to your next mission.",
    },
  ];
}

export function districtTraining(area: AreaContent): TrainingChapter[] {
  const page = area.lesson.pages[0];
  return [
    {
      id: "district-welcome",
      title: `Welcome to ${area.name}`,
      scene: "map",
      body: [
        `District ${area.order} introduces ${area.lesson.title.toLowerCase()}. Find its lesson stand, eight numbered terminals, boss and transit building.`,
        `Your first task here is “${area.tasks[0]?.title}”. Each completed task opens the next. Use Progress or Tablet → Missions to see what is available.`,
      ],
      tip: "Locate Task 1 in the preview, then explore the real map. Route markers help you walk around its buildings.",
    },
    {
      id: "district-lesson",
      title: page?.heading ?? area.lesson.title,
      scene: "monitor",
      body: [
        page?.body ?? "Read the lesson, run an example, then try the first task.",
        "This sample uses your selected language. Run it freely and inspect the output before you start the district's graded missions.",
      ],
      tip: "The lesson and Guide tab remain available while you play. This preview cannot spend hearts or finish a mission.",
    },
    {
      id: "district-ready",
      title: `Bring ${area.name} online`,
      scene: "map",
      body: [
        `Complete eight tasks to face ${area.boss.name}. Defeat the boss to open the next district. Your next objective will stay in the HUD or mobile menu.`,
        "This district's transit is already online because the district is unlocked. You can return to any unlocked map, then arrive beside its transit building.",
      ],
      tip: "Your briefing is remembered with this adventure and its backup. Replay the current district briefing from Training whenever you need it.",
    },
  ];
}
