// Copies language runtimes that come from npm into public/runtimes/ so the game serves
// them itself (offline, no CDN). Runs automatically before dev and build.
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const runtimes = [
  {
    from: "node_modules/pyodide",
    to: "public/runtimes/python",
    files: ["pyodide.mjs", "pyodide.asm.mjs", "pyodide.asm.wasm", "python_stdlib.zip", "pyodide-lock.json"],
  },
];

for (const { from, to, files } of runtimes) {
  const pkg = join(from, "package.json");
  if (!existsSync(pkg)) throw new Error(`Missing ${pkg}. Run npm install.`);
  const version = JSON.parse(readFileSync(pkg, "utf8")).version;
  const stamp = join(to, ".version");
  // Recopy everything when the package version changes; the files must all match each other.
  const upToDate =
    existsSync(stamp) && readFileSync(stamp, "utf8") === version && files.every((file) => existsSync(join(to, file)));
  if (upToDate) continue;
  mkdirSync(to, { recursive: true });
  for (const file of files) copyFileSync(join(from, file), join(to, file));
  writeFileSync(stamp, version);
  console.log(`copied ${from}@${version} → ${to}`);
}
