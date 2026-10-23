import type { Lang } from "../runners/types";

export function diagnosticLine(message: string): number | undefined {
  const match = message.match(/\bline\s+(\d+)\b/i) ?? message.match(/\((\d+)[,:](\d+)\)/);
  const line = Number(match?.[1]);
  return Number.isSafeInteger(line) && line > 0 ? line : undefined;
}

export function beginnerHint(message: string, lang: Lang): string {
  const text = message.toLowerCase();
  if (/not defined|undefined|cannot find symbol|cannot find name|undeclared|nameerror/.test(text))
    return "Check the spelling and capitalization, then make sure the variable or class is declared or imported.";
  if (/indentation|unexpected indent|expected an indented block/.test(text))
    return "Python uses indentation to mark code blocks. Align statements inside the same block consistently.";
  if (/cannot find module|no module named|file not found|package .* does not exist/.test(text))
    return "Check that the file name and import path match exactly, including capitalization.";
  if (/expected|syntax|semicolon|unclosed|unexpected token|reached end/.test(text))
    return lang === "python"
      ? "Check quotes, parentheses, and indentation near the reported line."
      : "Check quotes, braces, parentheses, and semicolons near the reported line.";
  if (/type .* is not assignable|incompatible types|cannot convert/.test(text))
    return "Compare the value's type with what this variable or method expects.";
  return "Read the first error carefully, then inspect the reported line and the line just above it.";
}

export function focusEditorLine(editor: HTMLTextAreaElement, line: number): void {
  const starts = editor.value.split("\n");
  const target = Math.min(Math.max(line, 1), starts.length);
  const offset = starts.slice(0, target - 1).reduce((sum, row) => sum + row.length + 1, 0);
  editor.focus();
  editor.setSelectionRange(offset, offset + (starts[target - 1]?.length ?? 0));
  const before = editor.value.slice(0, offset).split("\n").length;
  editor.scrollTop = Math.max(0, (before - 3) * 22);
}
