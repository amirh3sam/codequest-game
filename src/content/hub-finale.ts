import type { Lang } from "../runners/types";

export const HUB_STEPS = ["Power supply", "Operator signal", "Firewall check"] as const;
export function hubTarget(step: 0 | 1, name: string): string {
  return step === 0 ? "6" : `Ready, ${name}!`;
}

export function hubStarter(lang: Lang, step: 0 | 1, name: string): string {
  const operator = JSON.stringify(name);
  if (step === 0) {
    switch (lang) {
      case "javascript":
        return "let power = 5;\n// Add 3, then use 2 cells for the antenna.\nconsole.log(power);";
      case "typescript":
        return "let power: number = 5;\n// Add 3, then use 2 cells for the antenna.\nconsole.log(power);";
      case "python":
        return "power = 5\n# Add 3, then use 2 cells for the antenna.\nprint(power)";
      case "java":
        return "public class Main {\n  public static void main(String[] args) {\n    int power = 5;\n    // Add 3, then use 2 cells for the antenna.\n    System.out.println(power);\n  }\n}";
    }
  }
  switch (lang) {
    case "javascript":
      return `const operatorName = ${operator};\nconst signal = "";\nconsole.log(signal);`;
    case "typescript":
      return `const operatorName: string = ${operator};\nconst signal: string = "";\nconsole.log(signal);`;
    case "python":
      return `operatorName = ${operator}\nsignal = ""\nprint(signal)`;
    case "java":
      return `public class Main {\n  public static void main(String[] args) {\n    String operatorName = ${operator};\n    String signal = "";\n    System.out.println(signal);\n  }\n}`;
  }
}

export function hubHint(step: 0 | 1): string {
  return step === 0
    ? "A variable keeps its updated value. Add to power, subtract from that new value, then print it. Think: 5 → 8 → 6."
    : 'Join three pieces of text: "Ready, ", the operatorName variable, and "!". The spaces and punctuation are part of the message.';
}

/** Keep the free preview focused on the concepts it teaches, even though it has no heart cost. */
export function usesHubLesson(step: 0 | 1, source: string): boolean {
  const code = source
    .split("\n")
    .map((line) => line.replace(/\/\/.*$|#.*$/, ""))
    .join("\n");
  if (step === 0)
    return /\bpower\b/.test(code) && /\+/.test(code) && /-/.test(code) && /\b(?:log|println|print)\b/.test(code);
  return (
    /\boperatorName\b/.test(code) &&
    /\bsignal\b/.test(code) &&
    /\+/.test(code) &&
    /\b(?:log|println|print)\b/.test(code)
  );
}
