import { describe, expect, it } from "vitest";
import { controlHint, directionKeys } from "../../src/game/control-scheme";

describe("keyboard movement schemes", () => {
  it("provides distinct four-way controls and keeps the user-facing labels clear", () => {
    expect(directionKeys("wasd")).toEqual({ up: "W", down: "S", left: "A", right: "D" });
    expect(directionKeys("arrows")).toEqual({ up: "UP", down: "DOWN", left: "LEFT", right: "RIGHT" });
    expect(directionKeys("ijkl")).toEqual({ up: "I", down: "K", left: "J", right: "L" });
    expect(controlHint("wasd")).toBe("WASD / arrows");
  });
});
