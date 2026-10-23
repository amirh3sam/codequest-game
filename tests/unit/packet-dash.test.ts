import { describe, expect, it } from "vitest";
import { collectPacketDashBit } from "../../src/core/packet-dash";

describe("Packet Dash data combos", () => {
  it("rewards every third collected bit with bonus points and a shield", () => {
    const first = collectPacketDashBit({ collected: 0, combo: 0, bonus: 0, shields: 2 });
    const second = collectPacketDashBit(first);
    const third = collectPacketDashBit(second);

    expect(first).toEqual({ collected: 1, combo: 1, bonus: 0, shields: 2 });
    expect(second).toEqual({ collected: 2, combo: 2, bonus: 0, shields: 2 });
    expect(third).toEqual({ collected: 3, combo: 0, bonus: 100, shields: 3 });
  });

  it("keeps combo bonus points when shields are already full", () => {
    let state = { collected: 0, combo: 0, bonus: 0, shields: 3 };
    for (let bit = 0; bit < 3; bit++) state = collectPacketDashBit(state);
    expect(state).toEqual({ collected: 3, combo: 0, bonus: 100, shields: 3 });
  });
});
