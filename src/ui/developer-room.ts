import { canEquipRoom, defaultRoom, REWARDS, type RewardId, type RoomState } from "../core/developer-room";
import { button, el } from "./dom";
import "./developer-room.css";

export function openDeveloperRoom(host: {
  name: string;
  robotName: string;
  room?: RoomState;
  earned: RewardId[];
  panel(): HTMLElement;
  save(room: RoomState): boolean;
  hero(color: RoomState["hoodie"]): CanvasImageSource;
  workshop(): void;
  next?(): void;
}): void {
  let room = structuredClone(host.room ?? defaultRoom());
  const panel = host.panel();
  panel.classList.add("developer-room-panel");
  const scene = el("div", "developer-room-scene"),
    floor = el("div", "room-floor"),
    window = el("div", "room-window"),
    shelf = el("div", "room-shelf"),
    desk = el("div", "room-desk"),
    monitor = el("div", "room-monitor"),
    chair = el("div", "room-chair"),
    hero = el("canvas", "room-hero"),
    robot = el("div", "room-robot"),
    plant = el("div", "room-plant"),
    lamp = el("div", "room-lamp"),
    trophy = el("div", "room-trophy"),
    name = el("p", "room-name", `${host.name}'s developer room`);
  for (let n = 0; n < 5; n++) window.append(el("i"));
  for (let n = 0; n < 4; n++) monitor.append(el("i"));
  shelf.append(el("i"), el("i"), el("i"));
  desk.append(monitor, el("span", "room-keyboard"), el("span", "room-mug"));
  robot.append(el("i", "room-robot-face"), el("i", "room-robot-antenna"));
  robot.setAttribute("aria-label", `${host.robotName}, your robot companion`);
  plant.append(el("i"), el("i"), el("i"));
  trophy.append(el("span", "", "★"));
  hero.width = 96;
  hero.height = 112;
  hero.setAttribute("aria-label", `${host.name} wearing the selected hoodie`);
  scene.setAttribute("role", "img");
  scene.setAttribute(
    "aria-label",
    "Your developer room with a coding desk, city window, character and earned decorations.",
  );
  scene.append(floor, window, shelf, chair, desk, hero, robot, plant, lamp, trophy, name);
  const controls = el("div", "room-controls"),
    status = el("p", "feedback");
  status.setAttribute("role", "status");
  const next = host.next ? button("Continue my adventure", host.next, "button primary") : null;
  if (next) next.hidden = !host.room;
  panel.append(
    el(
      "p",
      "zero-concept",
      `${host.earned.length}/10 rewards earned through learning, building and playing. Hoodie colors and robot parts also appear in the city. Your room and earned rewards belong to this adventure and its disk backups.`,
    ),
    scene,
    controls,
    status,
    button("Developer workshop", host.workshop),
  );
  function draw() {
    scene.dataset.wall = room.wall;
    scene.style.setProperty("--robot-color", { cyan: "#6be9ef", rose: "#f3a4cc", gold: "#f4cf78" }[room.robot]);
    robot.dataset.antenna = room.antenna;
    plant.hidden = !room.decor.includes("plant");
    lamp.hidden = !room.decor.includes("lamp");
    trophy.hidden = !room.decor.includes("trophy");
    const ctx = hero.getContext("2d");
    ctx?.clearRect(0, 0, 96, 112);
    ctx?.drawImage(host.hero(room.hoodie), 0, 0, 96, 112, 0, 0, 96, 112);
    name.textContent = `${host.name}'s developer room · ${host.robotName} is home`;
  }
  function select(next: RoomState, key: string) {
    if (!canEquipRoom(next, host.earned)) return;
    room = next;
    status.textContent = host.save(room)
      ? "Saved with your adventure. Download an adventure backup to keep these rewards outside this browser."
      : "Device saving unavailable. Download an adventure backup before leaving.";
    draw();
    render();
    panel.querySelector<HTMLButtonElement>(".room-continue")?.removeAttribute("hidden");
    controls.querySelector<HTMLButtonElement>(`[data-room-choice="${key}"]`)?.focus();
  }
  function option(
    group: HTMLElement,
    key: string,
    title: string,
    next: RoomState,
    reward?: RewardId,
    selected = false,
  ) {
    const available = !reward || host.earned.includes(reward),
      wrap = el("div", "room-option"),
      b = button(title, () => select(next, key), "button room-choice");
    b.dataset.roomChoice = key;
    b.disabled = !available;
    b.setAttribute("aria-pressed", String(selected));
    wrap.append(
      b,
      el("small", "", available ? (selected ? "Equipped" : "Available") : REWARDS[reward as RewardId].requirement),
    );
    group.append(wrap);
  }
  function section(title: string): HTMLElement {
    const group = el("section", "room-control-section");
    group.append(el("h3", "", title));
    controls.append(group);
    return group;
  }
  function render() {
    controls.replaceChildren();
    const wardrobe = section("Your hoodie");
    for (const color of ["default", "mint", "amber", "violet"] as const)
      option(
        wardrobe,
        `hoodie-${color}`,
        color === "default" ? "Original hoodie" : `Wear ${color} hoodie`,
        { ...room, hoodie: color },
        color === "default" ? undefined : `hoodie-${color}`,
        room.hoodie === color,
      );
    const shells = section("Robot shell");
    for (const color of ["cyan", "rose", "gold"] as const)
      option(
        shells,
        `robot-${color}`,
        `Use ${color} shell`,
        { ...room, robot: color },
        color === "cyan" ? undefined : `robot-${color}`,
        room.robot === color,
      );
    const parts = section("Robot antenna");
    for (const part of ["standard", "dish", "double"] as const)
      option(
        parts,
        `antenna-${part}`,
        part === "standard" ? "Standard antenna" : part === "dish" ? "Satellite antenna" : "Twin antenna",
        { ...room, antenna: part },
        part === "standard" ? undefined : `antenna-${part}`,
        room.antenna === part,
      );
    const walls = section("Room wall");
    for (const color of ["navy", "plum", "forest"] as const)
      option(walls, `wall-${color}`, `Wall ${color}`, { ...room, wall: color }, undefined, room.wall === color);
    const decor = section("Earned decorations");
    for (const item of ["plant", "lamp", "trophy"] as const) {
      const id = `decor-${item}` as RewardId,
        on = room.decor.includes(item);
      option(
        decor,
        id,
        `${on ? "Remove" : "Add"} ${REWARDS[id].name}`,
        { ...room, decor: on ? room.decor.filter((d) => d !== item) : [...room.decor, item] },
        id,
        on,
      );
    }
  }
  draw();
  render();
  if (next) {
    next.classList.add("room-continue");
    panel.append(next);
  }
}
