import { wrapBeginnerProgram } from "../content/first-program";
import type { Lang } from "../runners/types";

export const REVIEW_TOPICS = ["variables", "conditions", "loops"] as const;
export type ReviewTopic = (typeof REVIEW_TOPICS)[number];
export type ReviewRecord = {
  misses: number;
  wins: number;
  variant: number;
  draft?: string;
  needsReview?: boolean;
  lastMiss?: number;
};
export type ReviewState = Partial<Record<ReviewTopic, ReviewRecord>>;
export const newReview = (): ReviewRecord => ({ misses: 0, wins: 0, variant: 0 });
export function isReviewState(value: unknown): value is ReviewState {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.entries(value).every(
    ([key, r]) =>
      REVIEW_TOPICS.includes(key as ReviewTopic) &&
      !!r &&
      typeof r === "object" &&
      Number.isInteger(r.misses) &&
      r.misses >= 0 &&
      r.misses <= 999 &&
      Number.isInteger(r.wins) &&
      r.wins >= 0 &&
      r.wins <= 999 &&
      Number.isInteger(r.variant) &&
      r.variant >= 0 &&
      r.variant < 3 &&
      (r.needsReview === undefined || typeof r.needsReview === "boolean") &&
      (r.lastMiss === undefined || (Number.isSafeInteger(r.lastMiss) && r.lastMiss >= 0)) &&
      (r.draft === undefined || (typeof r.draft === "string" && r.draft.length <= 16000)),
  );
}
export function noteMistake(state: ReviewState | undefined, topic: ReviewTopic, at: number): ReviewState {
  const r = state?.[topic] ?? newReview();
  return { ...state, [topic]: { ...r, misses: Math.min(999, r.misses + 1), needsReview: true, lastMiss: at } };
}
export function finishReview(state: ReviewState | undefined, topic: ReviewTopic): ReviewState {
  const r = state?.[topic] ?? newReview();
  return {
    ...state,
    [topic]: {
      ...r,
      wins: Math.min(999, r.wins + 1),
      variant: (r.variant + 1) % 3,
      draft: undefined,
      needsReview: false,
    },
  };
}
export function recommendedReview(state: ReviewState | undefined): ReviewTopic {
  return [...REVIEW_TOPICS].sort((a, b) => {
    const first = state?.[a] ?? newReview(),
      second = state?.[b] ?? newReview();
    return (
      Number(!!second.needsReview) - Number(!!first.needsReview) ||
      (first.needsReview && second.needsReview
        ? (second.lastMiss ?? 0) - (first.lastMiss ?? 0)
        : first.wins - second.wins)
    );
  })[0];
}
export type ReviewCase = { label: string; code: string; expected: string };
const print = (lang: Lang, expr: string) =>
  lang === "python" ? `print(${expr})` : lang === "java" ? `System.out.println(${expr});` : `console.log(${expr});`;
const number = (lang: Lang, name: string, value: number) =>
  lang === "python" ? `${name} = ${value}` : `${lang === "java" ? "int" : "let"} ${name} = ${value};`;
export function reviewLesson(topic: ReviewTopic, variant: number, lang: Lang) {
  const v = Math.max(0, Math.min(2, variant)),
    end = lang === "python" ? "" : ";",
    delta = v + 3,
    limit = 5 + v;
  const title =
    topic === "variables"
      ? ["Supply cart", "Library returns", "Solar charge"][v]
      : topic === "conditions"
        ? ["Rooftop cooling", "Workshop ventilation", "Server cooling"][v]
        : ["Festival lanterns", "Transit signs", "Garden markers"][v];
  const starter =
    topic === "variables"
      ? `parcels = ${delta}${end}`
      : topic === "conditions"
        ? "temperature > limit"
        : lang === "python"
          ? "for marker in range(1, count):\n    print(marker)"
          : lang === "java"
            ? "for (int marker = 1; marker < count; marker++) {\n    System.out.println(marker);\n}"
            : "for (let marker = 1; marker < count; marker++) {\n    console.log(marker);\n}";
  const solution =
    topic === "variables"
      ? `parcels += ${delta}${end}`
      : topic === "conditions"
        ? `occupied ${lang === "python" ? "and" : "&&"} temperature >= limit`
        : lang === "python"
          ? "for marker in range(1, count + 1):\n    print(marker)"
          : starter.replace("marker < count", "marker <= count");
  const goal =
    topic === "variables"
      ? `Add ${delta} to the parcels already in the cart. We test two different starting stocks.`
      : topic === "conditions"
        ? `Print COOL only when the room is occupied and temperature is at least ${limit}. Test the exact boundary and an empty room.`
        : "Print every marker from 1 through count, including count. Your loop must adapt to two different counts.";
  const clues =
    topic === "variables"
      ? [
          "Keep the starting parcels. Update the value instead of replacing it.",
          `The extra stock is ${delta}. += adds it to the current value.`,
          solution,
        ]
      : topic === "conditions"
        ? [
            "Both occupancy and temperature matter.",
            "Include the exact limit with >=. Join the facts with and / &&.",
            solution,
          ]
        : [
            "The final marker is missing from the starter loop.",
            lang === "python"
              ? "range stops before its end. Use count + 1."
              : "Include count by using <= in the loop condition.",
            solution,
          ];
  function cases(draft: string): ReviewCase[] {
    if (topic === "variables")
      return [2 + v, 6 + v].map((start) => ({
        label: `${start} parcels + ${delta}`,
        code: wrapBeginnerProgram(lang, [number(lang, "parcels", start), draft, print(lang, "parcels")].join("\n")),
        expected: String(start + delta),
      }));
    if (topic === "loops")
      return [3 + v, 5 + v].map((count) => ({
        label: `${count} markers`,
        code: wrapBeginnerProgram(lang, `${number(lang, "count", count)}\n${draft}`),
        expected: Array.from({ length: count }, (_, i) => i + 1).join("\n"),
      }));
    return [
      { occupied: false, temp: limit + 2 },
      { occupied: true, temp: limit - 1 },
      { occupied: true, temp: limit },
      { occupied: true, temp: limit + 3 },
    ].map((input) => {
      const flag =
        lang === "python"
          ? `occupied = ${input.occupied ? "True" : "False"}`
          : `${lang === "java" ? "boolean" : "const"} occupied = ${input.occupied};`;
      const branch =
        lang === "python"
          ? `if ${draft}:\n    print("COOL")\nelse:\n    print("WAIT")`
          : `if (${draft}) {\n    ${print(lang, '"COOL"')}\n} else {\n    ${print(lang, '"WAIT"')}\n}`;
      return {
        label: `${input.occupied ? "Occupied" : "Empty"} room · ${input.temp}°`,
        code: wrapBeginnerProgram(
          lang,
          [flag, number(lang, "temperature", input.temp), number(lang, "limit", limit), branch].join("\n"),
        ),
        expected: input.occupied && input.temp >= limit ? "COOL" : "WAIT",
      };
    });
  }
  return { title, goal, starter, solution, clues, cases };
}
