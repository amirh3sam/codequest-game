import { isDroneRepaired } from "../core/drone-mission";
import type { GameState } from "../core/state";

export type AdventureStoryBeat = Readonly<{ chapter: string; title: string; message: string }>;

/** Keep the main goal tied to the player's saved choices and current district. */
export function adventureStoryBeat(state: GameState): AdventureStoryBeat {
  const courier = state.hero.kind === "boy" ? "Ava" : "Kai";
  const variableDistrict = state.areas.variables;
  if (state.currentArea === "conditions") {
    const junction = state.areas.conditions;
    if (junction.bossDefeated)
      return {
        chapter: "CHAPTER 02 · ROUTE THE SIGNAL",
        title: "The city can choose a safe path again.",
        message: "Logic Junction is stable. The next relay will teach the network to repeat and scale its work.",
      };
    if (junction.solved.length === 8)
      return {
        chapter: "CHAPTER 02 · ROUTE THE SIGNAL",
        title: "The switchboard is ready for its firewall.",
        message: "All eight route rules are repaired. Defeat the junction Firewall to reconnect the next relay.",
      };
    return {
      chapter: "CHAPTER 02 · ROUTE THE SIGNAL",
      title: "Packets are arriving at the wrong gates.",
      message: "Repair Logic Junction with conditions so each message takes the safe route through the city.",
    };
  }
  if (variableDistrict.bossDefeated)
    return {
      chapter: "CHAPTER 01 · RESTORE THE RELAY",
      title: "The first city relay is online.",
      message: "The route is open. Head to Logic Junction and teach the network to choose where each packet goes.",
    };
  if (variableDistrict.solved.length === 8)
    return {
      chapter: "CHAPTER 01 · RESTORE THE RELAY",
      title: "The data hub is ready to restart.",
      message: "Use the repaired values and signals to bring the hub online and open the route to Logic Junction.",
    };
  if (isDroneRepaired(state)) {
    const choice = state.discoveries?.beacon;
    const community =
      choice === "garden"
        ? "Mina is preparing a courtyard garden night"
        : choice === "arcade"
          ? "Mina is organizing a neighborhood game night"
          : "Mina's courtyard beacon is calling for help";
    return {
      chapter: "CHAPTER 01 · RESTORE THE RELAY",
      title: "The courier route is moving again.",
      message: `${courier} delivered the replacement part. ${community}; now finish the data hub repairs to restore the city's first relay.`,
    };
  }
  return {
    chapter: "CHAPTER 01 · RESTORE THE RELAY",
    title: "The city's network has gone dark.",
    message: `Help ${courier} charge the delivery drone, then repair the data hub to bring the first city relay back online.`,
  };
}
