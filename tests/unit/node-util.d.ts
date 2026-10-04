// The two Node functions tests/unit/inspect.test.ts compares against (avoids adding @types/node).
declare module "node:util" {
  export function format(...args: unknown[]): string;
  export function inspect(value: unknown): string;
}
