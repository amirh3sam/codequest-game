import type { Lang } from "../runners/types";

export const BEACON_EVENTS = {
  garden: {
    title: "Garden night",
    description: "A quiet evening of rooftop plants, shared stories and mint lights.",
    reply: "I'll bring seedlings. Kai can deliver the pots now that the lane is open. See you under the mint lights!",
    color: "#85edc0",
    tint: 0x85edc0,
  },
  arcade: {
    title: "Arcade night",
    description: "An evening of co-op games, friendly challenges and violet lights.",
    reply: "I'll set up the co-op games. Kai is bringing the controllers. Look for the violet lights!",
    color: "#c5a0ff",
    tint: 0xc5a0ff,
  },
} as const;

/** The starter stores the right message but still prints a literal. Learners connect the variable to output. */
export function beaconCode(lang: Lang, title: string, connected = false): string {
  const text = JSON.stringify(title),
    output = connected ? "eventName" : '"Offline"';
  switch (lang) {
    case "javascript":
      return `let eventName = ${text};\nconsole.log(${output});`;
    case "typescript":
      return `let eventName: string = ${text};\nconsole.log(${output});`;
    case "python":
      return `eventName = ${text}\nprint(${output})`;
    case "java":
      return `public class Main {\n  public static void main(String[] args) {\n    String eventName = ${text};\n    System.out.println(${output});\n  }\n}`;
  }
}
