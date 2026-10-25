import { expect, it } from "vitest";
import { makeAdventureBackup, parseAdventureBackup } from "../../src/core/backup";
import { type CompanionState, checkpoint, deliveryStops, isCompanion } from "../../src/core/companion";
import { createGame } from "../../src/core/state";

it("accepts delivery output only when it names three distinct existing terminals", () => {
  expect(deliveryStops("2\n1\n3\n")).toEqual([2, 1, 3]);
  for (const invalid of ["1 1 2", "1 2 9", "1 2", "1 2 3 4", "hello 1 2 3", "1.0 2 3", ""])
    expect(deliveryStops(invalid)).toBeNull();
});
it("saves ordered physical checkpoints once and rejects stale arrivals", () => {
  const c: CompanionState = {
    enabled: true,
    draft: "for…",
    trips: 0,
    trip: { id: "route-1", area: "variables", stops: [2, 1, 3], next: 0 },
  };
  expect(checkpoint(c, "old", 1)).toBe(c);
  expect(checkpoint(c, "route-1", 3)).toBe(c);
  const first = checkpoint(c, "route-1", 1);
  expect(checkpoint(first, "route-1", 1)).toBe(first);
  const final = checkpoint(checkpoint(first, "route-1", 2), "route-1", 3);
  expect(final.trips).toBe(1);
  expect(checkpoint(final, "route-1", 3)).toBe(final);
  const state = {
    ...createGame("java", { name: "Ada", kind: "girl" }, "2026-10-24T20:00:00Z"),
    journey: { companion: first },
  };
  expect(parseAdventureBackup(JSON.stringify(makeAdventureBackup(state))).state.journey?.companion).toEqual(first);
  expect(isCompanion({ ...c, trip: { ...c.trip, next: 4 } })).toBe(false);
  expect(isCompanion({ ...c, trip: { ...c.trip, stops: [1, 1, 2] } })).toBe(false);
});
