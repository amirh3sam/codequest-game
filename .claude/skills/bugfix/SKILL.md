---
name: bugfix
description: Fix a bug test-first on its own branch (reproduce, failing test, root cause, fix, full suite green, commit, push). Use whenever the user reports a bug.
argument-hint: <what is broken>
---

Bug: $ARGUMENTS

1. Make sure the working tree is clean. From up-to-date `main`, create branch `fix/<short-kebab-name>`.
2. Reproduce the bug (run the app or a test) and write down the exact steps.
3. Write a **failing test** that shows the bug (tester can help). Run it and confirm it fails.
4. Find the root cause. Explain it in 1–2 lines.
5. Fix it with the smallest change.
6. Run the **full** suite (`npm run lint`, `npm test`, and e2e if UI/runners are involved). All green.
7. Commit `fix: …` and push the branch.
8. Report: cause, fix, tests. Suggest /ship.
