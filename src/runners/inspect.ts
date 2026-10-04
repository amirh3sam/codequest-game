// A port of the parts of Node's `util.inspect` / `util.format` that console.log uses, so player
// output in the browser matches what Node (and every JS tutorial) prints. Unit tests compare
// this against the real Node implementation (tests/unit/inspect.test.ts).
// Defaults match console.log: depth 2, compact 3, breakLength 80, maxArrayLength 100.

const DEPTH = 2;
const COMPACT = 3;
const BREAK_LENGTH = 80;
const MAX_ARRAY_LENGTH = 100;
const MIN_LINE_WIDTH = 16;

type Ctx = {
  depth: number;
  seen: object[];
  circular?: Map<object, number>;
  indentationLvl: number;
  currentDepth: number;
};

const newCtx = (depth = DEPTH): Ctx => ({ depth, seen: [], indentationLvl: 0, currentDepth: 0 });

/** Formats one value like `util.inspect(value)` with console.log's options. */
export function inspect(value: unknown, depth = DEPTH): string {
  return formatValue(newCtx(depth), value, 0);
}

/** Formats console.log arguments like Node's `util.format` (including %s, %d, %i, %f, %j, %o, %O, %c). */
export function formatLog(args: unknown[]): string {
  const first = args[0];
  let a = 0;
  let str = "";
  let join = "";
  if (typeof first === "string") {
    if (args.length === 1) return first;
    let lastPos = 0;
    let tempStr = "";
    for (let i = 0; i < first.length - 1; i++) {
      if (first.charCodeAt(i) !== 37) continue; // '%'
      const next = first.charCodeAt(++i);
      if (a + 1 !== args.length) {
        switch (next) {
          case 115: {
            // %s
            const arg = args[++a];
            if (typeof arg === "number") tempStr = formatNumber(arg);
            else if (typeof arg === "bigint") tempStr = `${arg}n`;
            else if (typeof arg !== "object" || arg === null || !hasBuiltInToString(arg)) tempStr = String(arg);
            else tempStr = inspect(arg, 0);
            break;
          }
          case 106: // %j
            tempStr = tryStringify(args[++a]);
            break;
          case 100: {
            // %d
            const arg = args[++a];
            if (typeof arg === "bigint") tempStr = `${arg}n`;
            else if (typeof arg === "symbol") tempStr = "NaN";
            else tempStr = formatNumber(Number(arg));
            break;
          }
          case 79: // %O
            tempStr = inspect(args[++a]);
            break;
          case 111: // %o (Node also shows hidden properties; rare in beginner code)
            tempStr = inspect(args[++a], 4);
            break;
          case 105: {
            // %i
            const arg = args[++a];
            if (typeof arg === "bigint") tempStr = `${arg}n`;
            else if (typeof arg === "symbol") tempStr = "NaN";
            // biome-ignore lint/correctness/useParseIntRadix: Node's %i calls parseInt without a radix
            else tempStr = formatNumber(Number.parseInt(String(arg)));
            break;
          }
          case 102: {
            // %f
            const arg = args[++a];
            tempStr = typeof arg === "symbol" ? "NaN" : formatNumber(Number.parseFloat(String(arg)));
            break;
          }
          case 99: // %c (CSS, ignored)
            a += 1;
            tempStr = "";
            break;
          case 37: // %%
            str += first.slice(lastPos, i);
            lastPos = i + 1;
            continue;
          default:
            continue;
        }
        if (lastPos !== i - 1) str += first.slice(lastPos, i - 1);
        str += tempStr;
        lastPos = i + 1;
      } else if (next === 37) {
        str += first.slice(lastPos, i);
        lastPos = i + 1;
      }
    }
    if (lastPos !== 0) {
      a++;
      join = " ";
      if (lastPos < first.length) str += first.slice(lastPos);
    }
  }
  while (a < args.length) {
    const value = args[a];
    str += join;
    str += typeof value !== "string" ? inspect(value) : value;
    join = " ";
    a++;
  }
  return str;
}

function tryStringify(value: unknown): string {
  try {
    return JSON.stringify(value) as string;
  } catch (e) {
    if (e instanceof Error && /circular/i.test(e.message)) return "[Circular]";
    throw e;
  }
}

const BUILTIN_PROTOS = new Set<object>([
  Object.prototype,
  Array.prototype,
  Function.prototype,
  Date.prototype,
  Error.prototype,
  RegExp.prototype,
  Number.prototype,
  String.prototype,
  Boolean.prototype,
  Symbol.prototype,
  Map.prototype,
  Set.prototype,
  Promise.prototype,
]);

/** True unless a user-defined class or object overrides toString (then %s uses it). */
function hasBuiltInToString(value: object): boolean {
  let obj: object | null = value;
  while (obj) {
    if (Object.hasOwn(obj, "toString")) return BUILTIN_PROTOS.has(obj);
    obj = Object.getPrototypeOf(obj);
  }
  return true;
}

function formatNumber(n: number): string {
  return Object.is(n, -0) ? "-0" : `${n}`;
}

// --- strings ---------------------------------------------------------------

const META: string[] = [];
for (let i = 0; i < 0x20; i++) META[i] = `\\x${i.toString(16).toUpperCase().padStart(2, "0")}`;
Object.assign(META, { 8: "\\b", 9: "\\t", 10: "\\n", 12: "\\f", 13: "\\r" });
META[0x7f] = "\\x7F";

function strEscape(str: string): string {
  let quote = "'";
  let escapeQuote = true;
  if (str.includes("'")) {
    if (!str.includes('"')) {
      quote = '"';
      escapeQuote = false;
    } else if (!str.includes("`") && !str.includes("${")) {
      quote = "`";
      escapeQuote = false;
    }
  }
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (ch.length === 1 && (code < 0x20 || code === 0x7f)) out += META[code];
    else if (ch === "\\") out += "\\\\";
    else if (escapeQuote && ch === "'") out += "\\'";
    else out += ch;
  }
  return quote + out + quote;
}

function formatString(ctx: Ctx, value: string): string {
  if (value.length > MIN_LINE_WIDTH && value.length > BREAK_LENGTH - ctx.indentationLvl - 4) {
    return value
      .split(/(?<=\n)/)
      .map(strEscape)
      .join(` +\n${" ".repeat(ctx.indentationLvl + 2)}`);
  }
  return strEscape(value);
}

// --- values ----------------------------------------------------------------

function formatValue(ctx: Ctx, value: unknown, recurseTimes: number): string {
  if (typeof value === "string") return formatString(ctx, value);
  if (typeof value === "number") return formatNumber(value);
  if (typeof value === "bigint") return `${value}n`;
  if (typeof value === "boolean" || value === undefined || value === null) return String(value);
  if (typeof value === "symbol") return value.toString();
  const obj = value as object;
  if (ctx.seen.includes(obj)) {
    ctx.circular ??= new Map();
    let index = ctx.circular.get(obj);
    if (index === undefined) {
      index = ctx.circular.size + 1;
      ctx.circular.set(obj, index);
    }
    return `[Circular *${index}]`;
  }
  return formatRaw(ctx, obj, recurseTimes);
}

function constructorName(obj: object): string | null {
  let proto: object | null = obj;
  while (proto) {
    const desc = Object.getOwnPropertyDescriptor(proto, "constructor");
    if (desc && typeof desc.value === "function" && desc.value.name !== "") return desc.value.name;
    proto = Object.getPrototypeOf(proto);
  }
  return null;
}

function prefixFor(ctorName: string | null, fallback: string, size = ""): string {
  if (ctorName === null) return `[${fallback}${size}: null prototype] `;
  return `${ctorName}${size} `;
}

function functionBase(fn: (...args: never) => unknown): string {
  const source = Function.prototype.toString.call(fn);
  if (source.startsWith("class") && /^class\s*[\s{]|^class\s+[\w$]/.test(source)) {
    let base = `[class ${fn.name || "(anonymous)"}`;
    const superClass = Object.getPrototypeOf(fn) as { name?: string } | null;
    if (superClass && superClass !== Function.prototype && superClass.name) base += ` extends ${superClass.name}`;
    return `${base}]`;
  }
  const type = constructorName(fn) ?? "Function";
  return fn.name ? `[${type}: ${fn.name}]` : `[${type} (anonymous)]`;
}

type Extras = "object" | "array";

function formatRaw(ctx: Ctx, value: object, recurseTimes: number): string {
  const ctorName = constructorName(value);
  let keys = Object.keys(value);
  let base = "";
  let braces: [string, string] = ["{", "}"];
  let extras: Extras = "object";
  let formatter: (ctx: Ctx, value: object, recurseTimes: number) => string[] = () => [];

  if (Array.isArray(value)) {
    const prefix = ctorName !== "Array" ? prefixFor(ctorName, "Array", `(${value.length})`) : "";
    keys = keys.filter((k) => !isIndex(k, value.length));
    braces = [`${prefix}[`, "]"];
    if (value.length === 0 && keys.length === 0) return `${braces[0]}]`;
    extras = "array";
    formatter = formatArray as typeof formatter;
  } else if (value instanceof Set) {
    const prefix = prefixFor(ctorName, "Set", `(${value.size})`);
    if (value.size === 0 && keys.length === 0) return `${prefix}{}`;
    braces = [`${prefix}{`, "}"];
    formatter = formatSet as typeof formatter;
  } else if (value instanceof Map) {
    const prefix = prefixFor(ctorName, "Map", `(${value.size})`);
    if (value.size === 0 && keys.length === 0) return `${prefix}{}`;
    braces = [`${prefix}{`, "}"];
    formatter = formatMap as typeof formatter;
  } else if (typeof value === "function") {
    base = functionBase(value as (...args: never) => unknown);
    if (keys.length === 0) return base;
  } else if (value instanceof RegExp) {
    base = RegExp.prototype.toString.call(value);
    if (keys.length === 0) return base;
  } else if (value instanceof Date) {
    base = Number.isNaN(value.getTime()) ? "Invalid Date" : value.toISOString();
    if (keys.length === 0) return base;
  } else if (value instanceof Error) {
    // Node prints the whole stack; ours would show worker internals. Lessons log err.message instead.
    base = `${value.name}: ${value.message}`;
    keys = keys.filter((k) => k !== "stack" && k !== "message");
    if (keys.length === 0) return base;
  } else if (value instanceof Number || value instanceof String || value instanceof Boolean) {
    const inner = value.valueOf();
    const type = typeof inner === "string" ? "String" : typeof inner === "number" ? "Number" : "Boolean";
    base = `[${type}: ${formatValue(newCtx(), inner, 0)}]`;
    if (typeof inner === "string") keys = keys.filter((k) => !isIndex(k, inner.length));
    if (keys.length === 0) return base;
  } else {
    if (ctorName === "Object") {
      if (keys.length === 0) return "{}";
    } else {
      braces[0] = `${prefixFor(ctorName, "Object")}{`;
      if (keys.length === 0) return `${braces[0]}}`;
    }
  }

  if (recurseTimes > ctx.depth) {
    if (Array.isArray(value)) return "[Array]";
    return `[${ctorName ?? "Object: null prototype"}]`;
  }
  recurseTimes += 1;
  ctx.seen.push(value);
  ctx.currentDepth = recurseTimes;
  const output = formatter(ctx, value, recurseTimes) as unknown as string[];
  for (const key of keys) output.push(formatProperty(ctx, value, recurseTimes, key, "object"));
  ctx.seen.pop();

  const ref = ctx.circular?.get(value);
  if (ref !== undefined) base = base === "" ? `<ref *${ref}>` : `<ref *${ref}> ${base}`;
  return reduceToSingleString(ctx, output, base, braces, extras, recurseTimes, value);
}

function isIndex(key: string, length: number): boolean {
  const n = Number(key);
  return Number.isInteger(n) && n >= 0 && n < length && String(n) === key;
}

function formatProperty(ctx: Ctx, value: object, recurseTimes: number, key: string, type: Extras): string {
  const desc = Object.getOwnPropertyDescriptor(value, key) ?? { value: (value as Record<string, unknown>)[key] };
  let str: string;
  if (desc.value !== undefined || !("get" in desc || "set" in desc)) {
    ctx.indentationLvl += 2;
    str = formatValue(ctx, desc.value, recurseTimes);
    ctx.indentationLvl -= 2;
  } else if (desc.get !== undefined) {
    str = desc.set !== undefined ? "[Getter/Setter]" : "[Getter]";
  } else {
    str = desc.set !== undefined ? "[Setter]" : "undefined";
  }
  if (type === "array") return str;
  const name = /^[a-zA-Z_][a-zA-Z_0-9]*$/.test(key) ? key : strEscape(key);
  return `${name}: ${str}`;
}

const plural = (n: number) => (n > 1 ? "s" : "");

function formatArray(ctx: Ctx, value: unknown[], recurseTimes: number): string[] {
  const len = Math.min(MAX_ARRAY_LENGTH, value.length);
  const output: string[] = [];
  for (let i = 0; i < len; i++) {
    if (!Object.hasOwn(value, i)) return formatSparseArray(ctx, value, recurseTimes, len, output, i);
    output.push(formatProperty(ctx, value, recurseTimes, String(i), "array"));
  }
  const remaining = value.length - len;
  if (remaining > 0) output.push(`... ${remaining} more item${plural(remaining)}`);
  return output;
}

/** Arrays with holes: `[ 1, <2 empty items>, 4 ]` (Node's formatSpecialArray). */
function formatSparseArray(
  ctx: Ctx,
  value: unknown[],
  recurseTimes: number,
  maxLength: number,
  output: string[],
  start: number,
): string[] {
  const keys = Object.keys(value);
  let index = start;
  for (let i = start; i < keys.length && output.length < maxLength; i++) {
    const key = keys[i];
    const tmp = Number(key);
    if (tmp > 2 ** 32 - 2) break;
    if (`${index}` !== key) {
      if (!/^(0|[1-9][0-9]*)$/.test(key)) break;
      const emptyItems = tmp - index;
      output.push(`<${emptyItems} empty item${plural(emptyItems)}>`);
      index = tmp;
      if (output.length === maxLength) break;
    }
    output.push(formatProperty(ctx, value, recurseTimes, key, "array"));
    index++;
  }
  const remaining = value.length - index;
  if (output.length !== maxLength) {
    if (remaining > 0) output.push(`<${remaining} empty item${plural(remaining)}>`);
  } else if (remaining > 0) {
    output.push(`... ${remaining} more item${plural(remaining)}`);
  }
  return output;
}

function formatSet(ctx: Ctx, value: Set<unknown>, recurseTimes: number): string[] {
  const output: string[] = [];
  ctx.indentationLvl += 2;
  for (const v of value) output.push(formatValue(ctx, v, recurseTimes));
  ctx.indentationLvl -= 2;
  return output;
}

function formatMap(ctx: Ctx, value: Map<unknown, unknown>, recurseTimes: number): string[] {
  const output: string[] = [];
  ctx.indentationLvl += 2;
  for (const [k, v] of value)
    output.push(`${formatValue(ctx, k, recurseTimes)} => ${formatValue(ctx, v, recurseTimes)}`);
  ctx.indentationLvl -= 2;
  return output;
}

function groupArrayElements(ctx: Ctx, output: string[], value: unknown[]): string[] {
  let totalLength = 0;
  let maxLength = 0;
  let outputLength = output.length;
  // Leave the "... n more items" entry out of the grid.
  if (MAX_ARRAY_LENGTH < output.length) outputLength--;
  const separatorSpace = 2;
  const dataLen: number[] = [];
  for (let i = 0; i < outputLength; i++) {
    const len = output[i].length;
    dataLen[i] = len;
    totalLength += len + separatorSpace;
    if (maxLength < len) maxLength = len;
  }
  const actualMax = maxLength + separatorSpace;
  if (actualMax * 3 + ctx.indentationLvl < BREAK_LENGTH && (totalLength / actualMax > 5 || maxLength <= 6)) {
    const averageBias = Math.sqrt(actualMax - totalLength / output.length);
    const biasedMax = Math.max(actualMax - 3 - averageBias, 1);
    const columns = Math.min(
      Math.round(Math.sqrt(2.5 * biasedMax * outputLength) / biasedMax),
      Math.floor((BREAK_LENGTH - ctx.indentationLvl) / actualMax),
      COMPACT * 4,
      15,
    );
    if (columns <= 1) return output;
    const tmp: string[] = [];
    const maxLineLength: number[] = [];
    for (let i = 0; i < columns; i++) {
      let lineLength = 0;
      for (let j = i; j < output.length; j += columns) if (dataLen[j] > lineLength) lineLength = dataLen[j];
      maxLineLength.push(lineLength + separatorSpace);
    }
    let padStart = true;
    for (let i = 0; i < output.length; i++) {
      if (typeof value[i] !== "number" && typeof value[i] !== "bigint") {
        padStart = false;
        break;
      }
    }
    for (let i = 0; i < outputLength; i += columns) {
      const max = Math.min(i + columns, outputLength);
      let str = "";
      let j = i;
      for (; j < max - 1; j++) {
        const cell = `${output[j]}, `;
        str += padStart ? cell.padStart(maxLineLength[j - i], " ") : cell.padEnd(maxLineLength[j - i], " ");
      }
      str += padStart ? output[j].padStart(maxLineLength[j - i] - separatorSpace, " ") : output[j];
      tmp.push(str);
    }
    if (MAX_ARRAY_LENGTH < output.length) tmp.push(output[outputLength]);
    return tmp;
  }
  return output;
}

function isBelowBreakLength(output: string[], start: number, base: string): boolean {
  let totalLength = output.length + start;
  if (totalLength + output.length > BREAK_LENGTH) return false;
  for (const entry of output) {
    totalLength += entry.length;
    if (totalLength > BREAK_LENGTH) return false;
  }
  return base === "" || !base.includes("\n");
}

function reduceToSingleString(
  ctx: Ctx,
  output: string[],
  base: string,
  braces: [string, string],
  extras: Extras,
  recurseTimes: number,
  value: object,
): string {
  const entries = output.length;
  if (extras === "array" && entries > 6) output = groupArrayElements(ctx, output, value as unknown[]);
  if (ctx.currentDepth - recurseTimes < COMPACT && entries === output.length) {
    const start = output.length + ctx.indentationLvl + braces[0].length + base.length + 10;
    if (isBelowBreakLength(output, start, base)) {
      const joined = output.join(", ");
      if (!joined.includes("\n")) return `${base ? `${base} ` : ""}${braces[0]} ${joined} ${braces[1]}`;
    }
  }
  const indentation = `\n${" ".repeat(ctx.indentationLvl)}`;
  return `${base ? `${base} ` : ""}${braces[0]}${indentation}  ${output.join(`,${indentation}  `)}${indentation}${braces[1]}`;
}
