---
name: new-content
description: Create the lesson, 8 tasks and boss for one language and area as a JSON content file, with every reference solution verified. Use when the user asks for new area content.
argument-hint: <language> <area>   e.g. python conditions
---

Content to create: $ARGUMENTS

1. Branch `feat/content-<language>-<area>` from up-to-date `main`.
2. Delegate to **content-author**: write `src/content/data/<language>/<NN-area>.json` following src/content/schema.ts and the PRD rules (lesson pages, 3 easy + 3 normal + 2 hard tasks, boss with 3 hints).
3. Show the user the task list (title, difficulty, concept) and **wait for OK** on the curriculum.
4. Run the content validation and the reference-solutions e2e test for that language. Max 3 fix rounds.
5. **reviewer** checks for wrong expected output, hints that give away the answer, and unclear wording.
6. doc-writer ticks the ROADMAP task and updates CHANGELOG. Commit `feat(content): <language> <area>` and push.
