import { AREA_IDS, type AreaId, type Difficulty, type HintCost, TASKS_PER_AREA } from "../core/rules";

export type CodeRule = { kind: "mustMatch" | "mustNotMatch"; pattern: string; message: string };
export type Task = {
  id: string;
  title: string;
  difficulty: Difficulty;
  prompt: string;
  starter: string;
  solution: string;
  tests: { stdin?: string; expectedStdout: string }[];
  rules?: CodeRule[];
};
export type Boss = Omit<Task, "difficulty"> & { name: string; hints: { cost: HintCost; text: string }[] };
export type AreaContent = {
  id: AreaId;
  order: number;
  name: string;
  lesson: { title: string; pages: { heading: string; body: string; code?: string }[] };
  tasks: Task[];
  boss: Boss;
};

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function text(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}
function task(value: unknown): boolean {
  if (!record(value) || ![value.id, value.title, value.prompt, value.starter, value.solution].every(text)) return false;
  if (
    !Array.isArray(value.tests) ||
    value.tests.length === 0 ||
    !value.tests.every(
      (test: unknown) =>
        record(test) &&
        typeof test.expectedStdout === "string" &&
        (test.stdin === undefined || typeof test.stdin === "string"),
    )
  )
    return false;
  if (value.rules !== undefined) {
    if (
      !Array.isArray(value.rules) ||
      !value.rules.every((rule: unknown) => {
        if (
          !record(rule) ||
          (rule.kind !== "mustMatch" && rule.kind !== "mustNotMatch") ||
          !text(rule.pattern) ||
          !text(rule.message)
        )
          return false;
        try {
          new RegExp(rule.pattern);
          return true;
        } catch {
          return false;
        }
      })
    )
      return false;
  }
  return true;
}
export function isAreaContent(value: unknown): value is AreaContent {
  if (
    !record(value) ||
    !AREA_IDS.some((id) => id === value.id) ||
    value.order !== AREA_IDS.indexOf(value.id as AreaId) + 1 ||
    !text(value.name)
  )
    return false;
  if (
    !record(value.lesson) ||
    !text(value.lesson.title) ||
    !Array.isArray(value.lesson.pages) ||
    value.lesson.pages.length === 0 ||
    !value.lesson.pages.every(
      (page: unknown) =>
        record(page) &&
        text(page.heading) &&
        text(page.body) &&
        (page.code === undefined || typeof page.code === "string"),
    )
  )
    return false;
  if (
    !Array.isArray(value.tasks) ||
    value.tasks.length !== TASKS_PER_AREA ||
    !value.tasks.every(
      (entry: unknown) => task(entry) && record(entry) && ["easy", "normal", "hard"].includes(String(entry.difficulty)),
    )
  )
    return false;
  const ids = value.tasks.map((entry: { id: string }) => entry.id);
  if (
    new Set(ids).size !== TASKS_PER_AREA ||
    !task(value.boss) ||
    !record(value.boss) ||
    ids.includes(String(value.boss.id)) ||
    !text(value.boss.name)
  )
    return false;
  return (
    Array.isArray(value.boss.hints) &&
    value.boss.hints.length >= 3 &&
    value.boss.hints.every(
      (hint: unknown) =>
        record(hint) && [1, 2, 3].includes(Number(hint.cost)) && typeof hint.cost === "number" && text(hint.text),
    )
  );
}
