import type { BeginnerCodeStep, BeginnerStep } from "../core/beginner";
import type { Lang } from "../runners/types";

export const FIRST_PROGRAM: Record<
  BeginnerStep,
  { title: string; concept: string; story: string; goal: string; hints: string[] }
> = {
  instructions: {
    title: "A robot needs your instructions",
    concept: "A program is a list of instructions, followed in order.",
    story: "The clinic needs a repair kit. Your little robot can help, but it needs you to explain each step.",
    goal: "Arrange three instruction cards so the robot reaches supplies, collects the kit and delivers it.",
    hints: [
      "Where does the kit live? Go there first.",
      "Collect the kit before trying to deliver it.",
      "Use Move → Collect → Deliver. Running instructions in a different order changes what happens.",
    ],
  },
  name: {
    title: "Give your robot a name",
    concept: "A variable is a name for a stored value. Text inside quotes is called a string.",
    story: "Every rescue partner deserves a name. Change the text stored in robotName and run your first real program.",
    goal: "Replace Pixel with your own robot name: 1–16 letters, numbers, spaces or hyphens. Keep the quotes.",
    hints: [
      "Change the text between the quote marks.",
      "robotName is the variable. Its quoted value is the name the robot displays.",
      'Try the name "Nova". The print instruction below reads robotName and shows its value.',
    ],
  },
  predict: {
    title: "What will the battery contain?",
    concept: "Numbers can be stored and changed. += adds to the value already stored.",
    story: "The robot starts with 2 energy cells, then receives 3 more. Take a guess before running the code.",
    goal: "Choose a prediction, then run the working example. A surprising result is a useful discovery.",
    hints: [
      "Start with 2 cells.",
      "Add 3 more to the starting 2.",
      "2 + 3 = 5. The program prints the new battery value.",
    ],
  },
  investigate: {
    title: "Follow the value through the code",
    concept: "Assignment stores a value; += updates it; print shows it.",
    story:
      "Slow down the example you just ran. Step through its three instructions and watch the battery's labeled value change.",
    goal: "Replay all three lines, then choose what += means.",
    hints: [
      "The first instruction stores 2 under the name battery.",
      "The second reads the current value, adds 3 and stores the result back.",
      "Choose Add to the stored value. It changes 2 into 5; it does not replace 2 with 3.",
    ],
  },
  charge: {
    title: "Try one small change",
    concept: "Changing an instruction changes the program's result.",
    story:
      "Our test robot needs 8 cells. It starts with 2. Experiment with the charging instruction and watch the real output.",
    goal: "Change the charging line so the battery reaches exactly 8. You can experiment as often as you like.",
    hints: [
      "The gap from 2 to 8 is the charge you need to add.",
      "Keep battery += and change the number after it.",
      "Add 6 cells. Use battery += 6, with a semicolon in Java, JavaScript and TypeScript.",
    ],
  },
  rescue: {
    title: "Your first independent rescue",
    concept: "A useful instruction works when its starting value changes too.",
    story:
      "A repair robot is waiting at the clinic. Your robot starts with 3 cells and needs 10 to deliver its kit. Write the charging instruction yourself.",
    goal: "Add the missing charge to battery. We also try your instruction on a robot starting at 4; it should reach 11.",
    hints: [
      "How many cells are missing between 3 and 10?",
      "Add 7 to the stored battery value. Setting battery to 10 would ignore its starting charge.",
      "Use battery += 7 (plus a semicolon except in Python). Starting at 3 gives 10; starting at 4 gives 11.",
    ],
  },
  transfer: {
    title: "Use your idea on another robot",
    concept: "The same idea works with new starting values.",
    story:
      "The kit arrived! A second robot starts with 4 cells and receives 2 more. Can you work out its new battery value?",
    goal: "Predict the result and run the code to check. You can rethink your answer and try again.",
    hints: [
      "This robot starts with 4, not 2.",
      "Add the 2 new cells to its starting 4.",
      "4 + 2 = 6. Choose 6 and run the example.",
    ],
  },
};
export function wrapBeginnerProgram(lang: Lang, body: string): string {
  return lang === "java"
    ? `public class Main {\n    public static void main(String[] args) {\n${body
        .split("\n")
        .map((line) => `        ${line}`)
        .join("\n")}\n    }\n}`
    : body;
}
function print(lang: Lang, variable: string): string {
  return lang === "python"
    ? `print(${variable})`
    : lang === "java"
      ? `System.out.println(${variable});`
      : `console.log(${variable});`;
}
export function batteryDeclaration(lang: Lang, start: number): string {
  return lang === "java"
    ? `int battery = ${start};`
    : lang === "python"
      ? `battery = ${start}`
      : lang === "typescript"
        ? `let battery: number = ${start};`
        : `let battery = ${start};`;
}
export function chargeInstruction(lang: Lang, amount: number): string {
  return `battery += ${amount}${lang === "python" ? "" : ";"}`;
}
export function beginnerStarter(lang: Lang, step: BeginnerCodeStep): string {
  if (step === "rescue") return "";
  if (step === "charge") return chargeInstruction(lang, 3);
  return lang === "java"
    ? 'String robotName = "Pixel";'
    : lang === "python"
      ? 'robotName = "Pixel"'
      : lang === "typescript"
        ? 'let robotName: string = "Pixel";'
        : 'let robotName = "Pixel";';
}
export function beginnerProgram(lang: Lang, step: BeginnerCodeStep, editable: string, start = 2): string {
  const body =
    step === "name"
      ? `${editable}\n${print(lang, "robotName")}`
      : `${batteryDeclaration(lang, start)}\n${editable}\n${print(lang, "battery")}`;
  return wrapBeginnerProgram(lang, body);
}
export function batteryExampleBody(lang: Lang, start = 2, add = 3): string[] {
  return [batteryDeclaration(lang, start), chargeInstruction(lang, add), print(lang, "battery")];
}
