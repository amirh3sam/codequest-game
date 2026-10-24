import { type GameState, isAreaUnlocked } from "./state";

export const LIGHT_COLORS = {
  blue: 0x66d9ff,
  green: 0x65ee95,
  red: 0xff666e,
  white: 0xeefaff,
  yellow: 0xffdd65,
  purple: 0xcda0ff,
} as const;
export type LightColor = keyof typeof LIGHT_COLORS;
export type LightCommand = Readonly<{ power: "online" | "offline"; color: LightColor }>;
export const LIGHT_TARGETS = [
  "all",
  "terminal-1",
  "terminal-2",
  "terminal-3",
  "terminal-4",
  "terminal-5",
  "terminal-6",
  "terminal-7",
  "terminal-8",
] as const;
export type LightTarget = (typeof LIGHT_TARGETS)[number];
export type DistrictLights = Readonly<Partial<Record<LightTarget, LightCommand>>>;
export const DEFAULT_LIGHTS: LightCommand = { power: "online", color: "blue" };

export function resolveLights(lights: DistrictLights | undefined, target: LightTarget): LightCommand {
  return lights?.[target] ?? lights?.all ?? DEFAULT_LIGHTS;
}

export function isDistrictLights(value: unknown): value is DistrictLights {
  return Boolean(
    value &&
      typeof value === "object" &&
      !Array.isArray(value) &&
      Object.entries(value).every(
        ([key, command]) =>
          LIGHT_TARGETS.some((target) => target === key) &&
          command &&
          typeof command === "object" &&
          (command.power === "online" || command.power === "offline") &&
          Object.hasOwn(LIGHT_COLORS, command.color),
      ),
  );
}

/** Apply the output of a real program; a status or color alone keeps the other setting. */
export function parseLightOutput(output: string, current: LightCommand): LightCommand {
  const words = output
    .trim()
    .toLowerCase()
    .split(/[\s,]+/)
    .filter(Boolean);
  if (words.length < 1 || words.length > 2)
    throw new Error("Print online or offline, a color, or one of each on separate lines.");
  let power = current.power,
    color = current.color;
  const seen = new Set<string>();
  for (const word of words) {
    if (word === "online" || word === "offline") {
      if (seen.has("power")) throw new Error("Choose one power setting: online or offline.");
      power = word;
      seen.add("power");
    } else if (Object.hasOwn(LIGHT_COLORS, word)) {
      if (seen.has("color")) throw new Error("Print one color for the selected part of the map.");
      color = word as LightColor;
      seen.add("color");
    } else
      throw new Error(
        `Unknown lighting command: ${word}. Use online, offline, blue, green, red, white, yellow or purple.`,
      );
  }
  return { power, color };
}

export function setDistrictLights(
  state: GameState,
  target: LightTarget,
  command: LightCommand,
  updatedAt: string,
): GameState {
  if (!isAreaUnlocked(state, state.currentArea) || !isDistrictLights({ [target]: command })) return state;
  const area = state.areas[state.currentArea];
  const lighting = target === "all" ? { all: command } : { ...area.lighting, [target]: command };
  return { ...state, updatedAt, areas: { ...state.areas, [state.currentArea]: { ...area, lighting } } };
}
