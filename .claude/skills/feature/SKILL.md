---
name: feature
description: Build a new feature end to end on its own branch (plan, build, test, review, document, commit, push). Use whenever the user asks for a new feature or roadmap task.
argument-hint: <what to build>
---

Feature request: $ARGUMENTS

1. Make sure the working tree is clean (if not, ask: /backup first?). From up-to-date `main`, create branch `feat/<short-kebab-name>`.
2. Delegate to **planner** (or game-dev / code-runner / content-author for their areas) to write the plan. Show the user the plan in short form and **wait for OK**.
3. Delegate the build to **developer** (or the matching specialist).
4. Delegate to **tester**. If tests fail, send the failures back to the builder. **Max 3 fix rounds**; then stop and tell the user what's wrong.
5. Delegate to **reviewer**. Fix every must-fix, then re-run tests and lint.
6. Delegate to **doc-writer** (CHANGELOG, ROADMAP ticks, README/CLAUDE.md if needed).
7. Commit with a conventional message (`feat: …`), then `git push -u origin <branch>`.
8. Report in 5 lines max: what was built, tests, review result, branch. Suggest /ship when ready.
