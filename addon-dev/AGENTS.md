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
- **Developer panel** on the left, in two halves that scroll on their own. It sits in a splitter
  (drag its edge to resize it); the button at the left of the stage header or "," hides and shows
  it.
  - **Places**: where slots show. AYON's surfaces from a catalog in the shell
    (`shell/src/places.ts`), grouped by area: Studio (app header, studio pages, project list),
    Project (project pages, slicer, project tables, details panel), Settings (user details,
    account) and App (background). Then one place per preview scene of the contract packages,
    under the package (below), then **Other slots**: every known slot no place shows (an AYON
    slot missing from the catalog, a contract slot no scene renders, the addon's own slots). Each
    row says how many of its slots the addon uses ("2 of 6 used"). By default only places with a
    used slot are listed; **Show all** lists all of them. The search icon in the heading opens a
    search field (Esc, or leaving it empty, closes it). A search lists what it matches, used or
    not: places (name, package) and slots (label, name, the titles of the addon's
    contributions). A package's heading is its name for people (`@scope/ayon-addon-board` is
    "Board"), with the full name as the tooltip.
  - **Highlight** (Highlight slots), at the right of the Slots heading: marks every slot of the
    place on stage (below). It is the only thing that does; off, the stage looks as in AYON.
  - **Slots**: a read-only overview of the place's slots (label, with the name muted under it),
    and under each the addon's contributions with an icon, with the ones AYON would skip and why.
    Hovering a slot's row outlines it on stage, and hovering a highlighted slot on stage
    highlights its row. Nothing is selected: the place shows all its slots at once.
- **The stage** renders the selected place with all its slots: menus show all their items. The
  header above it has a fixed height and names the place; where the place comes from is behind
  (i). A warning shows only when the stage is not live (a `?preview=` fixture). A place without a
  preview (Other slots) shows "No preview available" and a manifest entry for the slot, built
  from its declaration only.
- AYON's pages that live in the app are replicas built from AYON's components: the project
  tables (Name and Status, then the addon's columns as real columns; header, grid, whole-row
  hover, a column header menu with the `projectTable.columnMenuItem` items, widths dragged at a
  header's right edge; sorting, grouping and hiding do nothing), User
  details (Settings > Users: the users, the details panel with its more menu) and Account (the
  profile page). They show a subset of AYON's fields and save nothing.
- **Context** (the preview inputs), under the stage in a second splitter (drag the edge between them;
  the button at the left of its header or "/" folds it to its header). *Input values*: a project switcher, the studio's
  project selection, an entity picker (AYON's) for the slots about entities, the table page, a
  scene's form. *Context received*: one collapsible section per slot of the place, with the
  context it passes (a menu's once it opened; click for all of it). *Saved examples*: the preview
  fixtures. "," and "/" do nothing while typing in a field.
- **Other addons' slots**: contributions to the slots of the addon's contract packages, in the
  preview scenes of the package (below).
- The place and the switches are in the URL: `?surface=<place>&showAll=1&highlight=1&ctxProject=…&ctxProjects=a,b&ctxEntities=task:<id>,…&ctxValues=<JSON>`.
  Going to another place adds a history entry (Back works); changing inputs replaces it. A
  scene's values are kept per place while the page is open: going back to it restores them. Old
  links are read as what they meant: `scene=<package>:<id>` becomes `surface=`, `showUnused=1`
  becomes `showAll=1`, `surface=profile` becomes `surface=account`, `?slot=…&contribution=…`
  without `surface` (`ayon-addon open`) opens the slot's first place, and `showSlots` is dropped.
  `slot` and `contribution` only tell `ayon-addon open | preview` which contribution to run or
  record; the page ignores them.
- Requests to `/api`, `/graphql`, `/ws` go through the dev server to the AYON server, with the API
  key when there is one (no login page); without a key the page shows AYON's login. The key is read
  for every request (the workbench's `data/local-api-key` changes when its stack is reset), and a
  request that is signed in already (you signed in on the page, or it sends its own key) goes
  without it: the server checks the key first, so it would override your sign-in.
- A token stored by an earlier sign-in that the server now rejects (its database was reset) is
  dropped before the shell starts, so the API key takes over instead of AYON's login page. Only
  that token is dropped: a sign-in in another tab meanwhile is kept.
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
- Record one from a live server: *Saved examples* in Context, or `ayon-addon open … --save-fixture
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
- Each scene is a place, listed under its package with the slots it renders (the declaration's
  `label`, else the name in words, with the slot's name under it and its `description` as the
  tooltip), and under each slot the addon's contributions to it. Selecting it puts the scene on
  stage, full width, with the shell's providers (right-click menus, the details panel, the user).
  A contract slot no scene renders is under Other slots.
- **Highlight slots** (the Slots heading's switch, in the URL as `highlight=1`): a slot on stage rendered with
  `SlotOutlet` and without contributions gets a small dashed "+ title" chip where they would go,
  and a menu slot without items gets one disabled "+ title" entry at the top of the menu (also a
  menu that would otherwise not open, such as a table cell's). What a used slot renders gets a
  light outline instead, and so do a menu's entries from a used slot. The button that opens a menu
  with a slot (a More button, a column's menu button) gets a thin solid outline, used or not.
  Hovering a slot's row outlines it strongly on stage, menu entries included, and the other way
  round. Menus are built when they open, so their entries carry their slot as data attributes and
  CSS matches them against the switch on the page's root. The scenes need nothing for it: the shell hands the SDK an internal hook that AYON never
  sets, so in AYON `SlotOutlet` and `useSlotMenuItems` render exactly the contributions.
- A scene's fields are a form under *Input values*, with *Reset* and the values as JSON. The values
  changed from the defaults are in the URL (`ctxValues`), so a reload or a shared link keeps them.
- `@ynput/ayon-addon` and `react` in a scene resolve to the contributing addon's copies, also when
  the contract package is linked from another checkout with its own `node_modules`: a second SDK
  would be a second registry, and the scene's slots would never see the contributions.
- Files that fail to load and invalid scenes are listed under *Loading problems* in Places; `ayon-addon
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
- A scene shows the layout around the slots, close enough to size and place a contribution: a
  plain JS mock that imports only React and the SDK, or a build of the addon's own components
  (Vite library mode, one file, with `react`, `react-dom`, `react/jsx-runtime`, `@ynput/ayon-addon`,
  `@ynput/ayon-react-components`, `styled-components` and `@ynput/ayon-frontend-shared` external).
  The shell gives those imports the contributing addon's copies, as AYON gives them to addons.
  AYON's CSS variables (`--md-sys-color-*`, `--base-gap-*`, `--padding-*`) are on the page; data
  colours (a status colour) can be literals.
- `ayon-addon check` in a contributing addon validates them: `previews` is a list, ids are unique,
  each scene has a label, slots of the package, well-formed fields and a function `component`. A
  contribution to a slot no scene renders is a note, not a failure. It runs `previews.js` in Node
  without rendering it: the SDK, AYON's components, `styled-components`, `react-dom` and packages
  that aren't installed or don't load in Node get stand-ins, so work at the top of the module
  (`styled.div` templates, contexts) runs, but don't compute the scenes' list from them.

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
