import { describe, expect, it } from "vitest";
import { GATE_CHECKS, gateExpected, gateProgram } from "../../src/content/smart-gate";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { GATE_STEPS, isJourney, newLesson } from "../../src/core/journey";
import { isGameState } from "../../src/core/save";
import { createGame } from "../../src/core/state";

describe("learning journey saves", () => {
  it("preserves old adventures and includes paused chapter drafts in disk backups", () => {
    const base = createGame("java", { name: "Ada", kind: "girl" }, "2026-10-24T20:00:00Z");
    expect(isGameState(base)).toBe(true);
    const gate = {
      ...newLesson(),
      step: 3,
      completed: GATE_STEPS.slice(0, 3),
      status: "paused" as const,
      drafts: { modify: "battery >= 4" },
    };
    const state = { ...base, journey: { gate } };
    expect(isGameState(state)).toBe(true);
    expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(state))).state.journey).toEqual(state.journey);
    expect(state.areas).toEqual(base.areas);
  });
  it("rejects skipped lessons, false completion and invalid drafts", () => {
    const base = newLesson();
    for (const gate of [
      { ...base, completed: ["challenge"] },
      { ...base, status: "complete" },
      { ...base, step: 3 },
      { ...base, drafts: { script: "x" } },
      { ...base, drafts: { modify: 3 } },
      { ...base, drafts: { modify: "x".repeat(16001) } },
    ])
      expect(isJourney({ gate })).toBe(false);
    expect(isJourney({ gate: { ...base, completed: [...GATE_STEPS], step: 4, status: "complete" } })).toBe(true);
    expect(isJourney(null)).toBe(false);
  });
});
it("requires the delivery flag and includes the threshold boundary in gate checks", () => {
  expect(GATE_CHECKS.map((test) => gateExpected(test))).toEqual(["CLOSED", "CLOSED", "OPEN", "CLOSED", "OPEN"]);
  expect(gateExpected({ delivery: false, battery: 6, label: "Visitor" }, false)).toBe("OPEN");
  for (const lang of ["javascript", "typescript", "python", "java"] as const) {
    const code = gateProgram(
      lang,
      lang === "python" ? "isDelivery and battery >= 4" : "isDelivery && battery >= 4",
      GATE_CHECKS[0],
    );
    expect(code).toContain(lang === "python" ? "isDelivery = False" : "= false;");
    expect(code).toContain("battery");
    expect(code).toContain('"OPEN"');
    expect(code).toContain('"CLOSED"');
  }
});
