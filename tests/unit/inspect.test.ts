import { format, inspect as nodeInspect } from "node:util";
import { describe, expect, it } from "vitest";
import { formatLog, inspect } from "../../src/runners/inspect";

// Our port must print exactly what Node's console.log prints (util.format with console defaults).
const node = (...args: unknown[]) => format(...args);

class Hero {
  name: string;
  gems = 3;
  constructor(name: string) {
    this.name = name;
  }
}
class Mage extends Hero {
  spell = "fire";
}
class Shouter {
  toString() {
    return "HEY";
  }
}
function attack() {}
const circular: Record<string, unknown> = { x: 1 };
circular.self = circular;
const sparse: unknown[] = [1];
sparse[3] = 4; // holes at 1 and 2
const withProp = Object.assign([1, 2], { label: "pair" });
const nullProto = Object.assign(Object.create(null), { a: 1 });

const values: Record<string, unknown> = {
  string: "hi",
  number: 42,
  float: 2.75,
  negZero: -0,
  nan: Number.NaN,
  bool: false,
  nil: null,
  undef: undefined,
  bigint: 10n,
  symbol: Symbol("gem"),
  emptyArray: [],
  smallArray: [1, 2, 3],
  stringArray: ["a", "b"],
  sixNumbers: [1, 2, 3, 4, 5, 6],
  sevenNumbers: [1, 2, 3, 4, 5, 6, 7],
  tenNumbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  twentySquares: Array.from({ length: 20 }, (_, i) => i * i),
  manyWords: ["sword", "shield", "potion", "gem", "map", "key", "scroll", "torch", "rope"],
  mixedArray: [1, "two", { three: 3 }, [4], null],
  longArray: Array.from({ length: 150 }, (_, i) => i),
  sparse,
  withProp,
  emptyObject: {},
  object: { name: "Lia", gems: 3 },
  quotedKey: { "two words": 1, $dollar: 2, _ok: 3 },
  nested: { a: [1, { b: 2 }] },
  deep: { a: { b: { c: { d: 1 } } } },
  deepArray: [[[[1]]]],
  wideObject: { firstName: "Amir", lastName: "Hero", level: 12, experience: 480, gold: 500, area: "Loop Forest" },
  objectOfArrays: { inventory: ["sword", "shield"], stats: { hp: 100, mp: 50 } },
  quotes: ["it's", 'say "hi"', `both ' and "`, "line\nbreak", "tab\there", "back\\slash"],
  longString: { text: "a".repeat(90) },
  multilineString: { text: `${"line one is fairly long, ".repeat(3)}\nline two` },
  instance: new Hero("Amir"),
  subclassInstance: new Mage("Lia"),
  emptyInstance: new (class Empty {})(),
  klass: Hero,
  subclass: Mage,
  anonymousClass: class {},
  fn: attack,
  arrow: () => 1,
  asyncFn: async function load() {},
  map: new Map<unknown, unknown>([
    ["gems", 3],
    [1, { a: 1 }],
  ]),
  emptyMap: new Map(),
  set: new Set([1, "two"]),
  bigSet: new Set([1, 2, 3, 4, 5, 6, 7, 8]),
  emptySet: new Set(),
  date: new Date(Date.UTC(2026, 9, 4)),
  invalidDate: new Date("nope"),
  regexp: /gem+/gi,
  circular,
  nullProto,
  boxed: [new Number(3), new String("s"), new Boolean(true)],
  getter: {
    get power() {
      return 9;
    },
  },
  arrayOfObjects: [
    { id: 1, name: "Variable Village" },
    { id: 2, name: "Condition Bridge" },
    { id: 3, name: "Loop Forest" },
  ],
};

describe("inspect matches Node's console.log", () => {
  for (const [name, value] of Object.entries(values)) {
    it(name, () => {
      expect(inspect(value)).toBe(nodeInspect(value));
    });
  }

  it("Error objects print as 'Name: message' (Node would add the stack)", () => {
    expect(inspect(new TypeError("bad"))).toBe("TypeError: bad");
  });
});

describe("formatLog matches Node's util.format", () => {
  const cases: unknown[][] = [
    ["hello"],
    ["gems:", 3],
    ["hi", "there", 1, true, null, undefined],
    [1, 2, 3],
    [[1, 2], { a: 1 }],
    ["%s has %d gems", "Lia", 3],
    ["%s", { a: 1 }],
    ["%s", [1, 2]],
    ["%s", new Shouter()],
    ["%d + %i = %f", "4.5", 2.9, "1.25"],
    ["%j", { a: [1, 2] }],
    ["%o", { a: { b: { c: { d: { e: 1 } } } } }],
    ["%O", { a: 1 }],
    ["%c styled", "color: red"],
    ["100%% done", 1],
    ["%s and %s", "only one"],
    ["%x unknown", 1],
    ["%s", 10n],
    ["%d", -0],
    ["trailing %", 1],
  ];
  for (const args of cases) {
    it(
      JSON.stringify(args, (_, v) => (typeof v === "bigint" ? `${v}n` : v)),
      () => {
        expect(formatLog(args)).toBe(node(...args));
      },
    );
  }
});
