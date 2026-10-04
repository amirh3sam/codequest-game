import { describe, expect, it } from "vitest";
import { decodeVlq, lineMapper } from "../../src/runners/source-map";

describe("source map", () => {
  it("decodes VLQ segments", () => {
    expect(decodeVlq("AAAA")).toEqual([0, 0, 0, 0]);
    expect(decodeVlq("SAAS")).toEqual([9, 0, 0, 9]);
    expect(decodeVlq("AACA")).toEqual([0, 0, 1, 0]);
    expect(decodeVlq("AAED")).toEqual([0, 0, 2, -1]);
    expect(decodeVlq("gBAAgB")).toEqual([16, 0, 0, 16]);
  });

  it("maps generated lines to original lines, skipping removed lines", () => {
    // Generated line 1 ← original 1; line 2 ← original 4 (2 type-only lines removed); line 3 ← original 5.
    const toOriginal = lineMapper("AAAA;AAGA;AACA");
    expect(toOriginal(1)).toBe(1);
    expect(toOriginal(2)).toBe(4);
    expect(toOriginal(3)).toBe(5);
    expect(toOriginal(4)).toBeUndefined();
  });

  it("returns undefined for lines without mappings", () => {
    const toOriginal = lineMapper(";AAAA");
    expect(toOriginal(1)).toBeUndefined();
    expect(toOriginal(2)).toBe(1);
  });
});
