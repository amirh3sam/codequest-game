import type { Lang } from "../runners/types";

export type StudyExample = { code: string; output: string };
export type StudyTaskVariation = { value: string; output: string };
export type StudyTopic = {
  id: string;
  title: string;
  lesson: string;
  idea: string;
  tryIt: string;
  examples: Record<Lang, StudyExample>;
  practice: {
    token: Record<Lang, string>;
    action: string;
    variations: readonly StudyTaskVariation[];
    boss: StudyTaskVariation;
  };
};

const example = (code: string, output: string): StudyExample => ({ code, output });

/** The complete topic list adapted from the player's study-plan screenshot. */
const TOPICS: Omit<StudyTopic, "practice">[] = [
  {
    id: "variables-types",
    title: "Variables & Data Types",
    lesson:
      "A variable gives a value a name. Common types include text, whole numbers, decimals, and true/false values. TypeScript and Java declare types explicitly; JavaScript and Python can infer or determine types as values are used.",
    idea: "Store a value once, then use it by name.",
    tryIt: "Change one number and predict the total.",
    examples: {
      javascript: example("const battery = 4;\nconst cells = battery + 3;\nconsole.log(cells);", "7"),
      typescript: example("const battery: number = 4;\nconst cells: number = battery + 3;\nconsole.log(cells);", "7"),
      python: example("battery: int = 4\ncells = battery + 3\nprint(cells)", "7"),
      java: example(
        "public class Main {\n    public static void main(String[] args) {\n        int battery = 4;\n        int cells = battery + 3;\n        System.out.println(cells);\n    }\n}",
        "7",
      ),
    },
  },
  {
    id: "operators",
    title: "Operators",
    lesson:
      "Operators calculate values and compare them. Arithmetic includes +, -, *, / and remainder (%). Comparison operators such as ==, < and >= produce a true/false result.",
    idea: "An operator combines values into a new value.",
    tryIt: "Change the dividend or divisor and inspect the remainder.",
    examples: {
      javascript: example("const remainder = 10 % 3;\nconsole.log(remainder);", "1"),
      typescript: example("const remainder: number = 10 % 3;\nconsole.log(remainder);", "1"),
      python: example("remainder = 10 % 3\nprint(remainder)", "1"),
      java: example(
        "public class Main {\n    public static void main(String[] args) {\n        int remainder = 10 % 3;\n        System.out.println(remainder);\n    }\n}",
        "1",
      ),
    },
  },
  {
    id: "decision-statements",
    title: "Decision Statements",
    lesson:
      "An if statement runs a block only when its condition is true. Add else or else-if branches when the program needs another path. Use comparisons to make the condition meaningful.",
    idea: "A condition chooses which path the program follows.",
    tryIt: "Change the condition or value and see which message appears.",
    examples: {
      javascript: example(
        'const keys = 1;\nif (keys >= 1) {\n  console.log("Unlocked");\n} else {\n  console.log("Locked");\n}',
        "Unlocked",
      ),
      typescript: example(
        'const keys: number = 1;\nif (keys >= 1) {\n  console.log("Unlocked");\n} else {\n  console.log("Locked");\n}',
        "Unlocked",
      ),
      python: example('keys = 1\nif keys >= 1:\n    print("Unlocked")\nelse:\n    print("Locked")', "Unlocked"),
      java: example(
        'public class Main {\n    public static void main(String[] args) {\n        int keys = 1;\n        if (keys >= 1) {\n            System.out.println("Unlocked");\n        } else {\n            System.out.println("Locked");\n        }\n    }\n}',
        "Unlocked",
      ),
    },
  },
  {
    id: "loops",
    title: "Loops",
    lesson:
      "A loop repeats a block of code. A counted for loop is useful when you know how many repetitions you need. Check the start, stop condition, and update so the loop eventually ends.",
    idea: "Loops repeat work without copying the same statements.",
    tryIt: "Change the loop limit and calculate the new sum.",
    examples: {
      javascript: example("let total = 0;\nfor (let i = 1; i <= 3; i++) {\n  total += i;\n}\nconsole.log(total);", "6"),
      typescript: example(
        "let total: number = 0;\nfor (let i = 1; i <= 3; i++) {\n  total += i;\n}\nconsole.log(total);",
        "6",
      ),
      python: example("total = 0\nfor number in range(1, 1 + 3):\n    total += number\nprint(total)", "6"),
      java: example(
        "public class Main {\n    public static void main(String[] args) {\n        int total = 0;\n        for (int i = 1; i <= 3; i++) {\n            total += i;\n        }\n        System.out.println(total);\n    }\n}",
        "6",
      ),
    },
  },
  {
    id: "methods-functions",
    title: "Methods & Functions",
    lesson:
      "A function or method names a reusable block of work. Parameters bring values in; a return value sends a result back. Java calls functions declared in a class methods.",
    idea: "Give a reusable operation a name and clear inputs.",
    tryIt: "Change one argument and verify the returned sum.",
    examples: {
      javascript: example("function add(a, b) { return a + b; }\nconsole.log(add(4, 3));", "7"),
      typescript: example("function add(a: number, b: number): number { return a + b; }\nconsole.log(add(4, 3));", "7"),
      python: example("def add(a, b):\n    return a + b\n\nprint(add(4, 3))", "7"),
      java: example(
        "public class Main {\n    static int add(int a, int b) { return a + b; }\n    public static void main(String[] args) {\n        System.out.println(add(4, 3));\n    }\n}",
        "7",
      ),
    },
  },
  {
    id: "classes-objects-one",
    title: "Classes & Objects · Part 1",
    lesson:
      "A class describes a kind of object. An object is one instance with its own data. Create an instance with new in JavaScript, TypeScript and Java; Python calls the class like a function.",
    idea: "Class = blueprint; object = one created instance.",
    tryIt: "Change the character name and run the greeting again.",
    examples: {
      javascript: example(
        'class Player {\n  constructor(name) { this.name = name; }\n  greet() { return "Hello, " + this.name; }\n}\nconsole.log(new Player("Nova").greet());',
        "Hello, Nova",
      ),
      typescript: example(
        'class Player {\n  constructor(public name: string) {}\n  greet(): string { return "Hello, " + this.name; }\n}\nconsole.log(new Player("Nova").greet());',
        "Hello, Nova",
      ),
      python: example(
        'class Player:\n    def __init__(self, name):\n        self.name = name\n    def greet(self):\n        return "Hello, " + self.name\n\nprint(Player("Nova").greet())',
        "Hello, Nova",
      ),
      java: example(
        'class Player {\n    private final String name;\n    Player(String name) { this.name = name; }\n    String greet() { return "Hello, " + name; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Player("Nova").greet());\n    }\n}',
        "Hello, Nova",
      ),
    },
  },
  {
    id: "string-class",
    title: "String Class",
    lesson:
      "Strings represent text and come with useful operations. You can measure their length, change case, search within them, and join them with other text. Strings are immutable in these examples: an operation returns a new string.",
    idea: "Use string methods to inspect and transform text.",
    tryIt: "Try a different phrase or change the case conversion.",
    examples: {
      javascript: example('const title = "code quest";\nconsole.log(title.toUpperCase());', "CODE QUEST"),
      typescript: example('const title: string = "code quest";\nconsole.log(title.toUpperCase());', "CODE QUEST"),
      python: example('title = "code quest"\nprint(title.upper())', "CODE QUEST"),
      java: example(
        'public class Main {\n    public static void main(String[] args) {\n        String title = "code quest";\n        System.out.println(title.toUpperCase());\n    }\n}',
        "CODE QUEST",
      ),
    },
  },
  {
    id: "arrays",
    title: "Arrays",
    lesson:
      "An array stores values in an ordered sequence. Use an index to access an item; indexes start at zero. Java arrays have a fixed size, while JavaScript, TypeScript and Python use flexible list-like arrays in these examples.",
    idea: "Keep related values together and access them by index.",
    tryIt: "Change one element, then update the total you expect.",
    examples: {
      javascript: example("const values = [2, 4, 6];\nconsole.log(values[0] + values[1] + values[2]);", "12"),
      typescript: example("const values: number[] = [2, 4, 6];\nconsole.log(values[0] + values[1] + values[2]);", "12"),
      python: example("values = [2, 4, 6]\nprint(values[0] + values[1] + values[2])", "12"),
      java: example(
        "public class Main {\n    public static void main(String[] args) {\n        int[] values = {2, 4, 6};\n        System.out.println(values[0] + values[1] + values[2]);\n    }\n}",
        "12",
      ),
    },
  },
  {
    id: "array-list",
    title: "ArrayList & Dynamic Lists",
    lesson:
      "A dynamic list can grow as items are added. Java's ArrayList provides add and size; JavaScript and TypeScript arrays use push and length; Python lists use append and len.",
    idea: "Choose a collection that can grow when the number of values changes.",
    tryIt: "Add another item and predict the new count.",
    examples: {
      javascript: example(
        'const items = Array.from({ length: 3 }, (_, i) => "item" + i);\nitems.push("badge");\nconsole.log(items.length);',
        "4",
      ),
      typescript: example(
        'const items: string[] = Array.from({ length: 3 }, (_, i) => "item" + i);\nitems.push("badge");\nconsole.log(items.length);',
        "4",
      ),
      python: example('items = ["item" + str(i) for i in range(3)]\nitems.append("badge")\nprint(len(items))', "4"),
      java: example(
        'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        ArrayList<String> items = new ArrayList<>();\n        for (int i = 0; i < 3; i++) items.add("item" + i);\n        items.add("badge");\n        System.out.println(items.size());\n    }\n}',
        "4",
      ),
    },
  },
  {
    id: "classes-objects-two",
    title: "Classes & Objects · Part 2",
    lesson:
      "Larger programs split responsibilities across classes. One object can be passed to another object, allowing them to collaborate. The Badge uses a Player instead of duplicating player data.",
    idea: "Compose objects to build larger features from smaller parts.",
    tryIt: "Change the player or badge title and trace how the objects work together.",
    examples: {
      javascript: example(
        'class Player { constructor(name) { this.name = name; } }\nclass Badge { constructor(player) { this.player = player; } award() { return this.player.name + ": Explorer"; } }\nconsole.log(new Badge(new Player("Ava")).award());',
        "Ava: Explorer",
      ),
      typescript: example(
        'class Player { constructor(public name: string) {} }\nclass Badge { constructor(private player: Player) {} award(): string { return this.player.name + ": Explorer"; } }\nconsole.log(new Badge(new Player("Ava")).award());',
        "Ava: Explorer",
      ),
      python: example(
        'class Player:\n    def __init__(self, name): self.name = name\nclass Badge:\n    def __init__(self, player): self.player = player\n    def award(self): return self.player.name + ": Explorer"\n\nprint(Badge(Player("Ava")).award())',
        "Ava: Explorer",
      ),
      java: example(
        'class Player {\n    String name;\n    Player(String name) { this.name = name; }\n}\nclass Badge {\n    Player player;\n    Badge(Player player) { this.player = player; }\n    String award() { return player.name + ": Explorer"; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Badge(new Player("Ava")).award());\n    }\n}',
        "Ava: Explorer",
      ),
    },
  },
  {
    id: "encapsulation",
    title: "OOP · Encapsulation",
    lesson:
      "Encapsulation keeps an object's internal state private and exposes safe operations. A caller asks an object to deposit or read a balance rather than changing the field directly.",
    idea: "Protect state and control changes through methods.",
    tryIt: "Change the deposit amount and inspect the balance.",
    examples: {
      javascript: example(
        "class Wallet { #coins = 2; add(amount) { this.#coins += amount; } count() { return this.#coins; } }\nconst wallet = new Wallet();\nwallet.add(3);\nconsole.log(wallet.count());",
        "5",
      ),
      typescript: example(
        "class Wallet { private coins = 2; add(amount: number) { this.coins += amount; } count(): number { return this.coins; } }\nconst wallet = new Wallet();\nwallet.add(3);\nconsole.log(wallet.count());",
        "5",
      ),
      python: example(
        "class Wallet:\n    def __init__(self): self.__coins = 2\n    def add(self, amount): self.__coins += amount\n    def count(self): return self.__coins\n\nwallet = Wallet()\nwallet.add(3)\nprint(wallet.count())",
        "5",
      ),
      java: example(
        "class Wallet {\n    private int coins = 2;\n    void add(int amount) { coins += amount; }\n    int count() { return coins; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        Wallet wallet = new Wallet();\n        wallet.add(3);\n        System.out.println(wallet.count());\n    }\n}",
        "5",
      ),
    },
  },
  {
    id: "inheritance",
    title: "OOP · Inheritance",
    lesson:
      "Inheritance lets a specialized class reuse and extend a base class. Use it when the child really is a kind of the parent; prefer composition when objects merely collaborate.",
    idea: "A child class can reuse behavior and add its own details.",
    tryIt: "Change the developer name or override the message.",
    examples: {
      javascript: example(
        'class Person { constructor(name) { this.name = name; } }\nclass Developer extends Person { label() { return "Coder: " + this.name; } }\nconsole.log(new Developer("Lee").label());',
        "Coder: Lee",
      ),
      typescript: example(
        'class Person { constructor(public name: string) {} }\nclass Developer extends Person { label(): string { return "Coder: " + this.name; } }\nconsole.log(new Developer("Lee").label());',
        "Coder: Lee",
      ),
      python: example(
        'class Person:\n    def __init__(self, name): self.name = name\nclass Developer(Person):\n    def label(self): return "Coder: " + self.name\n\nprint(Developer("Lee").label())',
        "Coder: Lee",
      ),
      java: example(
        'class Person {\n    String name;\n    Person(String name) { this.name = name; }\n}\nclass Developer extends Person {\n    Developer(String name) { super(name); }\n    String label() { return "Coder: " + name; }\n}\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(new Developer("Lee").label());\n    }\n}',
        "Coder: Lee",
      ),
    },
  },
  {
    id: "abstraction-polymorphism",
    title: "OOP · Abstraction & Polymorphism",
    lesson:
      "Abstraction exposes the operation callers need while hiding its implementation. Polymorphism lets different object types respond to the same method call in their own way. Java can enforce this with abstract classes or interfaces; the other languages can use shared method shapes or protocols.",
    idea: "Call the same operation on different implementations.",
    tryIt: "Add another character class with its own ready message.",
    examples: {
      javascript: example(
        'class Character { ready() { return "Ready"; } }\nclass Coder extends Character { ready() { return "Ready to code"; } }\nfunction start(character) { console.log(character.ready()); }\nstart(new Coder());',
        "Ready to code",
      ),
      typescript: example(
        'abstract class Character { abstract ready(): string; }\nclass Coder extends Character { ready(): string { return "Ready to code"; } }\nfunction start(character: Character): void { console.log(character.ready()); }\nstart(new Coder());',
        "Ready to code",
      ),
      python: example(
        'class Character:\n    def ready(self): raise NotImplementedError\nclass Coder(Character):\n    def ready(self): return "Ready to code"\n\ndef start(character): print(character.ready())\nstart(Coder())',
        "Ready to code",
      ),
      java: example(
        'abstract class Character {\n    abstract String ready();\n}\nclass Coder extends Character {\n    String ready() { return "Ready to code"; }\n}\npublic class Main {\n    static void start(Character character) { System.out.println(character.ready()); }\n    public static void main(String[] args) { start(new Coder()); }\n}',
        "Ready to code",
      ),
    },
  },
  {
    id: "exceptions-errors",
    title: "Exceptions & Errors",
    lesson:
      "An exception reports a problem while a program runs. Use try/catch (try/except in Python) when you can handle the problem or explain it clearly. Do not hide errors you cannot recover from.",
    idea: "Handle expected problems close to the operation that can fail.",
    tryIt: "Change the thrown message and see where the handler catches it.",
    examples: {
      javascript: example(
        'try {\n  throw new Error("offline");\n} catch (error) {\n  console.log("Recovered: " + error.message);\n}',
        "Recovered: offline",
      ),
      typescript: example(
        'try {\n  throw new Error("offline");\n} catch (error) {\n  console.log("Recovered: " + (error as Error).message);\n}',
        "Recovered: offline",
      ),
      python: example(
        'try:\n    raise ValueError("offline")\nexcept ValueError as error:\n    print("Recovered: " + str(error))',
        "Recovered: offline",
      ),
      java: example(
        'public class Main {\n    static class QuestException extends RuntimeException {\n        private final String questMessage;\n        QuestException(String message) { this.questMessage = message; }\n        String message() { return questMessage; }\n    }\n    public static void main(String[] args) {\n        try {\n            throw new QuestException("offline");\n        } catch (QuestException error) {\n            System.out.println("Recovered: " + error.message());\n        }\n    }\n}',
        "Recovered: offline",
      ),
    },
  },
  {
    id: "collections-framework",
    title: "Collections Framework",
    lesson:
      "Collections provide standard ways to group and search data. Java's Collections Framework includes lists, sets and maps. Other languages provide similar built-in collection types with language-specific names and methods.",
    idea: "Pick a data structure based on the operations you need.",
    tryIt: "Add a unique item or a duplicate and observe the set size.",
    examples: {
      javascript: example(
        'const areas = new Set(Array.from({ length: 3 }, (_, i) => "area" + i));\nif (areas.size > 0) areas.add("area0");\nconsole.log(areas.size);',
        "3",
      ),
      typescript: example(
        'const areas: Set<string> = new Set(Array.from({ length: 3 }, (_, i) => "area" + i));\nif (areas.size > 0) areas.add("area0");\nconsole.log(areas.size);',
        "3",
      ),
      python: example(
        'areas = {"area" + str(i) for i in range(3)}\nif areas:\n    areas.add("area0")\nprint(len(areas))',
        "3",
      ),
      java: example(
        'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Set<String> areas = new HashSet<>();\n        for (int i = 0; i < 3; i++) areas.add("area" + i);\n        if (!areas.isEmpty()) areas.add("area0");\n        System.out.println(areas.size());\n    }\n}',
        "3",
      ),
    },
  },
  {
    id: "maps",
    title: "Maps & Dictionaries",
    lesson:
      "A map stores key/value pairs. Use a key to look up the value associated with it. Java uses Map, JavaScript and TypeScript use Map or objects, and Python commonly uses dict.",
    idea: "Use a map when a value should be found by a meaningful key.",
    tryIt: "Change the key or value and check the lookup result.",
    examples: {
      javascript: example('const players = new Map([["pilot", "Ada"]]);\nconsole.log(players.get("pilot"));', "Ada"),
      typescript: example(
        'const players: Map<string, string> = new Map([["pilot", "Ada"]]);\nconsole.log(players.get("pilot"));',
        "Ada",
      ),
      python: example('players = {"pilot": "Ada"}\nprint(players["pilot"])', "Ada"),
      java: example(
        'import java.util.*;\npublic class Main {\n    public static void main(String[] args) {\n        Map<String, String> players = new HashMap<>();\n        players.put("pilot", "Ada");\n        System.out.println(players.get("pilot"));\n    }\n}',
        "Ada",
      ),
    },
  },
  {
    id: "extra-topics",
    title: "Extra Topics",
    lesson:
      "After the core topics, explore language features such as enums, interfaces, generics, modules, testing, and asynchronous work. Their syntax differs, so read the selected language's documentation and build one small example at a time.",
    idea: "Keep learning by testing one new language feature in a small program.",
    tryIt: "Change the status or add another named state.",
    examples: {
      javascript: example(
        'const Status = Object.freeze({ READY: "READY", BUSY: "BUSY", TESTING: "TESTING", PAUSED: "PAUSED", OFFLINE: "OFFLINE", LOADING: "LOADING", SAVED: "SAVED", DONE: "DONE" });\nconsole.log(Status.READY);',
        "READY",
      ),
      typescript: example(
        'enum Status { READY = "READY", BUSY = "BUSY", TESTING = "TESTING", PAUSED = "PAUSED", OFFLINE = "OFFLINE", LOADING = "LOADING", SAVED = "SAVED", DONE = "DONE" }\nconsole.log(Status.READY);',
        "READY",
      ),
      python: example(
        'from enum import Enum\nclass Status(Enum):\n    READY = "READY"\n    BUSY = "BUSY"\n    TESTING = "TESTING"\n    PAUSED = "PAUSED"\n    OFFLINE = "OFFLINE"\n    LOADING = "LOADING"\n    SAVED = "SAVED"\n    DONE = "DONE"\nprint(Status.READY.value)',
        "READY",
      ),
      java: example(
        "enum Status { READY, BUSY, TESTING, PAUSED, OFFLINE, LOADING, SAVED, DONE }\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println(Status.READY);\n    }\n}",
        "READY",
      ),
    },
  },
];

type PracticeConfig = Omit<StudyTopic["practice"], "boss">;
const allLanguages = (token: string): Record<Lang, string> => ({
  java: token,
  javascript: token,
  typescript: token,
  python: token,
});
const practice = (token: string, action: string, pairs: [string, string][]): PracticeConfig => ({
  token: allLanguages(token),
  action,
  variations: pairs.map(([value, output]) => ({ value, output })),
});
const PRACTICE: Record<string, PracticeConfig> = {
  "variables-types": practice("4", "starting battery value", [
    ["4", "7"],
    ["1", "4"],
    ["2", "5"],
    ["3", "6"],
    ["5", "8"],
    ["6", "9"],
    ["7", "10"],
    ["8", "11"],
  ]),
  operators: practice("10", "number before the remainder operator", [
    ["10", "1"],
    ["4", "1"],
    ["5", "2"],
    ["7", "1"],
    ["8", "2"],
    ["11", "2"],
    ["13", "1"],
    ["14", "2"],
  ]),
  "decision-statements": practice("1", "number of keys", [
    ["1", "Unlocked"],
    ["0", "Locked"],
    ["2", "Unlocked"],
    ["3", "Unlocked"],
    ["4", "Unlocked"],
    ["5", "Unlocked"],
    ["6", "Unlocked"],
    ["7", "Unlocked"],
  ]),
  loops: practice("3", "loop limit", [
    ["3", "6"],
    ["0", "0"],
    ["1", "1"],
    ["2", "3"],
    ["4", "10"],
    ["5", "15"],
    ["6", "21"],
    ["7", "28"],
  ]),
  "methods-functions": practice("3", "second number passed to add", [
    ["3", "7"],
    ["0", "4"],
    ["1", "5"],
    ["2", "6"],
    ["4", "8"],
    ["5", "9"],
    ["6", "10"],
    ["7", "11"],
  ]),
  "classes-objects-one": practice("Nova", "player name", [
    ["Nova", "Hello, Nova"],
    ["Ari", "Hello, Ari"],
    ["Kai", "Hello, Kai"],
    ["Mina", "Hello, Mina"],
    ["Lee", "Hello, Lee"],
    ["Sam", "Hello, Sam"],
    ["Rin", "Hello, Rin"],
    ["Jo", "Hello, Jo"],
  ]),
  "string-class": practice("code quest", "phrase converted to uppercase", [
    ["code quest", "CODE QUEST"],
    ["game map", "GAME MAP"],
    ["bright city", "BRIGHT CITY"],
    ["blue badge", "BLUE BADGE"],
    ["small steps", "SMALL STEPS"],
    ["smart robot", "SMART ROBOT"],
    ["open source", "OPEN SOURCE"],
    ["fun project", "FUN PROJECT"],
  ]),
  arrays: practice("6", "last number in the array", [
    ["6", "12"],
    ["1", "7"],
    ["3", "9"],
    ["5", "11"],
    ["7", "13"],
    ["8", "14"],
    ["9", "15"],
    ["10", "16"],
  ]),
  "array-list": practice("3", "number of generated items before adding the badge", [
    ["3", "4"],
    ["0", "1"],
    ["1", "2"],
    ["2", "3"],
    ["4", "5"],
    ["5", "6"],
    ["6", "7"],
    ["7", "8"],
  ]),
  "classes-objects-two": practice("Ava", "player name passed into Badge", [
    ["Ava", "Ava: Explorer"],
    ["Kai", "Kai: Explorer"],
    ["Mina", "Mina: Explorer"],
    ["Lee", "Lee: Explorer"],
    ["Sam", "Sam: Explorer"],
    ["Rin", "Rin: Explorer"],
    ["Jo", "Jo: Explorer"],
    ["Noor", "Noor: Explorer"],
  ]),
  encapsulation: practice("3", "amount added to the private wallet", [
    ["3", "5"],
    ["0", "2"],
    ["1", "3"],
    ["2", "4"],
    ["4", "6"],
    ["5", "7"],
    ["6", "8"],
    ["7", "9"],
  ]),
  inheritance: practice("Lee", "developer name", [
    ["Lee", "Coder: Lee"],
    ["Ari", "Coder: Ari"],
    ["Kai", "Coder: Kai"],
    ["Mina", "Coder: Mina"],
    ["Sam", "Coder: Sam"],
    ["Rin", "Coder: Rin"],
    ["Jo", "Coder: Jo"],
    ["Noor", "Coder: Noor"],
  ]),
  "abstraction-polymorphism": practice("Ready to code", "message returned by the Coder implementation", [
    ["Ready to code", "Ready to code"],
    ["Ready to build", "Ready to build"],
    ["Ready to test", "Ready to test"],
    ["Ready to explore", "Ready to explore"],
    ["Ready to learn", "Ready to learn"],
    ["Ready to play", "Ready to play"],
    ["Ready to ship", "Ready to ship"],
    ["Ready to help", "Ready to help"],
  ]),
  "exceptions-errors": practice("offline", "message inside the thrown exception", [
    ["offline", "Recovered: offline"],
    ["missing", "Recovered: missing"],
    ["timeout", "Recovered: timeout"],
    ["locked", "Recovered: locked"],
    ["broken", "Recovered: broken"],
    ["busy", "Recovered: busy"],
    ["empty", "Recovered: empty"],
    ["unknown", "Recovered: unknown"],
  ]),
  "collections-framework": practice("3", "number of unique areas to place in the Set", [
    ["3", "3"],
    ["0", "0"],
    ["1", "1"],
    ["2", "2"],
    ["4", "4"],
    ["5", "5"],
    ["6", "6"],
    ["7", "7"],
  ]),
  maps: practice("Ada", "name stored for the pilot key", [
    ["Ada", "Ada"],
    ["Mina", "Mina"],
    ["Kai", "Kai"],
    ["Ava", "Ava"],
    ["Noor", "Noor"],
    ["Rin", "Rin"],
    ["Sam", "Sam"],
    ["Jo", "Jo"],
  ]),
  "extra-topics": practice("Status.READY", "status enum or constant selected", [
    ["Status.READY", "READY"],
    ["Status.BUSY", "BUSY"],
    ["Status.TESTING", "TESTING"],
    ["Status.PAUSED", "PAUSED"],
    ["Status.OFFLINE", "OFFLINE"],
    ["Status.LOADING", "LOADING"],
    ["Status.SAVED", "SAVED"],
    ["Status.DONE", "DONE"],
  ]),
};

const BOSSES: Record<string, StudyTaskVariation> = {
  "variables-types": { value: "10", output: "13" },
  operators: { value: "20", output: "2" },
  "decision-statements": { value: "0", output: "Locked" },
  loops: { value: "8", output: "36" },
  "methods-functions": { value: "9", output: "13" },
  "classes-objects-one": { value: "Rae", output: "Hello, Rae" },
  "string-class": { value: "adventure map", output: "ADVENTURE MAP" },
  arrays: { value: "10", output: "16" },
  "array-list": { value: "5", output: "6" },
  "classes-objects-two": { value: "Rae", output: "Rae: Explorer" },
  encapsulation: { value: "10", output: "12" },
  inheritance: { value: "Maya", output: "Coder: Maya" },
  "abstraction-polymorphism": { value: "Ready to explore", output: "Ready to explore" },
  "exceptions-errors": { value: "power lost", output: "Recovered: power lost" },
  "collections-framework": { value: "5", output: "5" },
  maps: { value: "Zuri", output: "Zuri" },
  "extra-topics": { value: "Status.DONE", output: "DONE" },
};

export const STUDY_CURRICULUM: readonly StudyTopic[] = TOPICS.map((topic) => ({
  ...topic,
  practice: {
    ...(PRACTICE[topic.id] ??
      (() => {
        throw new Error(`Missing eight-task practice for ${topic.id}`);
      })()),
    boss:
      BOSSES[topic.id] ??
      (() => {
        throw new Error(`Missing boss challenge for ${topic.id}`);
      })(),
  },
}));

const STUDY_IDS = new Set(STUDY_CURRICULUM.map(({ id }) => id));
export const STUDY_TASKS_PER_TOPIC = 8;
export const STUDY_TOTAL_TASKS = STUDY_CURRICULUM.length * STUDY_TASKS_PER_TOPIC;

export type StudyTask = StudyTaskVariation & { index: number; prompt: string; starter: string; solution: string };

export function studyTaskFor(topic: StudyTopic, lang: Lang, index: number): StudyTask {
  if (!Number.isSafeInteger(index) || index < 0 || index >= STUDY_TASKS_PER_TOPIC)
    throw new Error("Study task number is out of range.");
  const variation = topic.practice.variations[index];
  if (!variation) throw new Error(`Missing task ${index + 1} for ${topic.title}.`);
  const starter = topic.examples[lang].code;
  const token = topic.practice.token[lang];
  if (!starter.includes(token))
    throw new Error(`The ${lang} example for ${topic.title} is missing its practice value.`);
  const solution = index === 0 ? starter : starter.replace(token, variation.value);
  const prompt =
    index === 0
      ? "Trace the starter, enter the output you predict, then run it to check your answer."
      : `Change the ${topic.practice.action} to ${variation.value}. Predict the output, enter your prediction, then run the code.`;
  return { ...variation, index, prompt, starter, solution };
}

export function studyBossFor(topic: StudyTopic, lang: Lang): StudyTask {
  const token = topic.practice.token[lang];
  const starter = topic.examples[lang].code;
  if (!starter.includes(token)) throw new Error(`The ${lang} example for ${topic.title} is missing its boss value.`);
  return {
    ...topic.practice.boss,
    index: STUDY_TASKS_PER_TOPIC,
    prompt: `Level boss: change the ${topic.practice.action} to ${topic.practice.boss.value}, predict the result, then run your code to defeat the boss.`,
    starter,
    solution: starter.replace(token, topic.practice.boss.value),
  };
}

export function studyProgressKey(adventureId: string): string {
  return `codequest:study-progress:v2:${adventureId}`;
}

function readStudyCounts(adventureId: string): Record<string, number> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(studyProgressKey(adventureId)) ?? "null");
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(
        Object.entries(value).filter(
          ([id, count]) =>
            STUDY_IDS.has(id) &&
            Number.isSafeInteger(count) &&
            Number(count) >= 0 &&
            Number(count) <= STUDY_TASKS_PER_TOPIC,
        ),
      ) as Record<string, number>;
    }
    // Upgrade the previous one-checkpoint study path without discarding those completions.
    const previous: unknown = JSON.parse(localStorage.getItem(`codequest:study-progress:v1:${adventureId}`) ?? "[]");
    if (!Array.isArray(previous)) return {};
    return Object.fromEntries(
      previous.filter((id): id is string => typeof id === "string" && STUDY_IDS.has(id)).map((id) => [id, 1]),
    );
  } catch {
    return {};
  }
}

export function readStudyTaskProgress(adventureId: string, topicId: string): number {
  if (!STUDY_IDS.has(topicId)) return 0;
  return readStudyCounts(adventureId)[topicId] ?? 0;
}

export function readCompletedStudyTasks(adventureId: string): number {
  return Object.values(readStudyCounts(adventureId)).reduce((total, count) => total + count, 0);
}

export function readStudyProgress(adventureId: string): string[] {
  const progress = readStudyCounts(adventureId);
  const bosses = new Set(readCompletedStudyBosses(adventureId));
  return STUDY_CURRICULUM.filter(({ id }) => (progress[id] ?? 0) >= STUDY_TASKS_PER_TOPIC && bosses.has(id)).map(
    ({ id }) => id,
  );
}

export function studyBossProgressKey(adventureId: string): string {
  return `codequest:study-bosses:v1:${adventureId}`;
}

export function readCompletedStudyBosses(adventureId: string): string[] {
  try {
    const stored: unknown = JSON.parse(localStorage.getItem(studyBossProgressKey(adventureId)) ?? "[]");
    if (!Array.isArray(stored)) return [];
    return stored.filter(
      (id): id is string => typeof id === "string" && STUDY_IDS.has(id) && readStudyTaskProgress(adventureId, id) >= 8,
    );
  } catch {
    return [];
  }
}

export function saveStudyBossProgress(adventureId: string, topicId: string): boolean {
  if (!STUDY_IDS.has(topicId) || readStudyTaskProgress(adventureId, topicId) < STUDY_TASKS_PER_TOPIC) return false;
  try {
    const bosses = new Set(readCompletedStudyBosses(adventureId));
    if (bosses.has(topicId)) return false;
    bosses.add(topicId);
    localStorage.setItem(studyBossProgressKey(adventureId), JSON.stringify([...bosses]));
    return true;
  } catch {
    return false;
  }
}

export function saveStudyTaskProgress(adventureId: string, topicId: string, completedTasks: number): boolean {
  if (
    !STUDY_IDS.has(topicId) ||
    !Number.isSafeInteger(completedTasks) ||
    completedTasks < 1 ||
    completedTasks > STUDY_TASKS_PER_TOPIC ||
    completedTasks !== readStudyTaskProgress(adventureId, topicId) + 1
  )
    return false;
  try {
    const progress = readStudyCounts(adventureId);
    progress[topicId] = completedTasks;
    localStorage.setItem(studyProgressKey(adventureId), JSON.stringify(progress));
    return true;
  } catch {
    return false;
  }
}
