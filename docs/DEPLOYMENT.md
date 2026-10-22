# Public game deployment

Live game: **https://codequest-game-inky.vercel.app/**.

The checked game release `3f0f671` includes Variable District and Logic Junction in all four languages. Production deployment `dpl_CynDAn9qAixZqwB3M7oYijatS8tm` was verified from an unauthenticated browser: HTTP 200, all eight Logic Junction missions and the Router completed, no page errors, and no development test hooks. Source-only documentation commits after that release do not change its game bundle.

Source: [amirh3sam/codequest-game](https://github.com/amirh3sam/codequest-game), using the local `public` Git remote. The original private `origin` is retained.

The separate Vercel project is `codequest-game`, owned by `amirhesam-tech`. It serves a static Vite build using Node 24, `npm ci`, `npm run build`, and the `dist` output directory. The build copies the local Python and TypeScript runtimes before compiling. All four languages run in browser workers; no game backend or player account is required. Progress stays in each player's browser.

`vercel.json` records the build settings. `.vercelignore` excludes local state, credentials, generated outputs and unused reference artwork. `.vercel/` and `.env.local` stay ignored by Git. The game itself requires no deployment secrets.

After each completed task, run appropriate checks, commit and push to `public`, then publish to this Vercel project. Use the authenticated CLI without putting credentials in source or command arguments:

The current GitHub app connection does not grant Vercel access to the new repository, so publishing currently uses the CLI after each push. The public game does not depend on that Git integration.

```powershell
npx vercel@65.1.0 --prod --yes --scope amirhesam-tech
```

Confirm the returned production alias is publicly accessible and verify the game plus its worker/WASM assets from a fresh browser session.
