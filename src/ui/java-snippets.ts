// biome-ignore-all lint/suspicious/noTemplateCurlyInString: Monaco snippet placeholders use ${...} syntax.
export type JavaSnippet = { label: string; detail: string; insertText: string };

export const JAVA_SNIPPETS: JavaSnippet[] = [
  {
    label: "main",
    detail: "Main method",
    insertText: "public static void main(String[] args) {\n\t$0\n}",
  },
  {
    label: "psvm",
    detail: "Main method",
    insertText: "public static void main(String[] args) {\n\t$0\n}",
  },
  { label: "sout", detail: "Print a line", insertText: "System.out.println($0);" },
  { label: "sysout", detail: "Print a line", insertText: "System.out.println($0);" },
  { label: "syso", detail: "Print a line", insertText: "System.out.println($0);" },
  { label: "serr", detail: "Print an error line", insertText: "System.err.println($0);" },
  {
    label: "soutv",
    detail: "Print a variable with its name",
    insertText: 'System.out.println("${1:value} = " + ${1:value});',
  },
  { label: "print", detail: "Print without a line break", insertText: "System.out.print($0);" },
  {
    label: "fori",
    detail: "Indexed for loop",
    insertText: "for (int ${1:i} = 0; ${1:i} < ${2:limit}; ${1:i}++) {\n\t$0\n}",
  },
  {
    label: "foreach",
    detail: "For-each loop",
    insertText: "for (${1:String} ${2:item} : ${3:items}) {\n\t$0\n}",
  },
  {
    label: "iter",
    detail: "For-each loop",
    insertText: "for (${1:String} ${2:item} : ${3:items}) {\n\t$0\n}",
  },
  { label: "if", detail: "If statement", insertText: "if (${1:condition}) {\n\t$0\n}" },
  {
    label: "ifelse",
    detail: "If and else statement",
    insertText: "if (${1:condition}) {\n\t$2\n} else {\n\t$0\n}",
  },
  { label: "while", detail: "While loop", insertText: "while (${1:condition}) {\n\t$0\n}" },
  {
    label: "dowhile",
    detail: "Do-while loop",
    insertText: "do {\n\t$0\n} while (${1:condition});",
  },
  {
    label: "switch",
    detail: "Switch statement",
    insertText: "switch (${1:value}) {\n\tcase ${2:caseValue}:\n\t\t$0\n\t\tbreak;\n\tdefault:\n\t\tbreak;\n}",
  },
  {
    label: "trycatch",
    detail: "Try and catch block",
    insertText: "try {\n\t$1\n} catch (Exception ${2:error}) {\n\t$0\n}",
  },
  { label: "class", detail: "Public class", insertText: "public class ${1:ClassName} {\n\t$0\n}" },
  { label: "interface", detail: "Public interface", insertText: "public interface ${1:InterfaceName} {\n\t$0\n}" },
  { label: "enum", detail: "Public enum", insertText: "public enum ${1:Name} {\n\t$0\n}" },
  {
    label: "ctor",
    detail: "Constructor",
    insertText: "public ${1:ClassName}() {\n\t$0\n}",
  },
];

export const JAVA_SHORTCUTS = JAVA_SNIPPETS.map(({ label }) => label).join(", ");
