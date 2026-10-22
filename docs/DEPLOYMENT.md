# Public game deployment

Source: [amirh3sam/codequest-game](https://github.com/amirh3sam/codequest-game), using the local `public` Git remote. The original private `origin` is retained.

The separate Vercel project is `codequest-game`, owned by `amirhesam-tech`. It serves a static Vite build using Node 24, `npm ci`, `npm run build`, and the `dist` output directory. The build copies the local Python and TypeScript runtimes before compiling. All four languages run in browser workers; no game backend or player account is required. Progress stays in each player's browser.

`vercel.json` records the build settings. `.vercelignore` excludes local state, credentials, generated outputs and unused reference artwork. `.vercel/` and `.env.local` stay ignored by Git. The game itself requires no deployment secrets.

After each completed task, run appropriate checks, commit and push to `public`, then publish to this Vercel project. Use the authenticated CLI without putting credentials in source or command arguments:

```powershell
npx vercel@65.1.0 --prod --yes --scope amirhesam-tech
```

Confirm the returned production alias is publicly accessible and verify the game plus its worker/WASM assets from a fresh browser session.
