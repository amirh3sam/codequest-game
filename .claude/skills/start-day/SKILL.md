---
name: start-day
description: Start a work session. Read progress and roadmap, check git and CI, summarise where we are and suggest today's top 3 tasks.
disable-model-invocation: true
---

1. Read docs/PROGRESS.md (latest entry) and docs/ROADMAP.md (first unticked tasks).
2. Run `git status`, `git branch --show-current`, `git log --oneline -10`.
3. If a GitHub remote exists: `gh run list --limit 5`. Skip anything that doesn't exist yet.
4. Tell the user where we are in **8 lines max**, in plain English: current branch, uncommitted work, last thing done, CI state, blockers.
5. Suggest **today's top 3 tasks** from the roadmap (with FR tags), most important first.
6. Wait for the user's pick. Don't start work yet.
