export type GuideView =
  | "world"
  | "tools"
  | "tablet"
  | "map"
  | "lighting"
  | "arcade"
  | "menu"
  | "character"
  | "comfort"
  | "title";
export type GuideStep = {
  id: string;
  title: string;
  text: string;
  view: GuideView;
  tab?: number;
  target?: string;
  button?: string;
  download?: boolean;
};
export function cityGuide(courier: string): GuideStep[] {
  return [
    {
      id: "welcome",
      title: `Hi, I'm ${courier}!`,
      view: "world",
      text: "Welcome to CodeQuest. I'll walk beside you and point to the real controls as we explore. Learn coding, repair a tech city and take play breaks. Your adventure is paused during this tour. Use Next, Back or Skip whenever you want.",
    },
    {
      id: "status",
      title: "Your developer's dashboard",
      view: "tools",
      target: ".mobile-player-stats,.hud .stats",
      text: "These are your hearts, gems and district task count. Each district has eight coding tasks and a boss. Easy, normal and hard tasks earn 1, 2 and 3 gems. Boss hints spend gems; free practice doesn't.",
    },
    {
      id: "movement",
      title: "Walk, tap and explore",
      view: "world",
      target: ".rotate-card,.mobile-pad,.game-footer",
      text: "Move with WASD or arrows, or click the ground. A marker and dotted route guide you around buildings. Hold and drag to steer. On a phone, rotate to landscape and use the D-pad or tap a destination. Walk near a person or terminal and use E / Space.",
    },
    {
      id: "tools",
      title: "Your tools are always nearby",
      view: "tools",
      target: ".mobile-menu-actions,.menu-actions",
      text: "Tablet, World map and Menu stay in the top bar. Menu contains Mission, Lighting, Lesson, Progress, Training, Guide tour, backups, character settings and sound. On phones, use the hamburger menu. Training opens the detailed handbook; Guide tour brings me back beside the real controls.",
    },
    {
      id: "tablet",
      title: "Meet your wrist tablet",
      view: "tablet",
      tab: 0,
      target: ".studio-tabs",
      text: "T or Tablet opens this workspace. Its seven tabs are Code, Examples, Missions, Guide, Daily Quest, Study Path and Projects. I'll open each one for you. Escape or × puts the tablet away after the tour.",
    },
    {
      id: "code",
      title: "Write real programs",
      view: "tablet",
      tab: 0,
      target: ".studio-code-grid",
      text: "This is your real editor, using the language you selected. Write programs, use classes and imports, then inspect the output. Free practice cannot spend hearts or complete a graded mission. This tour keeps your current files and code.",
    },
    {
      id: "files",
      title: "Files, folders and classes",
      view: "tablet",
      tab: 0,
      target: ".studio-explorer",
      text: "Select a folder, then use + File or + Folder. Its arrow expands or collapses it. Rename/delete sit beside entries, × closes file tabs, and the divider resizes Explorer. Java classes start with a package/class skeleton; main and sout expand into common code.",
    },
    {
      id: "run",
      title: "Run, then read the output",
      view: "tablet",
      tab: 0,
      button: "Run practice code",
      text: "Run executes the code in your files. Its output is below the editor. Drag the divider above Output up or down to resize it. Ctrl / Command + Enter also runs. The first language startup can take a moment. I won't run or overwrite your code during this tour.",
    },
    {
      id: "examples",
      title: "Starters and debugging practice",
      view: "tablet",
      tab: 1,
      target: ".studio-examples",
      text: "Examples gives you starters, debugging exercises and predict-before-run activities. An Insert button replaces the active draft, so keep a copy of work you want first. Nothing is inserted by this tour.",
    },
    {
      id: "console",
      title: "Read what your code did",
      view: "tablet",
      tab: 0,
      target: ".studio-inline-console",
      text: "Output stays beneath Code. Read errors and line numbers, fix the code and run again. Drag the handle above Output up for more room or down for a larger editor. Arrow keys resize it too, and your preferred height is remembered.",
    },
    {
      id: "missions",
      title: "Find the next repair",
      view: "tablet",
      tab: 2,
      target: ".studio-missions",
      text:
        "Missions lists this district's eight tasks and their locked, available or complete state. In Variable District, meet " +
        courier +
        ", make your training badge and repair the delivery drone. Read a task's goal, use Run freely, then Submit when ready.",
    },
    {
      id: "grading",
      title: "Run and Submit do different jobs",
      view: "tablet",
      tab: 2,
      target: ".studio-missions",
      text: "Submit checks expected output and code rules. Wrong graded answers, broken task rules or a program that runs too long can cost a heart. Syntax/compiler/runtime/runner errors don't. Losing all hearts resets only that district. Run and tablet practice are always free.",
    },
    {
      id: "lesson",
      title: "Keep the lesson close",
      view: "tablet",
      tab: 3,
      target: ".studio-guide",
      text: "Guide explains the concept used in this district and includes examples. Lesson in the main tools opens the same material. You can return whenever you need a reminder; no timer makes you rush through a coding task.",
    },
    {
      id: "daily",
      title: "A small challenge each day",
      view: "tablet",
      tab: 4,
      target: ".studio-daily",
      text: "Daily Quest is an optional free challenge that changes each day. Your draft and completion are saved for this adventure. It's an extra way to practise; it doesn't block the city or spend your mission hearts.",
    },
    {
      id: "study",
      title: "Follow the learning path",
      view: "tablet",
      tab: 5,
      target: ".studio-study",
      text: "Study Path follows the coding categories in order. Each has eight tasks and a boss, with prediction and code practice. This progress is shared with the matching city district, so the tablet and world map agree about what is unlocked.",
    },
    {
      id: "projects",
      title: "Build something across files",
      view: "tablet",
      tab: 6,
      target: ".studio-projects",
      text: "Projects turns concepts into a small app with milestone goals. Build across files/classes, run it and compare with the expected result. Export project saves the coding file tree to disk; Import project restores it. Adventure backups are separate.",
    },
    {
      id: "map",
      title: "23 districts, one adventure",
      view: "map",
      target: ".world-node:not(:disabled)",
      text: "Complete eight tasks to open a district boss; defeat it to unlock the next map. Transit is already online in every unlocked district, so you can go back. Click its building, choose an unlocked map and arrive beside the destination's transit.",
    },
    {
      id: "lighting",
      title: "Make code change the city",
      view: "lighting",
      target: ".lighting-console select",
      text: "Choose All routes or one task's circuit, then run code that prints online/offline and a color. Blue, green, red, white, yellow and purple change the route lights. Invalid output leaves the lights alone. Each district/adventure remembers its own lighting.",
    },
    {
      id: "arcade",
      title: "Take a play break",
      view: "arcade",
      target: ".arcade-game-grid",
      text: "Find the arcade cabinet to play Packet Dash or Signal Stack. Jump glitches and collect bits, or time relay drops to build a tower. These games have their own records and never spend coding hearts or gems. The delivery drone is a separate coding mission.",
    },
    {
      id: "save",
      title: "Keep a backup on your hard drive",
      view: "menu",
      button: "Save backup file",
      download: true,
      text: "Autosave survives refreshes, but clearing browser data or changing devices can lose it. Save backup file downloads a .json snapshot to Downloads or a folder you choose. Keep it on your hard drive and download a fresh copy after each study session. The button below downloads your current adventure.",
    },
    {
      id: "load",
      title: "Bring a saved adventure back",
      view: "menu",
      button: "Load backup file",
      text: "Load backup file lets you choose that .json and adds a separate adventure. It restores the moment you saved, without replacing your other characters. Use Export project separately for tablet files. The handbook has a safe animation showing browser-data loss and restoration from disk.",
    },
    {
      id: "character",
      title: "Your character, your choice",
      view: "character",
      target: ".character-rename",
      text: "Rename keeps all progress and coding work. Restart starts this adventure at level 1; Delete removes this character. Both require typed confirmation and offer a backup first. Manage adventures also has Delete all game data for this browser. Other players and downloaded backups stay untouched.",
    },
    {
      id: "comfort",
      title: "Play comfortably",
      view: "comfort",
      target: ".accessibility-setting",
      text: "Choose movement keys, larger text, higher contrast and effects volume here. Sound also has a quick mute. The game follows your device's Reduce Motion setting. This tour has Show all text, Back and Skip, and the detailed handbook is always available.",
    },
    {
      id: "ready",
      title: "Let's bring the city online",
      view: "world",
      text:
        "You're ready. Follow Your Next Quest, talk to " +
        courier +
        " in Variable District, or open the next available mission. Read → Run → inspect output → Submit. Replay Guide tour anytime, or use Training for the interactive handbook and each district's briefing.",
    },
  ];
}
export const TITLE_GUIDE: GuideStep[] = [
  {
    id: "title-welcome",
    title: "Welcome to CodeQuest",
    view: "title",
    text: "This is your launch screen. I'll point out each part before you choose an adventure. Once you enter the city, a longer tour explains the real tablet, missions, maps, backups and character controls.",
  },
  {
    id: "language",
    title: "Pick your coding language",
    view: "title",
    target: ".language-grid",
    text: "Choose JavaScript, Python, TypeScript or Java. Each has its own color, real code runner and language-specific lessons. You can keep several adventures, including different languages, without replacing earlier progress.",
  },
  {
    id: "avatar",
    title: "Choose your developer",
    view: "title",
    target: ".hero-choices",
    text: "Choose a boy or girl developer, wearing a hoodie and backpack. Your first courier is the other developer, so you won't meet an identical character in the first district.",
  },
  {
    id: "name",
    title: "Give the adventure a name",
    view: "title",
    target: ".hero-form input",
    text: "Type a character name using 1–16 letters, numbers or spaces. Start adventure creates a separate save. You can rename, restart or delete it later from Manage adventures.",
  },
  {
    id: "adventures",
    title: "Return to your saved characters",
    view: "title",
    button: "Manage adventures",
    text: "Each saved adventure appears under its language. Select one to resume. Manage adventures lets you switch, rename, restart or delete characters, or erase this browser's local game profile. Progress belongs to this browser/device, not everyone opening the public link.",
  },
  {
    id: "backup",
    title: "Keep and restore backups",
    view: "title",
    target: ".backup-controls",
    text: "Load adventure backup imports a downloaded .json as a separate adventure. After entering the game, Menu → Save backup file downloads your progress to your hard drive. Save fresh copies regularly, and export tablet coding projects separately.",
  },
  {
    id: "title-ready",
    title: "Ready for the city?",
    view: "title",
    target: ".hero-form button[type=submit]",
    text: "Finish this tour, choose your language and developer, then start. I'll meet you in the city for the full walkthrough. Guide tour replays this introduction; How to play opens the detailed interactive handbook.",
  },
];
