import { expect, type Page, test } from "@playwright/test";

type Result = {
  stdout: string;
  compileErrors?: { line: number; message: string }[];
  runtimeError?: string;
  timedOut?: boolean;
  compileMs?: number;
  runMs: number;
};

type Runner = { warmup(): Promise<void>; run(code: string, stdin?: string): Promise<Result> };
type TestWindow = Window & { __cqJava: Runner; __codequest: { createRunner(lang: string): Runner } };

// One page + one warm Java worker shared by all tests in this file.
test.describe.configure({ mode: "default" });
let page: Page;

async function runJava(code: string, stdin?: string): Promise<Result> {
  return page.evaluate(([c, s]) => (window as unknown as TestWindow).__cqJava.run(c, s), [code, stdin] as const);
}

const main = (body: string, extra = "") =>
  `public class Main {\n${extra}\n  public static void main(String[] args) {\n${body}\n  }\n}`;

test.beforeAll(async ({ browser }) => {
  page = await browser.newPage();
  await page.goto("/");
  await page.waitForFunction(() => "__codequest" in window);
  const warmMs = await page.evaluate(async () => {
    const w = window as unknown as TestWindow;
    w.__cqJava = w.__codequest.createRunner("java");
    const t = performance.now();
    await w.__cqJava.warmup();
    return performance.now() - t;
  });
  console.log(`[java] runtime load: ${Math.round(warmMs)} ms`);
});

test.afterAll(async () => page.close());

test("hello world prints", async () => {
  const r = await runJava(main('    System.out.println("Hello, CodeQuest!");'));
  console.log(`[java] first run: compile ${Math.round(r.compileMs ?? 0)} ms, run ${Math.round(r.runMs)} ms`);
  expect(r.compileErrors ?? []).toEqual([]);
  expect(r.stdout).toBe("Hello, CodeQuest!\n");
});

test("variables, loops, strings, Math, formatted()", async () => {
  const r = await runJava(
    main(`    int age = 25;
    String key = "java";
    double avg = (3 + 4) / 2.0;
    StringBuilder sb = new StringBuilder();
    for (int i = 1; i <= 10; i++) if (i % 2 == 0) sb.append(i).append(' ');
    System.out.println(key + " " + age + " " + avg);
    System.out.println(sb.toString().trim());
    System.out.println(Math.max(3, 9) + " " + Math.round(3.14159 * 100) / 100.0 + " " + "%d gems".formatted(3));`),
  );
  console.log(`[java] warm run: compile ${Math.round(r.compileMs ?? 0)} ms, run ${Math.round(r.runMs)} ms`);
  expect(r.stdout).toBe("java 25 3.5\n2 4 6 8 10\n9 3.14 3 gems\n");
});

test("arrays, ArrayList, HashMap", async () => {
  const r = await runJava(
    `import java.util.*;\n${main(`    int[] a = {5, 2, 8};
    Arrays.sort(a);
    List<String> list = new ArrayList<>(List.of("gem", "heart"));
    Map<String, Integer> m = new HashMap<>();
    m.put("gems", 3);
    System.out.println(Arrays.toString(a) + " " + list + " " + m.get("gems"));`)}`,
  );
  expect(r.stdout).toBe("[2, 5, 8] [gem, heart] 3\n");
});

test("OOP: abstract class, interface, inheritance, polymorphism", async () => {
  const r = await runJava(`interface Attacker { int attack(); }
abstract class Hero implements Attacker {
  protected final String name;
  Hero(String name) { this.name = name; }
  abstract String title();
  public String toString() { return title() + " " + name + " hits " + attack(); }
}
class Warrior extends Hero { Warrior(String n) { super(n); } String title() { return "Warrior"; } public int attack() { return 10; } }
class Mage extends Hero { Mage(String n) { super(n); } String title() { return "Mage"; } public int attack() { return 15; } }
public class Main {
  public static void main(String[] args) {
    Hero[] party = { new Warrior("Amir"), new Mage("Lia") };
    for (Hero h : party) System.out.println(h);
  }
}`);
  expect(r.stdout).toBe("Warrior Amir hits 10\nMage Lia hits 15\n");
});

test("compile error gives line number", async () => {
  const r = await runJava(main('    int x = "oops";'));
  expect(r.compileErrors?.length).toBeGreaterThan(0);
  expect(r.compileErrors?.[0].line).toBe(4);
  console.log(`[java] compile error message: ${r.compileErrors?.[0].message}`);
});

test("runtime exception is reported", async () => {
  const r = await runJava(main("    int[] a = new int[2];\n    System.out.println(a[5]);"));
  expect(r.runtimeError).toBeTruthy();
  console.log(`[java] runtime error: ${r.runtimeError}`);
});

// Known limits of teavm-javac (see docs/DECISIONS.md). If one of these starts passing
// after a runtime update, the limit is gone and the docs should be updated.
test("known limit: Scanner / System.in is not available", async () => {
  const r = await runJava(`import java.util.Scanner;
${main("    Scanner s = new Scanner(System.in);")}`);
  expect(r.compileErrors?.[0].message).toContain("Scanner");
});

test("known limit: %f and %n formatting fail at runtime", async () => {
  const r = await runJava(main('    System.out.println(String.format("%.2f", 3.5));'));
  expect(r.runtimeError).toBeTruthy();
});

test("endless loop is stopped by the timeout and the runner recovers", async () => {
  const r = await runJava(main("    while (true) {}"));
  expect(r.timedOut).toBe("run");
  const again = await runJava(main('    System.out.println("back");'));
  expect(again.stdout).toBe("back\n");
});

test("modern Java: records, switch expressions, streams, var, text blocks", async () => {
  const r = await runJava(`import java.util.stream.IntStream;
public class Main {
  record Point(int x, int y) {}
  public static void main(String[] args) {
    var p = new Point(1, 2);
    int day = 3;
    String name = switch (day) { case 1 -> "one"; case 3 -> "three"; default -> "?"; };
    String block = """
        hi
        there""";
    System.out.println(p + " " + name + " " + IntStream.rangeClosed(1, 5).sum());
    System.out.println(block);
  }
}`);
  expect(r.stdout).toBe("Point[x=1, y=2] three 15\nhi\nthere\n");
});

test("non-ASCII output survives (accents, emoji)", async () => {
  const r = await runJava(main('    System.out.println("héllo ✨ 💎");'));
  expect(r.stdout).toBe("héllo ✨ 💎\n");
});

test("output is capped even if the program catches the error", async () => {
  const r = await runJava(
    main('    for (int i = 0; i < 200000; i++) { try { System.out.print("xxxxxxxxxx"); } catch (Throwable t) {} }'),
  );
  expect(r.stdout.length).toBeLessThanOrEqual(64_000);
});
