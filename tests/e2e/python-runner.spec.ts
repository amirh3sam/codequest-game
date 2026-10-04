import { expect, type Page, test } from "@playwright/test";
import { openRunner, type Result } from "./runner-helpers";

// One page + one warm Python worker shared by all tests in this file.
test.describe.configure({ mode: "default" });
let page: Page;
let run: (code: string, stdin?: string) => Promise<Result>;

test.beforeAll(async ({ browser }) => {
  test.setTimeout(90_000);
  ({ page, run } = await openRunner(browser, "python"));
});
test.afterAll(async () => page.close());

test("hello world prints", async () => {
  const r = await run('print("Hello, CodeQuest!")');
  console.log(`[python] first run: check ${Math.round(r.compileMs ?? 0)} ms, run ${Math.round(r.runMs)} ms`);
  expect(r.stdout).toBe("Hello, CodeQuest!\n");
});

test("variables, f-strings, conditions, loops, lists, dicts, functions", async () => {
  const r = await run(`age = 25
key = "python"
avg = (3 + 4) / 2
print(f"{key} {age} {avg} {3.14159:.2f}")
evens = [i for i in range(1, 11) if i % 2 == 0]
print(*evens)
inv = {"gems": 3}
inv["gems"] += 2
def greet(name, times=1):
    return ", ".join([f"hi {name}"] * times)
print(inv, greet("Lia", 2), "big" if age > 18 else "small")`);
  expect(r.stdout).toBe("python 25 3.5 3.14\n2 4 6 8 10\n{'gems': 5} hi Lia, hi Lia big\n");
});

test("OOP: classes, inheritance, abstract base classes, dataclasses", async () => {
  const r = await run(`from abc import ABC, abstractmethod
from dataclasses import dataclass

class Hero(ABC):
    def __init__(self, name):
        self.name = name
    @abstractmethod
    def attack(self) -> int: ...
    def __str__(self):
        return f"{type(self).__name__} {self.name} hits {self.attack()}"

class Warrior(Hero):
    def attack(self): return 10

class Mage(Hero):
    def attack(self): return 15

@dataclass
class Gem:
    color: str
    value: int = 1

for h in [Warrior("Amir"), Mage("Lia")]:
    print(h)
print(Gem("green"))
try:
    Hero("x")
except TypeError:
    print("can't make abstract hero")`);
  expect(r.stdout).toBe(
    "Warrior Amir hits 10\nMage Lia hits 15\nGem(color='green', value=1)\ncan't make abstract hero\n",
  );
});

test("input() reads stdin", async () => {
  const r = await run("a = int(input())\nb = int(input())\nprint(a + b)", "20\n22\n");
  expect(r.stdout).toBe("42\n");
});

test("input() without stdin is a runtime error, not a hang", async () => {
  const r = await run("x = input()");
  expect(r.runtimeError).toContain("EOFError");
});

test("syntax error is a compile error with line number", async () => {
  const r = await run('print("ok")\nif True\n    print("x")');
  expect(r.stdout).toBe("");
  expect(r.compileErrors?.[0].line).toBe(2);
  console.log(`[python] syntax error: ${r.compileErrors?.[0].message}`);
});

test("runtime error names the error and the line", async () => {
  const r = await run('print("before")\nitems = [1, 2]\nprint(items[5])');
  expect(r.stdout).toBe("before\n");
  expect(r.runtimeError).toBe("IndexError: list index out of range (line 3)");
});

test("each run starts with fresh variables", async () => {
  await run("secret = 1");
  const r = await run("print(secret)");
  expect(r.runtimeError).toContain("NameError");
});

test("sys.exit() with no code is a normal finish", async () => {
  const r = await run('import sys\nprint("bye")\nsys.exit()');
  expect(r.stdout).toBe("bye\n");
  expect(r.runtimeError).toBeUndefined();
});

test("non-ASCII output survives (accents, emoji)", async () => {
  const r = await run('print("héllo ✨ 💎")');
  expect(r.stdout).toBe("héllo ✨ 💎\n");
});

test("output is capped even if the program catches the error", async () => {
  const r = await run(`for i in range(200000):
    try:
        print("xxxxxxxxxx", end="")
    except Exception:
        pass`);
  expect(r.stdout.length).toBeLessThanOrEqual(64_000);
  expect(r.runtimeError).toContain("Too much output");
});

test("endless loop is stopped by the timeout and the runner recovers", async () => {
  test.setTimeout(90_000);
  const r = await run("while True:\n    pass");
  expect(r.timedOut).toBe("run");
  const again = await run('print("back")');
  expect(again.stdout).toBe("back\n");
});

test("leftover input from one run never leaks into the next", async () => {
  const first = await run("print(input())", "5\n6\n");
  expect(first.stdout).toBe("5\n");
  const second = await run("print(input())", "7\n");
  expect(second.stdout).toBe("7\n");
});

test("empty stdin means input() hits end of input", async () => {
  const r = await run("x = input()", "");
  expect(r.runtimeError).toContain("EOFError");
});

test("changes to the interpreter don't carry over to the next run", async () => {
  await run(`import sys, builtins, io
sys.setrecursionlimit(50)
sys.stdout = io.StringIO()
builtins.print = lambda *a, **k: None`);
  const r = await run(`def depth(n):
    return 0 if n == 0 else 1 + depth(n - 1)
print(depth(200))`);
  expect(r.stdout).toBe("200\n");
});

test("a fatal crash (huge recursion) doesn't break later runs", async () => {
  test.setTimeout(90_000);
  const crash = await run(`import sys
sys.setrecursionlimit(10**6)
def f(n):
    return f(n + 1)
f(0)`);
  console.log(`[python] deep recursion result: ${JSON.stringify({ ...crash, stdout: undefined })}`);
  const again = await run('print("back")');
  expect(again.stdout).toBe("back\n");
});

test("exceptions without a message read cleanly", async () => {
  const r = await run("raise ValueError");
  expect(r.runtimeError).toBe("ValueError (line 1)");
});
