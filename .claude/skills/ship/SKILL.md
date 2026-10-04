---
name: ship
description: Open a PR from the current branch to main, wait for CI, squash-merge when green, delete the branch and pull main.
disable-model-invocation: true
---

1. Refuse if on `main`. Make sure everything is committed and pushed (`git status`, `git push`).
2. Create the PR: `gh pr create --base main --fill` (title = conventional commit style; body ends with "🤖 Generated with [Claude Code](https://claude.com/claude-code)"). If a PR exists, reuse it.
3. Wait for CI: `gh pr checks --watch`.
4. If CI fails: show the failing step (`gh run view --log-failed`), stop and suggest /bugfix. Never merge red.
5. If green: `gh pr merge --squash --delete-branch`.
6. `git checkout main && git pull`.
7. Report the PR URL and merge result in 3 lines.
