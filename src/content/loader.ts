import type { AreaId } from "../core/rules";
import type { Lang } from "../runners/types";
import java from "./data/java/01-variables.json" with { type: "json" };
import javaConditions from "./data/java/02-conditions.json" with { type: "json" };
import javascript from "./data/javascript/01-variables.json" with { type: "json" };
import javascriptConditions from "./data/javascript/02-conditions.json" with { type: "json" };
import python from "./data/python/01-variables.json" with { type: "json" };
import pythonConditions from "./data/python/02-conditions.json" with { type: "json" };
import typescript from "./data/typescript/01-variables.json" with { type: "json" };
import typescriptConditions from "./data/typescript/02-conditions.json" with { type: "json" };
import { type AreaContent, isAreaContent } from "./schema";

const areas: Record<Lang, unknown> = { java, javascript, python, typescript };
const conditions: Record<Lang, unknown> = {
  java: javaConditions,
  javascript: javascriptConditions,
  python: pythonConditions,
  typescript: typescriptConditions,
};
const districts: Partial<Record<AreaId, Record<Lang, unknown>>> = { variables: areas, conditions };
export function isAreaAvailable(id: AreaId): boolean {
  return districts[id] !== undefined;
}
export function loadArea(lang: Lang, id: AreaId): AreaContent {
  const area = districts[id]?.[lang];
  if (!isAreaContent(area)) throw new Error(`Invalid or unavailable ${id} content for ${lang}.`);
  return area;
}
export function loadVariables(lang: Lang): AreaContent {
  return loadArea(lang, "variables");
}
