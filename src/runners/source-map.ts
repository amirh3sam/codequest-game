// Minimal source-map reader: maps a line in compiled JS back to the player's TypeScript line.
// TypeScript removes type-only lines (interfaces, type aliases), so the lines drift apart.

const BASE64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Decodes one Base64 VLQ segment ("AAAA", "SAAS", ...) into numbers. */
export function decodeVlq(segment: string): number[] {
  const values: number[] = [];
  let value = 0;
  let shift = 0;
  for (const char of segment) {
    const digit = BASE64.indexOf(char);
    if (digit < 0) throw new Error(`Bad VLQ character: ${char}`);
    value += (digit & 31) << shift;
    if (digit & 32) {
      shift += 5;
    } else {
      values.push(value & 1 ? -(value >>> 1) : value >>> 1);
      value = 0;
      shift = 0;
    }
  }
  return values;
}

/**
 * Returns a lookup from 1-based generated line to 1-based original line,
 * using the first mapped segment on each generated line.
 */
export function lineMapper(mappings: string): (generatedLine: number) => number | undefined {
  const table: (number | undefined)[] = [];
  let originalLine = 0; // source-map fields are relative to the previous segment
  mappings.split(";").forEach((line, index) => {
    let first: number | undefined;
    for (const segment of line.split(",")) {
      if (!segment) continue;
      const fields = decodeVlq(segment);
      if (fields.length >= 4) {
        originalLine += fields[2];
        first ??= originalLine;
      }
    }
    table[index] = first === undefined ? undefined : first + 1;
  });
  return (generatedLine) => table[generatedLine - 1];
}
