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
| `ayon-addon dev [--port 5174]` | The dev shell (below): the addon in AYON's surfaces, without AYON, with hot reload |
| `ayon-addon dev --ayon [--port 5173] [--open] [--frontend <url>]` | Builds on every change and serves the build with CORS. Checks what AYON's dev override needs on the server, then prints (`--open`: opens) the AYON URL that loads it: `<server>/?addonDev=<addon>@http://localhost:5173` |
| `ayon-addon slots` | The slots of the installed `@ynput/ayon-addon`: helper, where, when the code loads. Then the slots of the addon's contract packages (dependencies with `"ayonAddon": { "slots": ... }` in their `package.json`), as "from `<package>`" |
| `ayon-addon check [--no-types]` | The manifest as AYON reads it (slots, ids, fields, pieces), that each piece's file exists, and `tsc`. Contributions are checked against AYON's slots, those of the addon's contract packages and those it declares itself. The contract packages' preview scenes are checked too, with a note for contributions no scene renders (below) |
| `ayon-addon open <slot> <id> [--project P] [--entities type:id,...] [--page overview\|products\|lists] [--run] [--screenshot file] [--save-fixture name]` | One contribution in the dev shell in a headless browser, against the server. Reports error boxes, console errors, toasts, the context it got, the clipboard after `--run` (menu items). Exit code 1 when it failed |
| `ayon-addon preview <slot> <id> --fixture name [--run] [--prune] [--screenshot file]` | The same from `dev/fixtures/<name>.json`, without a server. `--prune` drops the answers it didn't use |
| `ayon-addon generate-rest [--schema file] [--hooks]` | The addon's server endpoints as RTK Query endpoints in AYON's api (below) |

`open` and `preview` start the dev shell themselves, or use a running one with `--url
http://localhost:5174`. They need playwright (`yarn add -D playwright`, `npx playwright install
chromium`); in the AYON dev workbench the ayon-frontend checkout's copy is used.

## Developing inside AYON (`dev --ayon`)

1. `ayon-addon dev --ayon --open` in the addon (`yarn dev:ayon` in the template and the time tracker).
2. It checks the server, builds, and opens the URL it prints (without `--open`, open it yourself).
   The page loads your addon from the dev server instead of the installed version (also when it
   isn't installed) and shows a banner. It reloads after every rebuild.
3. `?addonDev=off`, or the banner's close button, goes back to the installed addon.

- `--frontend http://localhost:3000` puts that page in the URL instead of the server (an
  ayon-frontend dev server in front of it).
- `--port` is the addon's dev server port (5173 by default; a port in use stops it with an error).
- With `--json` it prints one object once the first build is done: `url`, `addon`, `remote`,
  `buildId`, `open` (the URL), `ok` (no check failed with `error`) and `checks`
  (`{ id, ok, severity, message, fix }`).

What it checks against the server (`AYON_SERVER_URL` / `AYON_API_KEY`, or the workbench's local
stack and key), each failure with how to fix it:

| Check | Fails when |
|---|---|
| `server` | `/api/info` doesn't answer 200. Nothing else is checked. |
| `apiKey` | No key: the user and the installed versions can't be checked (warning). |
| `user` | The key is rejected (error), or the key's user is neither a service user nor in developer mode (warning: a headless browser signed in with it ignores the override). Your own browser user is not known to the CLI: it needs developer mode. |
| `addonVersion` | The `versionModule` (`src/addonVersion.ts` unless `ayonAddon({ rest })` names another) and `package.py` name different versions (warning): the frontend calls the endpoints of the former. |
| `addon` | The addon isn't installed in the version the frontend calls, or that version failed to load on the server. The page still loads the frontend from the dev server, but its endpoint calls (`/api/addons/<name>/<version>/...`) answer 404. An error when the addon has a `server/` folder, else a warning. |

The checks never stop the dev server: fix them while it runs.

### Why isn't my addon loading?

The page always says why in the banner at the bottom left (also in the console). What it says, and
the fix:

- **ignored ... only users in developer mode**: turn on Developer Mode in AYON's header (a user
  who doesn't have the switch needs Developer turned on by an admin in Studio settings > Users),
  then reload. Service users (API keys) always may.
- **ignored ... is not this machine / is not a URL / use ?addonDev=...**: the parameter must be
  `<addon>@http://localhost:<port>` (or `127.0.0.1`, `[::1]`): a link can't load code from another
  machine.
- **could not load ... no answer from**: the dev server isn't running on that port (or was
  stopped). The page reloads once it answers.
- **could not load ... has no /ayon-addon.json**: something else runs on that port (the dev shell,
  `ayon-addon dev` without `--ayon`), or the first build hasn't finished. The page reloads once it
  answers.
- **could not load ... serves "x", not "y"**: the name in the URL isn't the addon's name in
  `package.py`; use the URL the CLI prints.
- **its manifest failed to load**: the build is broken or the remote didn't start: see the
  console and the CLI's output; the page reloads after the next build.
- **The addon loads but its requests answer 404**: the server doesn't have the addon in the
  version the frontend calls. `ayon-addon dev --ayon` reports it (`addon` check); install that
  version.
- **No banner at all**: the page isn't a frontend with the dev override (an older AYON), or
  `?addonDev=off` cleared it.

## Developing without AYON: the dev shell (`dev`, the default)

`ayon-addon dev` serves the addon with Vite's dev server (hot reload) inside a dev shell instead
of AYON:

- **Real AYON surfaces** from `@ynput/ayon-frontend-shared`: the details panel, the slicer, the
  Customize panel, and the addon columns' cells and `fetchValues`, in AYON's providers (store, api,
  contexts). AYON's project list table, with only the addon's items in its menus (AYON's own,
  such as open, pin and folders, need the app). Plain stand-ins for what lives in the AYON app: the header and the
  table around the columns (its rows are the picked entities, its right-click menu has the
  `entityMenuItem` items, and once clicked it takes the `table.shortcut` keys). Pages render alone, without AYON's page tabs.
- **Developer panel**, in two resizable halves that scroll on their own: the manifest's
  contributions grouped by the area of AYON they show in (app header, studio, project with its
  slicer and tables, details panel), then by slot, with the ones AYON would skip and why; below,
  the context of the one on stage, the only place it is changed: a project switcher, the studio's
  project selection (also what a studio page's project list shows), an entity picker (AYON's) for
  the slots about entities, the table page, *Run* for menu items, a few lines of the context the
  contribution gets (click for all of it), and the preview fixtures.
- **Other addons' slots**: contributions to the slots of the addon's contract packages, under an
  area per declaring addon, in the preview scenes of the package (below).
- Above the stage, a caption names the contribution, where AYON shows it and its slot.
- The selection is in the URL
  (`?slot=…&contribution=…&ctxProject=…&ctxProjects=a,b&ctxEntities=task:<id>,…`, and
  `scene=<package>:<id>&ctxValues=<JSON>` for a preview scene, `showSlots=0` with *Show slots* off).
- Requests to `/api`, `/graphql`, `/ws` go through the dev server to the AYON server, with the API
  key when there is one (no login page); without a key the page shows AYON's login. The key is read
  for every request (the workbench's `data/local-api-key` changes when its stack is reset), and a
  request that is signed in already (you signed in on the page, or it sends its own key) goes
  without it: the server checks the key first, so it would override your sign-in.
- It needs a `@ynput/ayon-frontend-shared` build with the addon SDK (until one is released:
  `yarn copy-shared <ayon-frontend>` after `yarn build:shared` there).

### Preview: fixtures instead of a server

`?preview=<name>` (or `ayon-addon preview`) renders one contribution with the context and server
answers of `dev/fixtures/<name>.json`, and no server:

```json
{
  "slot": "detailsPanel.tab",
  "id": "comments",
  "context": { "projectName": "demo", "entityType": "task", "entities": [{ "id": "…", "entityType": "task", "projectName": "demo" }], "scope": "addon-dev" },
  "responses": { "graphql GetComments": { "status": 200, "body": { "data": { … } } } }
}
```

- Answers are keyed `GET /api/<path>?<query>` or `graphql <OperationName>` (the variables don't
  count). A request without an answer gets a 404 and fails the preview (`not in the fixture`).
- The user, the site info, the project list and the cloud status are answered by the shell (an
  admin "preview" user): fixtures leave them out.
- Record one from a live server: *Save* in the developer panel, or `ayon-addon open … --save-fixture
  <name>`; then `ayon-addon preview … --fixture <name> --prune`. A recording holds the server's real
  data: check it before committing it (project names, users, comment text).

### Other addons' slots: preview scenes

A contribution to another addon's slot (from its contract package, `@ynput/ayon-addon-<addon>`)
needs that addon's UI around it and the context it passes. The dev shell has neither, so the
contract package brings **scenes**: mock UIs of the declaring addon that render its slots with the
SDK, as the addon does in AYON, with a form for the values they build the contexts from. The
contribution is developed without that addon installed:

- The shell imports `slots.js` and `previews.js` of every contract package in the addon's
  `dependencies` and `devDependencies` (`"ayonAddon"` in their `package.json`), and registers the
  slots as if the declaring addon were installed.
- The developer panel has an area per declaring addon: its scenes, under each the slots it renders
  (the declaration's `label`, else the name in words, with the slot's name under it and its
  `description` as the tooltip), and under each slot the addon's contributions to it. A slot without
  any is listed dimmed, "no contributions". Selecting a scene or one of its slots puts the scene on
  stage, full width, with the shell's providers (right-click menus, the details panel, the user).
  Selecting a contribution jumps to the first scene that renders its slot. A contribution no scene
  renders is listed with "no preview scene in `<package>` renders `<slot>`".
- **Show slots** (the toggle above the stage, on unless turned off, in the URL): every slot on stage
  rendered with `SlotOutlet` gets a dashed outline around each of its contributions, with the slot's
  title while hovered; a slot without contributions gets a small dashed chip with its title where
  they would go. A menu slot without items gets one disabled entry, "<title> — no contributions",
  at the top of the menu. Hovering a slot in the developer panel highlights it on stage and the
  other way round. The scenes need nothing for it: the shell hands the SDK an internal hook that
  AYON never sets, so in AYON `SlotOutlet` and `useSlotMenuItems` render exactly the contributions.
- The context panel shows the scene's fields as a form, *Reset*, and the values as JSON. The values
  changed from the defaults are in the URL (`ctxValues`), so a reload or a shared link keeps them.
- `@ynput/ayon-addon` and `react` in a scene resolve to the contributing addon's copies, also when
  the contract package is linked from another checkout with its own `node_modules`: a second SDK
  would be a second registry, and the scene's slots would never see the contributions.
- Files that fail to load and invalid scenes are listed under *Contract packages*; `ayon-addon
  check` reports the same.
- A new or changed `"ayonAddon"` in a contract package's `package.json` needs a restart of
  `ayon-addon dev`.

**Adding scenes to a contract package** (for the declaring addon's developers):

```json
// package.json
"ayonAddon": { "slots": "./slots.js", "previews": "./previews.js" },
"files": ["...", "previews.js"],
"peerDependencies": { "react": ">=18", "@ynput/ayon-addon": "*" }
```

```js
// previews.js: plain JS, shipped as is (no JSX, no build step)
import { createElement as h, useMemo } from 'react'
import { SlotOutlet, useContextMenu, useSlotMenuItems } from '@ynput/ayon-addon'

// the declaring addon's card: only its layout, with AYON's CSS variables
const Card = ({ values, setValues }) => {
  const card = useMemo(() => ({ id: values.card || 'c1', title: values.title }), [values.card, values.title])
  const context = useMemo(() => ({ projectName: values.project, card }), [values.project, card])
  const menuItems = useSlotMenuItems('example.cardMenuItem')
  const openContextMenu = useContextMenu()
  return h('div', {
      style: { display: 'flex', gap: 8, padding: 8, background: 'var(--md-sys-color-surface-container)' },
      onContextMenu: (event) => {
        const { top, bottom } = menuItems({ projectName: values.project, cards: [card] })
        // entries run with `command`, the menu's items with `onClick`
        openContextMenu(event, [...top, ...bottom].map(({ command, ...item }) => ({ ...item, onClick: command })))
      },
      onDoubleClick: () => setValues({ status: 'done' }),
    },
    h('strong', null, card.title),
    h(SlotOutlet, { slot: 'example.cardBadge', context }), // where the addon puts its badges
  )
}

export const previews = [{
  id: 'card',
  label: 'A card on the board',
  description: 'Badges in its header, right-click for its menu',
  slots: ['example.cardBadge', 'example.cardMenuItem'],
  fields: [
    { key: 'project', label: 'Project', type: 'project', optional: true },
    { key: 'title', label: 'Title', type: 'text', default: 'Layout' },
    { key: 'task', label: 'Task', type: 'entity', entityType: 'task', project: 'project' },
    {
      key: 'card', label: 'A real card', type: 'pick',
      load: async (api, values) => {
        const base = api.addonUrl('example')
        if (!base) throw new Error('the example addon is not installed on the server')
        const { cards } = await (await api.fetch(`${base}/cards?project=${values.project || ''}`)).json()
        return cards.map((c) => ({ value: c.id, label: c.title, values: { title: c.title } }))
      },
    },
  ],
  component: Card,
}]
```

A scene is `{ id, label, description?, slots, fields, component }`:

- `id` is unique in the package; `slots` (at least one) are slots the package declares and the
  scene renders. `component` gets `{ values, setValues(patch) }` and renders the slots with the
  SDK (`SlotOutlet`, `useSlotMenuItems` with `useContextMenu`, ...) exactly as the addon passes
  their context. `setValues` is for what the scene changes itself (a double-click, a drag).
- Each field is `{ key, label, hint?, type, ... }`. A field without `default` starts empty:

| `type` | Extra | Value |
|---|---|---|
| `text`, `number`, `boolean` | `default?` | string (`''`), number (null), boolean (`false`) |
| `select`, `multiselect` | `options: [{ value, label }]`, `default?` | an option's value (null), a list of them (`[]`) |
| `json` | `default?` | any JSON (null); text that doesn't parse is shown as an error and not applied |
| `project` | `optional?`, `default?` (a name, or null with `optional`) | a project name; without a default the shell's project, or null when optional |
| `entity` | `entityType` (`task`, `folder`, `product`, `version`), `project` (the key of a project field) | `{ id, name, label?, entityType, projectName }` or null, picked with AYON's entity picker; cleared when that project changes |
| `pick` | `load(api, values)` returning `[{ value, label, values }]` | an option's `value`; choosing it also merges its `values`. Loaded when the list opens, errors shown under it |

- `api` is `{ fetch(path, init), addonUrl(name) }`: `fetch` reaches the server the shell uses,
  signed in; `addonUrl` is `/api/addons/<name>/<version>` of the server's production bundle, or
  null when the addon isn't installed there.
- Cover what contributors must handle with fields, not more scenes: several entities, missing
  labels, no project. Ids in the format the addon uses; no real studio data.
- A scene copies only the layout around the slots, close enough to size and place a contribution.
  It never imports the addon's own components or code (the package ships none of it), only React
  and the SDK. AYON's CSS variables (`--md-sys-color-*`, `--base-gap-*`, `--padding-*`) are on the
  page; data colours (a status colour) can be literals.
- `ayon-addon check` in a contributing addon validates them: `previews` is a list, ids are unique,
  each scene has a label, slots of the package, well-formed fields and a function `component`. A
  contribution to a slot no scene renders is a note, not a failure.

## Server endpoints: `ayon-addon generate-rest`

Addons that add their own server endpoints generate the frontend side from the addon's OpenAPI
schema (needs `@rtk-query/codegen-openapi` as a dev dependency):

1. Downloads `/api/addons/<name>/<version>/openapi.json` (name and version from `package.py`) from
   a server with that version installed, to `gen/openapi.json` (gitignore it). AYON's own
   `/openapi.json` has no addon routes. `--schema <file>` uses a saved schema instead.
2. Generates `src/api/generated/<name>.ts`: the endpoints injected into AYON's api (one cache with
   AYON's), without hooks. Operation ids are prefixed with the addon name, so endpoints can't
   clash with AYON's or another addon's (`timetrackerStartSession`). URLs use the default export
   of `src/addonVersion.ts`, so they call the running version.
3. **Never edit the generated file.** Tags, `transformResponse` and optimistic updates go in
   `src/api/<name>.ts`, which enhances the endpoints and exports their hooks. The first run creates
   it; later runs list endpoints whose hooks it doesn't export and, in a terminal, offer to add
   them in a block of their own (`--hooks`: without asking). Hooks of removed endpoints are only
   reported.

Options in `ayonAddon({ rest: { ... } })`: `queries` (POST endpoints that only read, generated as
queries), `generated`, `api`, `versionModule`, `schema` (paths).

## Signing in

- People: the AYON login.
- Agents and CI: `AYON_API_KEY` (a service user's key), sent as `x-api-key`. In the AYON dev
  workbench the tools find the local stack and its key (`data/local-api-key`) on their own.
- `AYON_SERVER_URL` points the tools at another server (default `http://localhost:5000`, or the
  workbench's local stack).
- Both can go in the addon frontend's `.env.local` or `.env` (keep them out of git): every
  command loads them at start, `.env.local` first. Variables already set in the shell win.
- With no key, a command stops and says where to get one (Settings → Users → Add Service User).
  In a terminal, with no env file yet, it walks through writing `.env`: the server (default
  `http://localhost:5000`), then the key, typed without echo (Enter leaves it for later). A key
  given there lets the command go on; without one it stops after writing the file. The file
  comes from `envFileContents` in `addon-dev/src/project.ts`.

## Lint preset

```js
// eslint.config.js
import { ayonAddonLint } from '@ynput/ayon-addon-dev/eslint'
export default defineConfig([..., ...ayonAddonLint])
```

Flags imports that bypass AYON's copies: `react-router-dom`, `react-router`, `react-toastify` and
`use-query-params` (use `@ynput/ayon-addon`), `@ynput/ayon-addon/host`, and a manifest importing
`@ynput/ayon-addon` instead of `@ynput/ayon-addon/manifest`.
