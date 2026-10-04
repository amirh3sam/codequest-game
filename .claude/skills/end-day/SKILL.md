---
name: end-day
description: End a work session. Log progress, tick roadmap, update changelog, run tests, commit and push everything.
disable-model-invocation: true
---

1. Add today's entry at the **top** of docs/PROGRESS.md: date, done, next, blockers.
2. Tick finished tasks in docs/ROADMAP.md.
3. Update CHANGELOG.md `[Unreleased]`. Update CLAUDE.md if commands or structure changed.
4. Run `npm run lint` and `npm test`.
5. Commit and push:
   - Tests green: commit `docs: end of day <date>` (or the right type) and push the current branch.
   - Tests failing: commit as `wip: …` and push to the **branch**, never to main. Tell the user clearly what fails.
   - If on `main` with unshipped work, move it to a branch first.
6. Never leave work unpushed. Confirm `git status` is clean and the branch is up to date with origin.
7. Report in 5 lines: done today, test status, pushed where, first task for next time.
