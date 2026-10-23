export const CONTROL_SCHEMES = ["wasd", "arrows", "ijkl"] as const;
export type ControlScheme = (typeof CONTROL_SCHEMES)[number];
export type DirectionKeys = Readonly<{ up: string; down: string; left: string; right: string }>;

export function directionKeys(scheme: ControlScheme): DirectionKeys {
  if (scheme === "arrows") return { up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT" };
  if (scheme === "ijkl") return { up: "I", down: "K", left: "J", right: "L" };
  return { up: "W", down: "S", left: "A", right: "D" };
}

export function controlHint(scheme: ControlScheme): string {
  if (scheme === "arrows") return "Arrow keys";
  return scheme === "ijkl" ? "IJKL / arrows" : "WASD / arrows";
}
