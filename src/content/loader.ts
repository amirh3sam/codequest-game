import type { Lang } from "../runners/types";
import java from "./data/java/01-variables.json" with { type: "json" };
import javascript from "./data/javascript/01-variables.json" with { type: "json" };
import python from "./data/python/01-variables.json" with { type: "json" };
import typescript from "./data/typescript/01-variables.json" with { type: "json" };
import { type AreaContent, isAreaContent } from "./schema";

const areas: Record<Lang, unknown> = { java, javascript, python, typescript };
export function loadVariables(lang: Lang): AreaContent {
  const area = areas[lang];
  if (!isAreaContent(area)) throw new Error(`Invalid Variable District content for ${lang}.`);
  return area;
}
