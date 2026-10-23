import { describe, expect, it } from "vitest";
import { adventureStoryBeat } from "../../src/content/adventure-story";
import { createGame } from "../../src/core/state";

describe("adventureStoryBeat", () => {
  it("introduces the outage and names the courier opposite the player's hero", () => {
    const boy = adventureStoryBeat(createGame("javascript", { kind: "boy", name: "Ari" }, "now"));
    const girl = adventureStoryBeat(createGame("javascript", { kind: "girl", name: "Ada" }, "now"));

    expect(boy.message).toContain("Help Ava charge the delivery drone");
    expect(girl.message).toContain("Help Kai charge the delivery drone");
  });

  it("remembers the player's community choice after the delivery", () => {
    const base = createGame("javascript", { kind: "girl", name: "Ada" }, "now");
    const delivered = {
      ...base,
      discoveries: { beacon: "garden" as const },
      areas: {
        ...base.areas,
        variables: { ...base.areas.variables, solved: ["variables-1", "variables-2"] },
      },
    };

    const story = adventureStoryBeat(delivered);
    expect(story.title).toBe("The courier route is moving again.");
    expect(story.message).toContain("Mina is preparing a courtyard garden night");
  });
});
