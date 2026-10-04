// Copies language runtimes that come from npm into public/runtimes/ so the game serves
// them itself (offline, no CDN). Runs automatically before dev and build.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FORMAT = 2;

const runtimes = [
  {
    from: "node_modules/pyodide",
    to: "public/runtimes/python",
    files: ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"],
  },
  {
    // Standard library type definitions for type-checking player TypeScript (one file = one request).
    from: "node_modules/typescript-js",
    to: "public/runtimes/typescript",
    files: ["libs.json"],
  },
];

/** Bundles the ES library .d.ts files (no DOM) into one JSON object: { "lib.es5.d.ts": "..." }. */
function writeLibsBundle(libDir, dest) {
  const libs = {};
  for (const name of readdirSync(libDir)) {
    if (/^lib\.(es5|es20(1[5-9]|2[0-2])|decorators)[\w.]*\.d\.ts$/.test(name)) {
      libs[name] = readFileSync(join(libDir, name), "utf8");
    }
  }
  writeFileSync(dest, JSON.stringify(libs));
}

for (const { from, to, files } of runtimes) {
  const pkg = join(from, "package.json");
  if (!existsSync(pkg)) throw new Error(`Missing ${pkg}. Run npm install.`);
  // FORMAT is part of the stamp, so changing what we copy or generate forces a rebuild.
  const version = `${JSON.parse(readFileSync(pkg, "utf8")).version}+format${FORMAT}`;
  const stamp = join(to, ".version");
  // Recopy everything when the package version changes; the files must all match each other.
  const upToDate =
    existsSync(stamp) && readFileSync(stamp, "utf8") === version && files.every((file) => existsSync(join(to, file)));
  if (upToDate) continue;
  mkdirSync(to, { recursive: true });
  for (const file of files) {
    if (file === "libs.json") writeLibsBundle(join(from, "lib"), join(to, file));
    else copyFileSync(join(from, file), join(to, file));
  }
  writeFileSync(stamp, version);
  console.log(`copied ${from}@${version} → ${to}`);
}
