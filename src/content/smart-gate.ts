import type { Lang } from "../runners/types";
import { wrapBeginnerProgram } from "./first-program";

export const GATE_LESSONS = [
  {
    id: "welcome",
    title: "Meet the Smart Gate",
    story:
      "A delivery robot needs to reach the clinic. The gate reads an energy value and chooses whether to open. Let's see a real condition in action.",
    concept: "An if statement chooses what to do when a condition is true. Else handles the other case.",
    goal: "Run the gate example with a delivery robot. Read its OPEN or CLOSED signal.",
    clues: [
      "Look for the question inside if.",
      "battery >= 4 asks whether the robot has at least four energy cells.",
      "Six is at least four, so the OPEN branch runs.",
    ],
  },
  {
    id: "predict",
    title: "Predict the other branch",
    story:
      "This robot has only 2 cells. The same program asks whether battery is at least 4. Which signal will it print?",
    concept: "The condition can be true or false. False sends execution to the else branch.",
    goal: "Predict OPEN or CLOSED, then run the working program to check.",
    clues: ["Compare 2 with 4.", "2 is less than 4, so battery >= 4 is false.", "The else branch prints CLOSED."],
  },
  {
    id: "branches",
    title: "Follow a decision",
    story:
      "Replay the example you ran: check the condition, skip the true branch, then run else. Only one branch executes.",
    concept: "If and else are alternatives. A program does not run both branches of this decision.",
    goal: "Step through the decision and identify the branch that printed CLOSED.",
    clues: [
      "The example started with 2 cells.",
      "The condition was false, so the true branch was skipped.",
      "Choose The else branch.",
    ],
  },
  {
    id: "modify",
    title: "Include the boundary",
    story:
      "The clinic accepts robots with at least 4 cells. This draft uses > and accidentally rejects a robot with exactly 4. Repair the comparison.",
    concept: "> means greater than. >= means greater than or equal to.",
    goal: "Write a condition that closes for 2 cells and opens for both 4 and 6.",
    clues: [
      "Pay attention to the robot with exactly 4 cells.",
      "You need a comparison that includes equality.",
      "Use battery >= 4. This is the condition only; the surrounding if/else is supplied.",
    ],
  },
  {
    id: "challenge",
    title: "Protect the clinic",
    story:
      "Energy alone isn't enough. Visitors without a delivery badge must stay outside. Combine the badge flag with your energy comparison.",
    concept: "AND requires both conditions to be true. isDelivery stores a true/false value.",
    goal: "Open only for a delivery robot with at least 4 cells. Test your condition against five visitors, including the boundary case.",
    clues: [
      "A visitor with 6 cells still needs a delivery badge.",
      "Combine isDelivery and battery >= 4 using AND.",
      "Use isDelivery && battery >= 4 in Java/JavaScript/TypeScript, or isDelivery and battery >= 4 in Python.",
    ],
  },
] as const;
export type GateInput = { delivery: boolean; battery: number; label: string };
export const GATE_CHECKS: readonly GateInput[] = [
  { delivery: false, battery: 6, label: "Visitor · 6 cells" },
  { delivery: true, battery: 2, label: "Delivery · 2 cells" },
  { delivery: true, battery: 4, label: "Delivery · 4 cells" },
  { delivery: false, battery: 4, label: "Visitor · 4 cells" },
  { delivery: true, battery: 6, label: "Delivery · 6 cells" },
];
export function gateExpected(input: GateInput, badges = true): "OPEN" | "CLOSED" {
  return input.battery >= 4 && (!badges || input.delivery) ? "OPEN" : "CLOSED";
}
export function gateProgram(lang: Lang, condition: string, input: GateInput): string {
  const flag = lang === "python" ? (input.delivery ? "True" : "False") : String(input.delivery);
  const body =
    lang === "python"
      ? `isDelivery = ${flag}\nbattery = ${input.battery}\nif ${condition}:\n    print("OPEN")\nelse:\n    print("CLOSED")`
      : `${lang === "java" ? "boolean" : lang === "typescript" ? "let" : "let"} isDelivery${lang === "typescript" ? ": boolean" : ""} = ${flag};\n${lang === "java" ? "int" : "let"} battery${lang === "typescript" ? ": number" : ""} = ${input.battery};\nif (${condition}) {\n    ${lang === "java" ? "System.out.println" : "console.log"}("OPEN");\n} else {\n    ${lang === "java" ? "System.out.println" : "console.log"}("CLOSED");\n}`;
  return wrapBeginnerProgram(lang, body);
}
