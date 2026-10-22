# Ruflo for CodeQuest

[Ruflo](https://github.com/ruvnet/ruflo) records project context and coordinates
agent work. Codex implements and tests the game. Ruflo is development tooling;
the browser game has no Ruflo dependency, account or API key requirement.

## Installed skill

The upstream core `SKILL.md` is installed at
`~/.codex/skills/ruflo/SKILL.md`. Codex discovers it on the next conversation turn.
This is a per-user installation; other contributors install their own copy.
Only the core skill was installed, rather than the entire plugin catalogue.

## Project command

```sh
npm run ruflo -- --version
npm run ruflo -- memory init
npm run ruflo -- memory search --query "CodeQuest art"
npm run ruflo -- memory retrieve --key codequest-art --namespace project
npm run ruflo -- doctor
```

The wrapper pins Ruflo **3.59.12** and uses npm's download cache. The first run
requires internet access. Optional npm dependencies and package install scripts
are omitted. `RUFLO_DAEMON_AUTOSTART=0` prevents ordinary commands from starting
background workers. Arguments are passed directly to npm without a command shell.

The project configuration is `.claude-flow/config.yaml`. Local memory was
initialized and the `project/codequest-art` entry records the art milestone and
next roadmap task. The CLI's persistent store is `.swarm/memory.db`; it also
maintains an AgentDB mirror in `.claude/memory.db`. Databases, generated policies,
logs, metrics and machine-specific state are git-ignored.

## Current scope and health

The skill, CLI and local memory are usable. This setup does not register a new
MCP server in the currently running Codex session. It preserves CodeQuest's
existing Claude workflow instructions.

The initial `doctor` run reported **17 passed, 15 warnings, 1 failed**. The failed
check concerns omitted optional MetaHarness packages. Other warnings cover
optional browser, embedding, security and hosted integrations, along with MCP
registration and missing API keys. Memory was initialized successfully after
that diagnostic run (6/6 initializer checks). It is not a fully configured
installation of every Ruflo service or plugin.

To resume work, read `docs/PROGRESS.md` and `docs/ROADMAP.md`, recall relevant
memory, implement one roadmap task, run the relevant checks, then update the
docs and project memory.
