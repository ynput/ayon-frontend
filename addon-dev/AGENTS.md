# @ynput/ayon-addon-dev

Tooling for AYON addon frontends. The API itself (slots, `useSlot`, the manifest) is
`@ynput/ayon-addon`: read `node_modules/@ynput/ayon-addon/AGENTS.md` first.

## Vite: `ayonAddon()`

```ts
// vite.config.ts
import react from '@vitejs/plugin-react'
import { ayonAddon } from '@ynput/ayon-addon-dev/vite'

export default defineConfig({ plugins: [react(), ayonAddon({ name: 'my_addon' })] })
```

- `name` is the federation remote: the key in the server's `frontend_modules`
  (`{"my_addon": ["manifest"]}`), and the build goes to `dist/modules/<name>`.
- It exposes `./manifest` (`src/manifest.ts`, or `manifest`), plus `exposes` if the addon keeps
  keyword modules for older AYON versions.
- It shares everything AYON provides (React, the store, the router, toasts, every
  `@ynput/ayon-frontend-shared` entry) as singletons, and `@ynput/ayon-addon` with `import: false`:
  the addon never bundles a copy of it.

## CLI: `ayon-addon`

Run in the addon's frontend folder. Every command takes `--json` for scripts and agents.

| Command | What |
|---|---|
| `ayon-addon dev [--port 5173]` | Builds on every change and serves the build with CORS. Prints the AYON URL that loads it: `<server>/?addonDev=<addon>@http://localhost:5173` |
| `ayon-addon slots` | The slots of the installed `@ynput/ayon-addon`: helper, where, when the code loads |
| `ayon-addon check [--no-types]` | The manifest as AYON reads it (slots, ids, fields, pieces), that each piece's file exists, and `tsc` |

## Developing inside AYON (the default)

1. `ayon-addon dev` in the addon.
2. Open the URL it prints. The page loads your addon from the dev server instead of the installed
   version (also when it isn't installed) and shows a banner. It reloads after every rebuild.
3. `?addonDev=off`, or the banner's close button, goes back to the installed addon.

Only users in developer mode (and service users, for agents) can do this, and only from
`localhost`.

## Signing in

- People: the AYON login.
- Agents and CI: `AYON_API_KEY` (a service user's key), sent as `x-api-key`. In the AYON dev
  workbench the tools find the local stack and its key (`data/local-api-key`) on their own.
- `AYON_SERVER_URL` points the tools at another server (default `http://localhost:5000`, or the
  workbench's local stack).

## Lint preset

```js
// eslint.config.js
import { ayonAddonLint } from '@ynput/ayon-addon-dev/eslint'
export default defineConfig([..., ...ayonAddonLint])
```

Flags imports that bypass AYON's copies: `react-router-dom`, `react-router` and `react-toastify`
(use `@ynput/ayon-addon`), `@ynput/ayon-addon/host`, and a manifest importing
`@ynput/ayon-addon` instead of `@ynput/ayon-addon/manifest`.
