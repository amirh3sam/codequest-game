---
name: qa
description: Quality check of the current branch and uncommitted changes using the tester and reviewer. Reports only, changes nothing. Use when the user asks for a check.
---

1. Show `git status` and which branch we're on.
2. In parallel, delegate:
   - **tester**: run lint, unit tests and e2e tests and report results. Must **not** edit any files this time.
   - **reviewer**: review `git diff main...HEAD` plus uncommitted changes.
3. Do **not** change any files.
4. Report: test results (pass/fail counts), must-fix list, nice-to-have list, and a one-line verdict (ready to ship or not).
