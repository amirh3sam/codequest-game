---
name: backup
description: Quick save. Check for secrets and huge files, commit (wip if unfinished) and push the current branch.
disable-model-invocation: true
argument-hint: [optional message]
---

Message: $ARGUMENTS

1. `git status`. If on `main` with unfinished work, create `feat/wip-<date>` first. Never push unfinished work to main.
2. Safety check before staging:
   - No `.env` files (except `.env.example`), keys, tokens or passwords (grep the diff for `KEY`, `SECRET`, `TOKEN`, `PASSWORD`, `sk-`, `ghp_`).
   - No files over 5 MB (`find . -size +5M -not -path './node_modules/*' -not -path './.git/*'`).
   If anything is found, stop and ask the user.
3. `git add -A`, commit: use the message above, prefix `wip:` if the work is unfinished. End with the Co-Authored-By line from CLAUDE.md/devops.
4. `git push -u origin <branch>`.
5. Report: branch, commit hash, pushed yes/no.
