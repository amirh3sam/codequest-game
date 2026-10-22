import { spawnSync } from "node:child_process";

// Run through npm's JS entry point: npx.cmd requires shell quoting on Windows.
// Keep orchestration tooling out of the browser game's dependency tree.
if (!process.env.npm_execpath) {
  throw new Error("Use npm run ruflo -- <command> to run the project Ruflo CLI.");
}

const result = spawnSync(
  process.execPath,
  [
    process.env.npm_execpath,
    "exec",
    "--yes",
    "--omit=optional",
    "--ignore-scripts",
    "--package=ruflo@3.59.12",
    "--",
    "ruflo",
    ...process.argv.slice(2),
  ],
  {
    stdio: "inherit",
    // CLI commands should finish without starting project background workers.
    env: { ...process.env, RUFLO_DAEMON_AUTOSTART: "0" },
  },
);

if (result.error) {
  throw result.error;
}
process.exitCode = result.status ?? 1;
