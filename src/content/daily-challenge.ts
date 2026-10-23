import type { Lang } from "../runners/types";

export type DailyChallenge = Readonly<{
  date: string;
  id: string;
  title: string;
  skill: string;
  prompt: string;
  hint: string;
  expected: string;
  starter: string;
  solution: string;
}>;

type ChallengeDefinition = Omit<DailyChallenge, "date" | "starter" | "solution"> & {
  starter: Readonly<Record<Lang, string>>;
  solution: Readonly<Record<Lang, string>>;
};

const CHALLENGES: readonly ChallengeDefinition[] = [
  {
    id: "charge",
    title: "Charge the courier battery",
    skill: "Variables and arithmetic",
    prompt: "A battery has 4 cells. Add 3 more and print its new charge. The output should be 7.",
    hint: "Store 4 in battery, add 3 with +=, then print battery.",
    expected: "7",
    starter: {
      javascript: "let battery = 4;\n// Add 3 cells, then print the result.\nconsole.log(battery);",
      typescript: "let battery: number = 4;\n// Add 3 cells, then print the result.\nconsole.log(battery);",
      python: "battery = 4\n# Add 3 cells, then print the result.\nprint(battery)",
      java: "public class Main {\n    public static void main(String[] args) {\n        int battery = 4;\n        // Add 3 cells, then print the result.\n        System.out.println(battery);\n    }\n}",
    },
    solution: {
      javascript: "let battery = 4;\nbattery += 3;\nconsole.log(battery);",
      typescript: "let battery: number = 4;\nbattery += 3;\nconsole.log(battery);",
      python: "battery = 4\nbattery += 3\nprint(battery)",
      java: "public class Main {\n    public static void main(String[] args) {\n        int battery = 4;\n        battery += 3;\n        System.out.println(battery);\n    }\n}",
    },
  },
  {
    id: "signal-check",
    title: "Check the signal",
    skill: "Conditions and decisions",
    prompt:
      "The signal level is 18. Print CHARGE if it is below 20; otherwise print READY. The output should be CHARGE.",
    hint: "Compare signal with 20 inside an if/else statement.",
    expected: "CHARGE",
    starter: {
      javascript: 'const signal = 18;\n\n// Decide which status to print.\nconsole.log("TODO");',
      typescript: 'const signal: number = 18;\n\n// Decide which status to print.\nconsole.log("TODO");',
      python: 'signal = 18\n\n# Decide which status to print.\nprint("TODO")',
      java: 'public class Main {\n    public static void main(String[] args) {\n        int signal = 18;\n        // Decide which status to print.\n        System.out.println("TODO");\n    }\n}',
    },
    solution: {
      javascript:
        'const signal = 18;\nif (signal < 20) {\n    console.log("CHARGE");\n} else {\n    console.log("READY");\n}',
      typescript:
        'const signal: number = 18;\nif (signal < 20) {\n    console.log("CHARGE");\n} else {\n    console.log("READY");\n}',
      python: 'signal = 18\nif signal < 20:\n    print("CHARGE")\nelse:\n    print("READY")',
      java: 'public class Main {\n    public static void main(String[] args) {\n        int signal = 18;\n        if (signal < 20) {\n            System.out.println("CHARGE");\n        } else {\n            System.out.println("READY");\n        }\n    }\n}',
    },
  },
  {
    id: "packet-count",
    title: "Count five packets",
    skill: "Loops and repetition",
    prompt: "Add the packet numbers 1 through 5 and print their total. The output should be 15.",
    hint: "Start total at 0. Repeat from 1 to 5, adding each packet number.",
    expected: "15",
    starter: {
      javascript: 'let total = 0;\n\n// Repeat for packets 1 through 5.\nconsole.log("TODO");',
      typescript: 'let total: number = 0;\n\n// Repeat for packets 1 through 5.\nconsole.log("TODO");',
      python: 'total = 0\n\n# Repeat for packets 1 through 5.\nprint("TODO")',
      java: 'public class Main {\n    public static void main(String[] args) {\n        int total = 0;\n        // Repeat for packets 1 through 5.\n        System.out.println("TODO");\n    }\n}',
    },
    solution: {
      javascript:
        "let total = 0;\nfor (let packet = 1; packet <= 5; packet++) {\n    total += packet;\n}\nconsole.log(total);",
      typescript:
        "let total: number = 0;\nfor (let packet = 1; packet <= 5; packet++) {\n    total += packet;\n}\nconsole.log(total);",
      python: "total = 0\nfor packet in range(1, 6):\n    total += packet\nprint(total)",
      java: "public class Main {\n    public static void main(String[] args) {\n        int total = 0;\n        for (int packet = 1; packet <= 5; packet++) {\n            total += packet;\n        }\n        System.out.println(total);\n    }\n}",
    },
  },
  {
    id: "network-name",
    title: "Build the network name",
    skill: "Strings and composition",
    prompt: "Join the words Code and Quest, then print CodeQuest with no space between them.",
    hint: "Store each word in its own variable, then join the two values.",
    expected: "CodeQuest",
    starter: {
      javascript:
        'const first = "Code";\nconst second = "Quest";\n// Join both words and print the result.\nconsole.log(second);',
      typescript:
        'const first: string = "Code";\nconst second: string = "Quest";\n// Join both words and print the result.\nconsole.log(second);',
      python: 'first = "Code"\nsecond = "Quest"\n# Join both words and print the result.\nprint(second)',
      java: 'public class Main {\n    public static void main(String[] args) {\n        String first = "Code";\n        String second = "Quest";\n        // Join both words and print the result.\n        System.out.println(second);\n    }\n}',
    },
    solution: {
      javascript: 'const first = "Code";\nconst second = "Quest";\nconsole.log(first + second);',
      typescript: 'const first: string = "Code";\nconst second: string = "Quest";\nconsole.log(first + second);',
      python: 'first = "Code"\nsecond = "Quest"\nprint(first + second)',
      java: 'public class Main {\n    public static void main(String[] args) {\n        String first = "Code";\n        String second = "Quest";\n        System.out.println(first + second);\n    }\n}',
    },
  },
];

export function dailyChallengeFor(date: string, lang: Lang): DailyChallenge {
  const stamp = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(stamp) || new Date(stamp).toISOString().slice(0, 10) !== date)
    throw new Error("Daily challenges need a real date in YYYY-MM-DD format.");
  const day = Math.floor(stamp / 86_400_000),
    index = ((day % CHALLENGES.length) + CHALLENGES.length) % CHALLENGES.length,
    entry = CHALLENGES[index];
  if (!entry) throw new Error("No daily challenge is available.");
  return { ...entry, date, starter: entry.starter[lang], solution: entry.solution[lang] };
}
