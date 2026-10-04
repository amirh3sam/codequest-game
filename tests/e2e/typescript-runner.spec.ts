import { expect, type Page, test } from "@playwright/test";
import { openRunner, type Result } from "./runner-helpers";

// One page + one warm TypeScript worker shared by all tests in this file.
test.describe.configure({ mode: "default" });
let page: Page;
let run: (code: string, stdin?: string) => Promise<Result>;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(90_000);
  ({ page, run } = await openRunner(browser, "typescript"));
});
test.afterAll(async () => page.close());

test("hello world prints", async () => {
  const r = await run('console.log("Hello, CodeQuest!");');
  console.log(`[typescript] first run: compile ${Math.round(r.compileMs ?? 0)} ms, run ${Math.round(r.runMs)} ms`);
  expect(r.stdout).toBe("Hello, CodeQuest!\n");
});

test("types, template strings, conditions, loops, arrays, objects, functions", async () => {
  const r = await run(`const age: number = 25;
const key: string = "typescript";
let avg = (3 + 4) / 2;
console.log(\`\${key} \${age} \${avg} \${(3.14159).toFixed(2)}\`);
const evens: number[] = [];
for (let i = 1; i <= 10; i++) if (i % 2 === 0) evens.push(i);
console.log(evens.join(" "));
const inventory: Record<string, number> = { gems: 3 };
inventory.gems += 2;
function greet(name: string, times = 1): string {
  return Array(times).fill(\`hi \${name}\`).join(", ");
}
console.log(inventory, greet("Lia", 2), age > 18 ? "big" : "small", [1, 2], evens.length);`);
  console.log(`[typescript] warm run: compile ${Math.round(r.compileMs ?? 0)} ms, run ${Math.round(r.runMs)} ms`);
  expect(r.stdout).toBe("typescript 25 3.5 3.14\n2 4 6 8 10\n{ gems: 5 } hi Lia, hi Lia big [ 1, 2 ] 5\n");
});

test("OOP: interfaces, abstract classes, inheritance, generics, enums", async () => {
  const r = await run(`interface Attacker { attack(): number }
enum Element { Fire = "fire", Ice = "ice" }
abstract class Hero implements Attacker {
  constructor(protected readonly name: string) {}
  abstract attack(): number;
  describe(): string { return \`\${this.constructor.name} \${this.name} hits \${this.attack()}\`; }
}
class Warrior extends Hero { attack() { return 10; } }
class Mage extends Hero {
  constructor(name: string, private element: Element) { super(name); }
  attack() { return this.element === Element.Fire ? 15 : 12; }
}
function strongest<T extends Attacker>(list: T[]): T {
  return list.reduce((a, b) => (b.attack() > a.attack() ? b : a));
}
const party: Hero[] = [new Warrior("Amir"), new Mage("Lia", Element.Fire)];
for (const h of party) console.log(h.describe());
console.log(strongest(party).describe());`);
  expect(r.stdout).toBe("Warrior Amir hits 10\nMage Lia hits 15\nMage Lia hits 15\n");
});

test("type errors are compile errors with line and column", async () => {
  const r = await run('console.log("start");\nconst gems: number = "three";');
  expect(r.stdout).toBe("");
  expect(r.compileErrors?.[0]).toMatchObject({ line: 2, column: 7 });
  expect(r.compileErrors?.[0].message).toContain("not assignable to type 'number'");
});

test("strict mode catches possibly-null values", async () => {
  const r = await run("const name = prompt();\nconsole.log(name.toUpperCase());");
  expect(r.compileErrors?.[0].line).toBe(2);
  console.log(`[typescript] strict error: ${r.compileErrors?.[0].message}`);
});

test("syntax errors are compile errors too", async () => {
  const r = await run("const x = ;");
  expect(r.compileErrors?.[0].line).toBe(1);
});

test("browser-only APIs are not available (no DOM)", async () => {
  const r = await run("document.title = 'x';");
  expect(r.compileErrors?.[0].message).toContain("document");
});

test("prompt() reads lines of input", async () => {
  const r = await run(
    "const a = Number(prompt());\nconst b = Number(prompt());\nconsole.log(a + b, prompt());",
    "20\n22\n",
  );
  expect(r.stdout).toBe("42 null\n");
});

test("runtime error points at the TypeScript line, not the compiled one", async () => {
  const r = await run(`interface Gem {
  color: string;
}
type Bag = Gem[];
const bag: Bag = [];
console.log("before");
const first = bag[0] as Gem;
console.log(first.color);`);
  expect(r.stdout).toBe("before\n");
  expect(r.runtimeError).toMatch(/^TypeError: .* \(line 8\)$/);
});

test("thrown errors are reported", async () => {
  const r = await run('throw new Error("boss is too strong");');
  expect(r.runtimeError).toBe("Error: boss is too strong (line 1)");
});

test("async code finishes and is captured", async () => {
  const r = await run(`async function main(): Promise<void> {
  const gems = await Promise.resolve(3);
  console.log("gems", gems);
}
main();`);
  expect(r.stdout).toBe("gems 3\n");
});

test("rejected promise is a runtime error", async () => {
  const r = await run('async function main() { throw new Error("nope"); }\nmain();');
  expect(r.runtimeError).toContain("Error: nope");
});

test("timers left running can't print into the next run", async () => {
  await run('setTimeout(() => console.log("ghost"), 50);');
  await page.waitForTimeout(100);
  const r = await run('console.log("clean");');
  expect(r.stdout).toBe("clean\n");
});

test("changes to built-ins don't leak into the next run", async () => {
  const changed = await run(`(Array.prototype as any).sum = function () { return 1; };
Math.random = () => 4;
console.log([1, 2]);`);
  expect(changed.stdout).toBe("[ 1, 2 ]\n");
  const r = await run("console.log([1, 2], (Array.prototype as any).sum === undefined, Math.random() !== 4);");
  expect(r.stdout).toBe("[ 1, 2 ] true true\n");
});

test("top-level await works", async () => {
  const r = await run("const gems = await Promise.resolve(3);\nconsole.log(gems);");
  expect(r.stdout).toBe("3\n");
  expect(r.runtimeError).toBeUndefined();
});

test("import/export are compile errors (one-file programs)", async () => {
  const r = await run('console.log("hi");\nexport const y = 1;');
  expect(r.compileErrors?.[0]).toMatchObject({ line: 2 });
  expect(r.compileErrors?.[0].message).toContain("export");
});

test("player can use names like close, fetch, self and console", async () => {
  const r = await run(`const close = false;
let self = "me";
const fetch = (x: number) => x * 2;
console.log(close, self, fetch(21));`);
  expect(r.stdout).toBe("false me 42\n");
});

test("waits for timers like Node does", async () => {
  const r = await run(`setTimeout(() => console.log("later"), 100);
console.log("now");`);
  expect(r.stdout).toBe("now\nlater\n");
});

test("clearInterval stops an interval and the run ends", async () => {
  const r = await run(`let ticks = 0;
const id = setInterval(() => {
  ticks++;
  if (ticks === 3) { clearInterval(id); console.log("ticks", ticks); }
}, 5);`);
  expect(r.stdout).toBe("ticks 3\n");
  expect(r.timedOut).toBeUndefined();
});

test("an error thrown in a timer is a runtime error, not a runner crash", async () => {
  const r = await run('setTimeout(() => {\n  throw new Error("boom");\n}, 0);');
  expect(r.runnerError).toBeUndefined();
  expect(r.runtimeError).toBe("Error: boom (line 2)");
});

test("a busy leftover timer doesn't slow down the next run", async () => {
  test.setTimeout(90_000);
  const busy = await run("setInterval(() => { const end = Date.now() + 50; while (Date.now() < end) {} }, 0);");
  expect(busy.timedOut).toBe("run");
  const r = await run('console.log("fast");');
  expect(r.stdout).toBe("fast\n");
  expect(r.timedOut).toBeUndefined();
});

test("console.log formats like Node (grouped arrays, %s, quotes)", async () => {
  const r = await run(`console.log([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
console.log("%s has %d gems", "Lia", 3);
console.log(["it's"], new Date("nope"));`);
  expect(r.stdout).toBe('[\n  1, 2, 3, 4,  5,\n  6, 7, 8, 9, 10\n]\nLia has 3 gems\n[ "it\'s" ] Invalid Date\n');
});

test("non-ASCII output survives (accents, emoji)", async () => {
  const r = await run('console.log("héllo ✨ 💎");');
  expect(r.stdout).toBe("héllo ✨ 💎\n");
});

test("output is capped even if the program catches the error", async () => {
  const r = await run(`for (let i = 0; i < 200000; i++) {
  try { console.log("xxxxxxxxxx"); } catch {}
}`);
  expect(r.stdout.length).toBeLessThanOrEqual(64_000);
  expect(r.runtimeError).toContain("Too much output");
});

test("endless loop is stopped by the timeout and the runner recovers", async () => {
  test.setTimeout(90_000);
  const r = await run("while (true) {}");
  expect(r.timedOut).toBe("run");
  const again = await run('console.log("back");');
  expect(again.stdout).toBe("back\n");
});
