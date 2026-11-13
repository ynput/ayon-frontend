<!-- Generated from src/slots.ts by scripts/generate-docs.mjs. Edit those, not this file. -->
# @ynput/ayon-addon 0.6.0

The API for AYON addon frontends. An addon declares what it puts into AYON's **slots** (places in the
web UI) in one manifest module; AYON reads the descriptions at startup and loads each piece of code
when its slot needs it. Everything here is AYON's own copy at runtime.

## Rules

- List `@ynput/ayon-addon` in the federation `shared` with `import: false` (`ayonAddon()` from
  `@ynput/ayon-addon-dev` does it). The addon then never bundles a copy.
- The manifest (`src/manifest.ts`, exposed as `./manifest`, listed as `manifest` in the server's
  `frontend_modules`) imports from `@ynput/ayon-addon/manifest` only:
  `export default defineAddon({ contributes: [projectPage({ ... }), ...] })`.
- Pieces are dynamic imports of local files: `component: () => import('./Page')`. Never import a
  component statically in the manifest.
- Ids: a letter, then letters, digits and `_`; unique within their slot. Contributions to slots this
  AYON doesn't have are skipped with a console warning; the rest of the addon works.
- A component gets its slot's context as props (`SlotProps<'<slot>'>`); components below it call
  `useSlot('<slot>')` (or a list of slots). It throws when rendered in another slot.
- Menu items have a `run` piece: a function that gets the context (`SlotContext<'<slot>'>`) on click.
- Header and toolbar items set exactly one action: `to` (navigate), `run`, `dialog` (AYON opens
  its dialog around your content, which gets `close`), `menu` (a function returning the items),
  `popover` (AYON opens a popover under the button with your content, which gets `close`) or
  `component` (your own JSX instead of AYON's button). Their code gets `navigate` in the context.
- A popover is AYON's: it positions it and closes it on a click outside or Escape. Don't build your
  own overlay. Menus and dialogs opened from inside it close on their own Escape or outside click
  without closing the popover. A button that needs its own look (a badge, a live value) sets
  `component` **and** `popover`: the component is the button and gets `popoverOpen` and
  `togglePopover` (its `onClick`), typed `SlotProps<'header.item'> & PopoverButtonScope`.
- Code with no UI that runs while AYON is open (a timer's state, websocket listeners, a store
  listener) is an `appService`: a component that returns `null`, mounted once for the whole app
  under AYON's providers, so hooks work. Clean up in its effects.
- Globals are imports, never context: `useUser`, `useNavigate` and the other router hooks, `Link`,
  `toast`, the layout components (`ProjectPageLayout`, `Slicer`, `StudioPageLayout`,
  `ProjectList`), `MoreMenu` and `useContextMenu` (below). Data comes from
  `@ynput/ayon-frontend-shared/api` (AYON's api and cache): components use its hooks, `run` and `menu` pieces
  `dispatch(api.endpoints.x.initiate(args))` with `dispatch` from this package (AYON's store).
  Menu items (their context has no `navigate`, unlike buttons) open another AYON page with
  `navigate(to)` from this package; it is the same as a button's `context.navigate`.
- URL query params: `useQueryParam` / `useQueryParams` and the params (`StringParam`,
  `withDefault`, ...) from this package. They read the `QueryParamProvider` AYON renders around
  every slot: no provider or router adapter in the addon. A change replaces only that param in the
  URL (`replaceIn`) unless the call passes another update type.

  ```tsx
  import { StringParam, useQueryParam, withDefault } from '@ynput/ayon-addon'
  const [mode, setMode] = useQueryParam('mode', withDefault(StringParam, 'list'))
  ```
- Links to an entity come from `entityUrl(entity, { activity? })`, never a hand-built URL: the page
  that opens it with its details panel (folders and tasks on Overview; products, versions and
  representations on Products), `undefined` for types without a page (e.g. `workfile`).
  `navigateToEntity(entity)` goes there without reloading, also from `run` pieces; it returns
  `false` for those types. Any `EntityRef` from a context works, the id is enough:

  ```tsx
  import { entityUrl, Link, navigateToEntity } from '@ynput/ayon-addon'
  <Link to={entityUrl(entity) ?? ''}>{entity.label}</Link>
  navigateToEntity({ projectName, entityType: 'task', id: log.taskId })
  ```
- To show an entity without leaving the page, `openDetails(entities)` opens AYON's details panel
  and `openViewer(target)` its viewer (the player), also from `run` pieces. Both return
  `false` when they can't. The panel shows next to a `project.page` that sets
  `detailsPanel: true`, for entities of that page's project; on any other page `openDetails`
  falls back to `navigateToEntity`. Call it again to follow a selection, `closeDetails()` closes
  it. Import neither panel nor viewer from `@ynput/ayon-frontend-shared`:

  ```tsx
  import { openDetails, openViewer } from '@ynput/ayon-addon'
  openDetails(selected) // EntityRef[] of one type: folders, tasks, versions or representations
  openViewer({ projectName, versionIds: [version.id], productId: version.productId })
  ```
- Endpoints you inject and tag types you add (`enhanceEndpoints({ addTagTypes })`) go into AYON's
  one api, where names are global: prefix them with your addon name (`myaddonGetLogs`,
  `myaddonLog`). A `tableColumn` lists the tags its values depend on in `providesTags`
  (yours or AYON's, such as `task`) and refreshes when one is invalidated.
- A crash stays inside the contribution: AYON wraps each one in an error boundary (menu items: a toast).

## Table column ids

A `tableColumn` contribution shows up in the project tables as `addon__<addon>__<id>`: the addon's
name (anything but letters and digits becomes `_`), then the contribution's id. Columns are hidden
until the user adds them in Customize. Build the id with `addonColumnId(addon, id)` (`ADDON_COLUMN_PREFIX`
is the `addon__` part) in tests and saved views; do not write it out by hand.

## What a project table shows: `tableState`

`tableState` is the table's filter as AYON queries it: the filter bar, every slicer panel, the
search, the folders and the grouping. Use it to act on everything the table shows, not only the
selection ("chart this", "export filtered"). The identity changes only when one of those changes.
It is never in `tableColumn`, whose values would refetch on every filter change.

- `filters`: one server `QueryFilter` per entity (`folder`, `task`, `product`, `version`,
  `representation`), each applying to that entity. The filters are ANDed together. Keys have no
  scope prefix and are the entity's own fields: `status`, `tags`, `name`, `createdAt`,
  `updatedAt`, `attrib.<name>`, and per entity `taskType` and `assignees` (task),
  `folderType` (folder), `productType` and `productBaseType` (product), `author` and
  `version` (version). Relative dates are resolved. An entity without conditions is left out. To
  filter tasks by their folder, prefix the folder keys (`folder.status`).
- `search`: Overview's name search for tasks, comma-separated terms ORed. Products has none.
- `folderIds`: the folders the rows are in, with all descendants. This can be thousands of ids;
  send them as `folder.id in [...]` / `folderIds`, not one request each. `undefined`: the whole
  project.
- `ids`: the entities picked in a lists slicer panel, already inside `folderIds`. Only those rows show.
- `groupBy`: `{ id, desc }`, the field the rows are grouped by (`status`, `taskType`,
  `assignees`, `attrib.<name>`, ...). `undefined` when not grouped.

| | Overview | Products |
| --- | --- | --- |
| `entityType` | `task` | `version` |
| `filters` | `task`, `folder` | `version`, `product`, `task`, `folder`, `representation` (file extension as a `path` condition) |
| `search` | task names | not set |
| `ids` | `task` | `task`, `product`, `version` |
| `showHierarchy` | the folder tree | products with their versions |
| `groupBy` | task fields; `folderType` groups folders | version fields |
| `queryArgs` | not set | `version`: `featuredOnly`, `latestPerFolder`, `hasReviewables` |

`queryArgs` are filters a query takes as arguments, not conditions, per entity like `filters`.
`queryArgs.version` is named like GraphQL `versions` arguments. Send `featuredOnlyEntityType: 'product'` with `featuredOnly`.

## A column's menu: `projectTable.columnMenuItem`

An item in the column header's more menu, after "Group by", for acting on one column: "Chart
tasks by {column}". `{column}` in `label` and `dialogTitle` becomes the column's name. The
context has `columnId` (`status`, `subType`, `assignees`, `attrib_priority`), `columnLabel`,
`groupField` and `tableState`. `groupField` is what "Group by" on that column groups by, the
same key as `tableState.groupBy.id` (`status`, `taskType`, `attrib.priority`), and
`undefined` when the table can't group by the column. Narrow where it shows in the description,
so no code loads to decide: `pages`, `columns` (ids, `attrib_*` for every attribute) and
`groupable: true` (only columns with a `groupField`). Columns whose header has no plain name
(link columns) get no addon items unless they are groupable.

```ts
projectTableColumnMenuItem({
  id: 'chartTasks',
  label: 'Chart tasks by {column}',
  icon: 'bar_chart',
  pages: ['overview'],
  groupable: true,
  dialogHeader: false,
  dialogSize: 'lg',
  dialog: () => import('./ChartDialog'),
})
```

## Dialogs without AYON's header: `dialogHeader: false`

A `dialog` piece (`header.item`, `projectTable.toolbarItem`, `projectTable.columnMenuItem`,
`table.shortcut`) sits in AYON's dialog with a header: the title and a close button. With
`dialogHeader: false` AYON draws no header and the piece draws its own toolbar, which must
have a close button calling `close`. Escape and a click outside still close it.

## Common errors

Look in the browser console first: every message starts with `[addon <name>]`.

| You see | Cause |
|---|---|
| nothing at all, the contribution is missing | The addon's server version with that frontend is not installed or enabled, or the manifest is not listed in the server's `frontend_modules`. With `?addonDev=`, see "Developing inside AYON" in `@ynput/ayon-addon-dev`'s `AGENTS.md` |
| `skipped contribution "x": this AYON version has no such slot` | The slot is newer than the AYON you run (`ayon-addon slots` lists the installed package's). The rest of the addon works |
| `...and no addon in the bundle declares it (it would be addon "y")` | The slot is addon `y`'s, and `y` isn't in the bundle or is too old to have it. The rest of the addon works |
| `skipped contribution "x" (slot): invalid id …` / `missing …` / `invalid <field> …` | The description breaks the slot's rules. `ayon-addon check` prints the same reasons without AYON |
| `… must be a loader: () => import('./File')` | A piece is a component or a static import. Pieces are dynamic imports of local files |
| `duplicate id in slot "…"` | Ids are unique within a slot, across the whole addon |
| `page "x" (project.page) is not shown: …` | The page id or `viewType` is one AYON, a legacy page or an earlier addon page already uses |
| `useSlot(…) was called in a component rendered in slot '…'` or `… outside any addon slot` | The component is used in a slot you did not name: `useSlot(['a', 'b'])` names every slot it is used in. Outside a slot it has no context at all |
| `the file has no default export` / `"run" has no default export function` | A piece's file must `export default` its component or function |
| `x (addon): <message>` toast, and `[addon <name>] … failed` in the console | A `run`, `menu` or dialog piece threw. `… crashed` is a component that threw while rendering: it stays inside its own area |
| `<name> is not available in this AYON frontend` | A layout component or picker this AYON version does not provide; update AYON or the SDK |

## A table of entities: `EntityTable`

AYON's project table as on Overview (columns, sorting, grouping, summaries row, loading on scroll)
for the rows you give it, read-only. It loads the project's data itself: render it anywhere (a
project page, a studio page, a dialog for another project). Give its parent a height.

```tsx
import { EntityTable, type EntityTableSettings } from '@ynput/ayon-addon'

const [settings, setSettings] = useState<EntityTableSettings>({})
<EntityTable
  projectName={projectName}
  entityType="task"
  filter={{ conditions: [{ key: 'status', operator: 'in', value: ['In progress'] }] }}
  settings={settings}
  onSettingsChange={setSettings}
/>
```

- `entityType`: `task` (the task list) or `folder` (folders, each expandable to its tasks).
- Rows: `filter` in the Overview filter bar's format (a key without a prefix is about tasks,
  `folder_<key>` about folders), `ids` of `entityType`, or both (rows match both). `ids={[]}`
  shows no rows. Task and folder conditions are always joined by `and`: keep an `or` within one
  of them. Every table request carries the ids, so keep them to a few thousand.
- `settings` is what the user changes (columns, sorting, grouping, row height), the same keys as
  AYON's saved views. Controlled when set; store it where you like (e.g. your page's view).
- `excludedColumns`: column ids the table never shows and the user can't add.
- Read-only: the right-click menu offers Open in overview, copy, the viewer, expand and export. A
  single group opens expanded.

## Picking entities: `EntityPicker`

AYON's entity picker (the dialog AYON uses to link, move or pick a folder, task, product, version,
...) from one component. It loads the project and its folders itself: render it anywhere (a header
item, a popover, a studio page, a details panel tab) with no providers around it.

```tsx
import { EntityPicker, type EntityRef } from '@ynput/ayon-addon'

{picking && (
  <EntityPicker
    projectName={projectName}
    entityType="task"
    initialSelection={task ? [task] : undefined}
    onClose={() => setPicking(false)}
    onSubmit={([picked]: EntityRef[]) => {
      setPicking(false)
      setTask(picked) // { id, entityType: 'task', projectName, name, label }
    }}
  />
)}
```

- `entityType`: `folder`, `task`, `product`, `version`, `representation` or `workfile`. The
  picker shows the types above it to narrow the list (folders, then tasks for `task`).
- `onSubmit` gets `EntityRef[]`, the same shape slot contexts use (`name` and `label` when the
  picker loaded them). One entity unless `multiSelect`. The picker stays open until you stop
  rendering it: close it in `onSubmit` and `onClose`.
- `initialSelection`: `EntityRef`s (or `{ id, entityType }`) selected when it opens, of
  `entityType` or a type above it (a folder opens the tree at it). A slot's `entities` fit as they are.
  An entity on a page the picker hasn't loaded yet stays selected until it loads, or until no page is
  left to load it.
- One fixed project: put your own project field next to it if the user picks the project.

## A "more" menu: `MoreMenu`

An addon's own menu (a panel's "…" actions, a row's options) is AYON's menu under a button, from
one component. Don't build one: `MoreMenu` looks and works like AYON's menus everywhere (pages,
details panel tabs, popovers, dialogs, the dev shell).

```tsx
import { MoreMenu } from '@ynput/ayon-addon'

<MoreMenu
  data-testid="tracker-more"
  items={[
    { id: 'add', label: 'Add time manually', icon: 'more_time', onClick: () => setAdding(true) },
    { id: 'export', label: 'Export', icon: 'download', items: [
      { id: 'csv', label: 'CSV', onClick: exportCsv },
    ] },
    { divider: true },
    { id: 'delete', label: 'Delete', icon: 'delete', danger: true, disabled: !selected, onClick: remove },
  ]}
/>
```

- Items are the `AddonMenuItem`s a `menu` piece returns: `onClick`, `to` (an AYON URL), `href`
  (a new tab), `items` (a submenu), `{ divider: true }`, `disabled`, `selected`, `danger`. A
  failing `onClick` (also a rejected promise) is shown as a toast naming the addon.
- The button: `icon` (`more_horiz` when not set), `label` (next to the icon), `tooltip` (the label,
  or `More`, when not set; also the accessible name), `variant` (`text` by default, as AYON's
  `Button`), `align` (the menu's edge on the button's: `right` by default), `disabled`,
  `className`, `data-testid`.
- Escape and a click outside close only the menu: the popover or dialog it is in stays open, and
  Escape puts the focus back on the button. Keys as in AYON's menus: Tab moves through the items,
  Enter picks one or opens its submenu, Escape closes the submenu first.
- In tests the items are `listitem`s (`getByRole('listitem', { name: 'Delete' })`), not `menuitem`s.

## Slots of other addons

An addon can declare its own slots, and other addons contribute to them the way they contribute to
AYON's. Module federation doesn't change: every addon is still its own remote, and nothing of the
declaring addon's code reaches the contributor. The examples use an addon named `example` with a
menu of cards.

**Declaring.** List the slots in the manifest, and render them with `SlotOutlet` (components) or
`useSlotMenuItems` (menu items) from this package:

```ts
// src/manifest.ts of the addon "example"
export default defineAddon({ slots, contributes: [...] }) // slots: from its contract package's slots.js
```

```ts
const buildSlotItems = useSlotMenuItems('example.cardMenuItem')
// when the menu opens: a broken item is a toast, never a broken menu
const { top, bottom } = buildSlotItems({ projectName, cards })
// an entry runs with `command`; useContextMenu and MoreMenu items take `onClick`
const items = [...top, ...bottom].map(({ command, ...item }) => ({ ...item, onClick: command }))
```

When a contribution can narrow where it shows, give the slot a description field for it and pass
the second argument, which leaves out what doesn't apply (here `cardTypes`, all when not set).
Different things get different slots, kinds of one thing get a field:

```ts
buildSlotItems({ projectName, cards }, ({ cardTypes }) => !cardTypes || cards.every((c) => cardTypes.includes(c.cardType)))
```

`<SlotOutlet slot context />` renders no element of its own: each contribution's component is a
direct child of the element around it, in manifest order, with nothing (or `loading`) while it loads.
Lay them out with that element (a flex row in a header, a column in a panel). A contribution that
fails shows an error box sized for a panel; in an inline place (a badge, a header button) pass
`error={() => null}` to render nothing instead, or your own small fallback.

A declaration has `name`, `version`, `required`, `pieces` and optionally `optionalPieces`,
`optional`, `check` and `description`: what AYON checks for its own slots. It may also have a
`label`, a short title for people (`'Card menu item'`, a non-empty string): the dev shell lists the
slot by it, else by the name after the dot in words. And an `example`: a contribution of the slot's
shape without `id` (`{ label: 'Example card action', icon: 'extension' }`), which AYON's developer
mode shows in the slot with Show slots on, owned by the declaring addon and after the real
contributions. It is filled in where it leaves something out: each required field gets the slot's
label (`icon` an icon), `run` says it was used, any other piece shows the label in one line,
with the slot and its context in its tooltip (`ExampleInline`). A piece of its own is a dynamic import in the contract package, which may render
`ExampleView` from `@ynput/ayon-addon` inside its own markup (a badge's size, a button's look).
An example's `run` is always AYON's, which only says it was used, even when the example sets its
own, so using an example changes nothing; its components are the contract package's code, so keep
them to display only.

**Ownership.** The name is `<addon>.<name>`: the addon's name from `package.py`, a dot, then a letter
followed by letters, digits and `_` (no more dots). Only that addon can declare it. A declaration with
another addon's name, a name AYON already has, or a name already declared is skipped with a console
warning naming the addons. Names under the first parts of AYON's slots (`project.`, `studio.`,
`header.`, ...) are AYON's: an addon with one of those names can't declare slots.

**Contract package.** The types and declarations reach contributors through a small npm package,
`@ynput/ayon-addon-<addon>`, with no code of the addon in it. It lists `@ynput/ayon-addon` as a
`peerDependency`, never a dependency: a nested copy would get the `SlotMap` augmentation instead of the
contributor's.

- the declarations as data, in a plain JS module that imports without React, marked in its
  `package.json`: `"ayonAddon": { "slots": "./slots.js" }`. The module exports `slots`:

  ```js
  // slots.js
  export const slots = [
    {
      name: 'example.cardMenuItem',
      version: 1,
      label: 'Card menu item',
      description: 'an entry in the right-click menu of a card',
      required: ['label', 'icon'],
      pieces: ['run'],
      optional: { position: /^(top|bottom)$/ },
    },
  ]
  ```

- the types: `declare module '@ynput/ayon-addon' { interface SlotMap { 'example.cardMenuItem': { meta, context, pieces } } }`.
  `SlotName`, `SlotProps`, `useSlot` and `contribute` then cover the slots of the contract packages an
  addon has installed, in `@ynput/ayon-addon` and `@ynput/ayon-addon/manifest` alike. Every
  contribution has an `id`, so `meta` only lists the slot's own fields.
- one helper per slot, which stamps `slotVersion` from the declaration in `slots.js`, so the version
  is written once. Keep the helper in the contract package: the contributor's manifest bundles it,
  and it works with any AYON that has addon slots.

  ```ts
  // index.ts
  import type { SlotName } from '@ynput/ayon-addon'
  import type { ContributionFields, ContributionInput } from '@ynput/ayon-addon/manifest'
  import { slots } from './slots.js'

  const slotHelper = <S extends SlotName>(slot: S) => {
    const { version } = slots.find((declaration) => declaration.name === slot)!
    return (fields: ContributionFields<S>) => ({ ...fields, slot, slotVersion: version }) as ContributionInput<S>
  }
  export const exampleCardMenuItem = slotHelper('example.cardMenuItem')
  ```
- optionally, previews for the dev shell: `"ayonAddon": { "previews": "./previews.js" }`, scenes
  that render the slots with the SDK as the addon does, with a form for their context. See "Other
  addons' slots: preview scenes" in
  `@ynput/ayon-addon-dev`'s `AGENTS.md`.

**Contributing.** Install the contract package and use its helper in the manifest:
`exampleCardMenuItem({ id, label, icon, run: () => import('./openCard') })`. AYON registers each
manifest as it arrives and works out declarations and contributions again from all of them, so the
order they load in doesn't matter: a contribution appears once its slot's addon has loaded. When all
manifests are in and no addon in the bundle declares the slot (the addon isn't installed, or is older),
the contribution is skipped with a console warning and the rest of the addon works.

**Versioning.** The declaration has `version`, and a contribution the `slotVersion` it was built
against (the contract package's helper stamps it; one without counts as version 1). A contribution
for any other version is skipped with a warning naming the addon to update. Additive context fields
are a minor release of the contract package; a breaking change is a new slot version. To keep older
contributions working through a transition, declare the new shape under a new slot name and keep the
old slot for a while.

**Supporting older AYON.** AYON provides `@ynput/ayon-addon` at run time, so on an AYON from before
addon slots the declaring addon gets a package without `SlotOutlet` and `useSlotMenuItems` (the
contributors are fine: AYON skips their unknown slots). Read both through a namespace import and fall
back once, when the module loads, so a component calls the same hooks on every render:

```ts
import * as ayonAddon from '@ynput/ayon-addon'
import type { SlotMenuItems } from '@ynput/ayon-addon'

const noItems = (): SlotMenuItems => ({ top: [], bottom: [] })
// without addon slots: render nothing, and menus get no items
export const SlotOutlet = ayonAddon.SlotOutlet ?? (() => null)
export const useSlotMenuItems = ayonAddon.useSlotMenuItems ?? (() => noItems)
```

## A right-click menu: `useContextMenu`

AYON's right-click menu with the same items as `MoreMenu`. Don't import AYON's own context menu
from `@ynput/ayon-frontend-shared`: its items have another shape and it needs AYON's provider.

```tsx
import { useContextMenu } from '@ynput/ayon-addon'

const openContextMenu = useContextMenu()

<tr
  onContextMenu={(event) =>
    openContextMenu(event, [
      { id: 'edit', label: 'Edit', icon: 'edit', onClick: () => edit(log) },
      { divider: true },
      { id: 'delete', label: 'Delete', icon: 'delete', danger: true, disabled: log.locked, onClick: () => askDelete(log) },
    ])
  }
/>
```

- The opener takes the mouse event and the items, built when the menu opens. It stops the browser's
  own menu. Items as in `MoreMenu`; `selected` has no look in this menu.
- To ask before a destructive item, open your own confirmation (AYON's `Dialog` from
  `@ynput/ayon-react-components`) from its `onClick`. The `confirmDelete` of
  `@ynput/ayon-frontend-shared` needs a dialog AYON doesn't render for addons.

## Slot contexts: one shape

The same thing has the same name and type in every slot that has it:

- **`user`** (`AddonUser`), in every slot: the signed-in user, `name`, `fullName`, `email` and
  the flags `isAdmin` (service users too), `isManager` (admins too), `isGuest`, `isService`,
  `isDeveloper` (developer mode). `run` and `menu` pieces get it like components; `useUser()`
  is the same user for code below them.
- **`projectName`** (`string`), in slots about one project. Where there may be none it is
  `string | null`: `header.item` (no project page open) and `table.shortcut` (the project list).
  `project.page` also has `project` (`ProjectInfo`, `undefined` while it loads); elsewhere get
  the project from AYON's api (`useGetProjectQuery({ projectName })`, cached).
- **`entities`** (`EntityRef[]`: `id`, `entityType`, `projectName`, `name?`, `label?`), in
  slots about entities: `detailsPanel.tab`, `detailsPanel.menuItem` (both also `entityType`, all of
  one type), `entityMenuItem`, `table.shortcut` (the project tables' rows; empty in the panels'
  tables) and `slicer.menuItem` (hierarchy rows; empty for other slice types). A table cell is one
  entity: `tableColumn` has `entity`.
- **`users`** (`UserRef[]`: `name`, `fullName?`, `email?`, `active` and the flags of
  `user` without `isDeveloper`), in slots about other users: `userDetails.section` and
  `userDetails.menuItem` (the users selected in Settings → Users). Not the signed-in user: that is
  `user`.
- **`tableState`** (`ProjectTableState`), in `projectTable.toolbarItem`,
  `projectTable.columnMenuItem`, `entityMenuItem` and `table.shortcut`: what the project table shows. Set on Overview and Products; `undefined` on
  Lists, in the panels' tables and on older hosts. See "What a project table shows".

## Slots

### `project.page`: `projectPage`

A tab on the project page, at `/projects/<project>/<id>`. The tab shows from the description; `component` loads when the page is first opened. Loads: first shown.

| Description field | Type | |
|---|---|---|
| `detailsPanel` | `boolean \| undefined` | Shows AYON's details panel next to the page, for the page to open with `openDetails`. The page is in a splitter while the panel is there; it only shows when the page opens it. |
| `id` (required) | `string` | The page's URL segment and tab id: `/projects/<project>/<id>`, `/dashboard/<id>`. A built-in page with the same id wins. |
| `title` (required) | `string` | the tab label |
| `access` | `Access \| undefined` | `manager` or `admin`: the tab is hidden from everyone else, and its URL redirects them |
| `viewType` | `string \| undefined` | Gives the page views: the host shows the views menu and the page gets `views` in its context. The type its views are saved under, e.g. `budget`: letters, digits, `_`, `-` and `.`. It must be the page's own: one AYON or another page already uses is not shown. |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'project.page'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `project` (required) | `ProjectInfo \| undefined` | the project; `undefined` while it loads |
| `projectName` (required) | `string` |  |
| `slicer` (required) | `SlicerSelection` | empty until the user selects something in a `<Slicer>` the page places |
| `projectFolders` (required) | `ProjectFolders` | every folder of the project, with lookups for parents and children |
| `views` (required) | `PageViews \| undefined` | `undefined` when the page's description has no `viewType` |

Pieces: `component`.

Example (what developer mode's Show slots renders here):

```ts
projectPage({
  id: 'example',
  title: 'Example page',
  component: () => import('./Component'),
})
```

### `studio.page`: `studioPage`

A tab on the dashboard (studio level), at `/dashboard/<id>`. The tab shows from the description; `component` loads when the page is first opened. Loads: first shown.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | The page's URL segment and tab id: `/projects/<project>/<id>`, `/dashboard/<id>`. A built-in page with the same id wins. |
| `title` (required) | `string` | the tab label |
| `access` | `Access \| undefined` | `manager` or `admin`: the tab is hidden from everyone else, and its URL redirects them |
| `viewType` | `string \| undefined` | Gives the page views: the host shows the views menu and the page gets `views` in its context. The type its views are saved under, e.g. `budget`: letters, digits, `_`, `-` and `.`. It must be the page's own: one AYON or another page already uses is not shown. |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'studio.page'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `selectedProjects` (required) | `string[]` | projects selected in the page's `<ProjectList>`; saved per page |
| `views` (required) | `PageViews \| undefined` | `undefined` when the page's description has no `viewType` |

Pieces: `component`.

Example (what developer mode's Show slots renders here):

```ts
studioPage({
  id: 'example',
  title: 'Example page',
  component: () => import('./Component'),
})
```

### `header.item`: `headerItem`

A button in the main header, drawn by the host like its own buttons. What a click does is the addon's: navigate (`to`), run code (`run`), open a dialog (`dialog`), a menu (`menu`) or a popover (`popover`); or the addon draws the item itself (`component`, loaded with the header). Set exactly one, except that `component` may draw the button of a `popover`. Loads: first click (component: with the page).

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's header items |
| `label` (required) | `string` | shown next to the icon on the left, as the tooltip on the right |
| `placement` (required) | `"left" \| "right"` | `left`: after the Home button; `right`: before chat and the inbox |
| `order` | `number \| undefined` | order among addon items on the same side, lowest first |
| `icon` | `string \| undefined` | a Material Symbols icon name; required unless the item is a `component` |
| `tooltip` | `string \| undefined` | shown on hover; the label when not set |
| `to` | `string \| undefined` | navigates there on click, e.g. `/dashboard/comments` (exactly one action: see the slot) |
| `dialogTitle` | `string \| undefined` | the `dialog`'s title; the label when not set |
| `dialogSize` | `"sm" \| "md" \| "lg" \| "full" \| undefined` | the `dialog`'s size, `md` by default |
| `dialogHeader` | `boolean \| undefined` | `false`: AYON draws no header (title and close button) around the `dialog`; the piece draws its own, with a close button calling `close`. Escape and a click outside still close it |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'header.item'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `projectName` (required) | `string \| null` | the project whose page is open, else `null` |
| `navigate` (required) | `(to: string) => void` | goes to an AYON URL, e.g. `navigate('/dashboard/comments')` |

Pieces: `run` (optional), `dialog` (optional), `menu` (optional), `popover` (optional), `component` (optional).

Example (what developer mode's Show slots renders here):

```ts
headerItem({
  id: 'example',
  label: 'Example header item',
  icon: 'extension',
  placement: 'right',
  run: () => import('./Run'),
})
```

### `detailsPanel.tab`: `detailsPanelTab`

A tab in the details panel. The tab button shows from the description, for `entityTypes`; `component` loads when the tab is first opened. Loads: first shown.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | the tab id is `<addon>.<id>` |
| `label` (required) | `string` | the tab button's tooltip |
| `icon` (required) | `string` | a Material Symbols icon name, the tab button |
| `entityTypes` | `string[] \| undefined` | entity types the tab shows for; all when not set |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'detailsPanel.tab'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `scope` (required) | `string` | where the panel is open (`overview`, `dashboard`, `inbox`, ...); the panel opens in many places |
| `projectName` (required) | `string` |  |
| `entityType` (required) | `string` | the type of every entity in `entities` |
| `entities` (required) | `EntityRef[]` | the entities the slot is about, e.g. the ones the details panel shows |

Pieces: `component`.

Example (what developer mode's Show slots renders here):

```ts
detailsPanelTab({
  id: 'example',
  label: 'Example tab',
  icon: 'extension',
  component: () => import('./Component'),
})
```

### `detailsPanel.menuItem`: `detailsPanelMenuItem`

An item in the details panel's "more" menu. It shows from the description; `run` loads when the menu opens and is called on click. Loads: menu open / click.

| Description field | Type | |
|---|---|---|
| `entityTypes` | `string[] \| undefined` | entity types the item shows for; all when not set |
| `pinned` | `boolean \| undefined` | shown as an icon button in the panel's header, next to the "more" button, instead of in its menu (the label is the tooltip); `position` and `order` then order the header buttons |
| `id` (required) | `string` | unique among the addon's items of the slot |
| `label` (required) | `string` | the menu entry |
| `icon` (required) | `string` | a Material Symbols icon name |
| `position` | `MenuItemPosition \| undefined` | `top`: first in the menu; `bottom` (default): after the menu's own items, above the destructive ones (Delete, Archive) |
| `order` | `number \| undefined` | order among addon items with the same position, lowest first |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'detailsPanel.menuItem'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `projectName` (required) | `string` |  |
| `entityType` (required) | `string` | the type of every entity in `entities` |
| `entities` (required) | `EntityRef[]` | the entities the slot is about, e.g. the ones the details panel shows |

Pieces: `run`.

Example (what developer mode's Show slots renders here):

```ts
detailsPanelMenuItem({
  id: 'example',
  label: 'Example menu item',
  icon: 'extension',
  run: () => import('./Run'),
})
```

### `projectList.menuItem`: `projectListMenuItem`

An item in the project list's menus (dashboard, project menu, studio pages' ProjectList): the right-click menu, the "more" dropdown, or both (`in`). It acts on the selected projects. Loads: menu open / click.

| Description field | Type | |
|---|---|---|
| `in` | `MenuKind[] \| undefined` | which menus show it: both when not set |
| `id` (required) | `string` | unique among the addon's items of the slot |
| `label` (required) | `string` | the menu entry |
| `icon` (required) | `string` | a Material Symbols icon name |
| `position` | `MenuItemPosition \| undefined` | `top`: first in the menu; `bottom` (default): after the menu's own items, above the destructive ones (Delete, Archive) |
| `order` | `number \| undefined` | order among addon items with the same position, lowest first |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'projectList.menuItem'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `projectNames` (required) | `string[]` | the selected projects (project folders left out) |
| `menu` (required) | `MenuKind` |  |

Pieces: `run`.

Example (what developer mode's Show slots renders here):

```ts
projectListMenuItem({
  id: 'example',
  label: 'Example menu item',
  icon: 'extension',
  run: () => import('./Run'),
})
```

### `slicer.menuItem`: `slicerMenuItem`

An item in the project page slicer's menus: the right-click menu, the panel's dropdown, or both (`in`), for the slice types it lists. Loads: menu open / click.

| Description field | Type | |
|---|---|---|
| `sliceTypes` | `string[] \| undefined` | slice types it shows for (`hierarchy`, `assignees`, `status`, ...); all when not set |
| `in` | `MenuKind[] \| undefined` | which menus show it: both when not set |
| `id` (required) | `string` | unique among the addon's items of the slot |
| `label` (required) | `string` | the menu entry |
| `icon` (required) | `string` | a Material Symbols icon name |
| `position` | `MenuItemPosition \| undefined` | `top`: first in the menu; `bottom` (default): after the menu's own items, above the destructive ones (Delete, Archive) |
| `order` | `number \| undefined` | order among addon items with the same position, lowest first |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'slicer.menuItem'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `sliceType` (required) | `string` |  |
| `selected` (required) | `SlicerRowRef[]` | the rows it acts on: the selected ones, or the right-clicked one |
| `entities` (required) | `EntityRef[]` | `hierarchy`: the folders and tasks of `selected`; empty for the other slice types |
| `menu` (required) | `MenuKind` |  |
| `projectName` (required) | `string` |  |

Pieces: `run`.

Example (what developer mode's Show slots renders here):

```ts
slicerMenuItem({
  id: 'example',
  label: 'Example menu item',
  icon: 'extension',
  run: () => import('./Run'),
})
```

### `entityMenuItem`: `entityMenuItem`

An item in the right-click menu of the project tables' cells, for the selected entities. It shows from the description; `run` loads when the menu opens and is called on click. Loads: menu open / click.

| Description field | Type | |
|---|---|---|
| `entityTypes` | `string[] \| undefined` | entity types it acts on: shown only when every selected entity is one of them. All when not set |
| `pages` | `ProjectTablePage[] \| undefined` | which tables offer it; all (Overview, Products, Lists) when not set |
| `selection` | `"single" \| "multi" \| undefined` | `single`: only for one selected entity; `multi` (default): for one or more |
| `id` (required) | `string` | unique among the addon's items of the slot |
| `label` (required) | `string` | the menu entry |
| `icon` (required) | `string` | a Material Symbols icon name |
| `position` | `MenuItemPosition \| undefined` | `top`: first in the menu; `bottom` (default): after the menu's own items, above the destructive ones (Delete, Archive) |
| `order` | `number \| undefined` | order among addon items with the same position, lowest first |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'entityMenuItem'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `page` (required) | `ProjectTablePage` |  |
| `entities` (required) | `EntityRef[]` | the selected entities (not table rows: list items resolve to their entity) |
| `projectName` (required) | `string` |  |
| `tableState` | `ProjectTableState \| undefined` | Overview and Products; `undefined` on the Lists page, in the panels' tables and on older hosts |

Pieces: `run`.

Example (what developer mode's Show slots renders here):

```ts
entityMenuItem({
  id: 'example',
  label: 'Example menu item',
  icon: 'extension',
  run: () => import('./Run'),
})
```

### `projectTable.toolbarItem`: `projectTableToolbarItem`

A button in the project tables' toolbar, before Customize (Overview, Products, Lists), drawn by the host like the toolbar's own. What a click does is the addon's: navigate (`to`), run code (`run`), open a dialog (`dialog`), a menu (`menu`) or a popover (`popover`); or the addon draws the item itself (`component`, loaded with the toolbar). Set exactly one, except that `component` may draw the button of a `popover`. Loads: first click (component: with the page).

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's toolbar items |
| `label` | `string \| undefined` | shown next to the icon; an icon-only button when not set |
| `pages` | `ProjectTablePage[] \| undefined` | which tables' toolbars show it; all (Overview, Products, Lists) when not set |
| `icon` | `string \| undefined` | a Material Symbols icon name; required unless the item is a `component` |
| `tooltip` | `string \| undefined` | shown on hover; the label when not set |
| `to` | `string \| undefined` | navigates there on click, e.g. `/dashboard/comments` (exactly one action: see the slot) |
| `dialogTitle` | `string \| undefined` | the `dialog`'s title; the label when not set |
| `dialogSize` | `"sm" \| "md" \| "lg" \| "full" \| undefined` | the `dialog`'s size, `md` by default |
| `dialogHeader` | `boolean \| undefined` | `false`: AYON draws no header (title and close button) around the `dialog`; the piece draws its own, with a close button calling `close`. Escape and a click outside still close it |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'projectTable.toolbarItem'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `page` (required) | `ProjectTablePage` |  |
| `list` | `{ id: string; label: string; entityType: string; } \| undefined` | on Lists: the open list |
| `projectName` (required) | `string` |  |
| `navigate` (required) | `(to: string) => void` | goes to an AYON URL, e.g. `navigate('/dashboard/comments')` |
| `tableState` | `ProjectTableState \| undefined` | Overview and Products; `undefined` on the Lists page, in the panels' tables and on older hosts |

Pieces: `run` (optional), `dialog` (optional), `menu` (optional), `popover` (optional), `component` (optional).

Example (what developer mode's Show slots renders here):

```ts
projectTableToolbarItem({
  id: 'example',
  label: 'Example',
  icon: 'extension',
  run: () => import('./Run'),
})
```

### `projectTable.columnMenuItem`: `projectTableColumnMenuItem`

An item in the "more" menu of a project table column's header (Overview, Products, Lists), after "Group by". It shows from the description; `{column}` in the label becomes the column's name (`Chart tasks by {column}`). Pressed, it runs code (`run`) or opens a dialog (`dialog`) with the column and what the table shows; set exactly one. Loads: menu open / click.

| Description field | Type | |
|---|---|---|
| `label` (required) | `string` | the menu entry; `{column}` becomes the column's name, e.g. `Chart tasks by {column}` |
| `pages` | `ProjectTablePage[] \| undefined` | which tables' columns offer it; all (Overview, Products, Lists) when not set |
| `columns` | `string[] \| undefined` | column ids it shows for, e.g. `status`, `subType`, `assignees`; a trailing `*` matches a prefix (`attrib_*`). All columns when not set |
| `groupable` | `boolean \| undefined` | only for columns the table can group by (`groupField` is set) |
| `dialogTitle` | `string \| undefined` | the `dialog`'s title, `{column}` as in `label`; the label when not set |
| `id` (required) | `string` | unique among the addon's items of the slot |
| `icon` (required) | `string` | a Material Symbols icon name |
| `order` | `number \| undefined` | order among addon items with the same position, lowest first |
| `dialogSize` | `"sm" \| "md" \| "lg" \| "full" \| undefined` | the `dialog`'s size, `md` by default |
| `dialogHeader` | `boolean \| undefined` | `false`: AYON draws no header (title and close button) around the `dialog`; the piece draws its own, with a close button calling `close`. Escape and a click outside still close it |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'projectTable.columnMenuItem'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `page` (required) | `ProjectTablePage` |  |
| `columnId` (required) | `string` | the column's id: `status`, `subType`, `assignees`, `attrib_priority`, ... |
| `columnLabel` (required) | `string` | the column's name as its header shows it |
| `groupField` | `string \| undefined` | the field the table groups by for this column, as `TableGroupBy.id` (`status`, `taskType`, `attrib.priority`); `undefined` when the table cannot group by it |
| `projectName` (required) | `string` |  |
| `tableState` | `ProjectTableState \| undefined` | Overview and Products; `undefined` on the Lists page, in the panels' tables and on older hosts |

Pieces: `run` (optional), `dialog` (optional).

Example (what developer mode's Show slots renders here):

```ts
projectTableColumnMenuItem({
  id: 'example',
  label: 'Example for {column}',
  icon: 'extension',
  run: () => import('./Run'),
})
```

### `projectTable.customizeSection`: `projectTableCustomizeSection`

A section in the project tables' Customize panel (Overview, Products, Lists). The entry shows from the description; `component` loads when the section is opened. Loads: first shown.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's sections |
| `title` (required) | `string` | the section's entry in Customize and its title when open |
| `icon` (required) | `string` | a Material Symbols icon name |
| `pages` | `ProjectTablePage[] \| undefined` | which tables' Customize panels show it; all (Overview, Products, Lists) when not set |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'projectTable.customizeSection'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `page` (required) | `ProjectTablePage` |  |
| `projectName` (required) | `string` |  |

Pieces: `component`.

Example (what developer mode's Show slots renders here):

```ts
projectTableCustomizeSection({
  id: 'example',
  title: 'Example section',
  icon: 'extension',
  component: () => import('./Component'),
})
```

### `tableColumn`: `tableColumn`

A read-only column in the project tables (Overview, Products, Lists). It is in the column settings from the description; `cell` and `fetchValues` load with the table. The host draws the cell box (padding, selection, focus), so `cell` renders only its content; selecting, the right-click menu and Copy (the cell's `value` as text) work as in other columns. Not sortable, and pasting into it changes nothing. When the values depend on data your mutations change, list its cache tags in `providesTags` and the column refreshes itself when they are invalidated: `tableColumn({ id, label, cell, fetchValues, providesTags: [{ type: 'myaddonLog', id: 'LIST' }] })`. Loads: with the page.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | part of the column id, so only letters, digits and `_` |
| `label` (required) | `string` | the column header and its name in the column settings |
| `icon` | `string \| undefined` |  |
| `entityTypes` | `string[] \| undefined` | entity types with a cell; other rows show an empty read-only cell. All when not set |
| `pages` | `ProjectTablePage[] \| undefined` | which tables offer it; all (Overview, Products, Lists) when not set |
| `width` | `number \| undefined` | width in pixels. Addon columns start hidden: users show them in Customize |
| `menu` | `string \| false \| undefined` | where the column sits in the "Add column" menu: a submenu named after the addon when not set, a submenu with this name (columns giving the same name share it, across addons too), or `false` for the menu's top level |
| `providesTags` | `TableColumnTag[] \| undefined` | cache tags of AYON's api that the values depend on: when one is invalidated (by your mutations or AYON's), the values are fetched again as with `refreshTableColumn`. Needs `fetchValues`. Names as you register them (`enhanceEndpoints({ addTagTypes })`, prefixed with your addon name) or AYON's own. A plain name follows invalidations of the whole type only: to follow `{ type, id }`, such as a list tag, give that tag |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'tableColumn'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `page` (required) | `ProjectTablePage` |  |
| `entity` (required) | `EntityRef` |  |
| `value` (required) | `unknown` | what the column's `fetchValues` returned for this entity; `undefined` without `fetchValues` |
| `projectName` (required) | `string` |  |

Pieces: `cell`, `fetchValues` (optional).

Example (what developer mode's Show slots renders here):

```ts
tableColumn({
  id: 'example',
  label: 'Example column',
  icon: 'extension',
  cell: () => import('./Cell'),
})
```

### `table.shortcut`: `tableShortcut`

A keyboard shortcut on the cells of AYON's tables: the project tables (Overview, Products, Lists) and the panels' tables (slicer, project list, lists, versions). Pressed in a cell, it runs code (`run`) or opens a dialog (`dialog`) with the selected rows; set exactly one. AYON's own keys (arrows, Enter, Escape, Tab, Space, `r`, Delete, copy, paste, undo) can't be taken, and the key does nothing while a cell is being edited. Loads: key press.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's shortcuts |
| `label` (required) | `string` | what it does, e.g. `Copy row as JSON`; the dialog's title when `dialogTitle` is not set |
| `keys` (required) | `string` | the key and its modifiers joined by `+`, lower case: `g`, `shift+mod+c`, `alt+1`, `f2`. `mod` is ⌘ on macOS and Ctrl elsewhere; `ctrl`, `meta`, `alt` and `shift` are the keys themselves. Letters and digits match the key's place on the keyboard, so `alt+g` works on macOS too |
| `tables` | `ShortcutTable[] \| undefined` | which tables it works in; all when not set. `overview`, `products`, `lists` (the project tables), `slicer`, `projects`, `listsPanel`, `versionsPanel` |
| `dialogTitle` | `string \| undefined` | the `dialog`'s title; the label when not set |
| `dialogSize` | `"sm" \| "md" \| "lg" \| "full" \| undefined` | the `dialog`'s size, `md` by default |
| `dialogHeader` | `boolean \| undefined` | `false`: AYON draws no header (title and close button) around the `dialog`; the piece draws its own, with a close button calling `close`. Escape and a click outside still close it |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'table.shortcut'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `table` (required) | `ShortcutTable` | the table the key was pressed in |
| `projectName` (required) | `string \| null` | the open project; `null` in the project list |
| `rows` (required) | `TableRowRef[]` | the rows it acts on: the selected ones when the key was pressed in one of them, else its row |
| `entities` (required) | `EntityRef[]` | the entities of `rows` in the project tables (list items resolve to their entity); empty in the panels' tables, whose rows are not all entities: read `rows` there |
| `focused` (required) | `{ rowId: string; columnId?: string \| undefined; }` | where the key was pressed: the row's id, and the column's in the project tables |
| `cells` (required) | `{ rowId: string; columnId: string; }[]` | project tables: the selected cells, by row (entity) and column id; empty elsewhere |
| `tableState` | `ProjectTableState \| undefined` | Overview and Products; `undefined` on the Lists page, in the panels' tables and on older hosts |

Pieces: `run` (optional), `dialog` (optional).

Example (what developer mode's Show slots renders here):

```ts
tableShortcut({
  id: 'example',
  label: 'Example shortcut',
  keys: 'alt+shift+e',
  run: () => import('./Run'),
})
```

### `userDetails.section`: `userDetailsSection`

A section in the user details panel (Settings → Users), below AYON's own forms, for the selected users. The section shows from the description, titled like AYON's; `component` loads when it is first shown. Saving is the section's own: AYON's Save button doesn't see it. Loads: first shown.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's sections |
| `title` (required) | `string` | the section's title, above its content |
| `order` | `number \| undefined` | order among addon sections, lowest first |
| `selection` | `UserSelection \| undefined` | `single`: only when one user is selected; `multi` (default): for one or more |
| `serviceUsers` | `boolean \| undefined` | also shown for service users, whose panel has no forms; `false` by default |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'userDetails.section'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `readOnly` (required) | `boolean` | the signed-in user can't change these users (a manager and an admin among them): show, don't edit |
| `users` (required) | `UserRef[]` | the users the slot is about, e.g. the ones selected in Settings → Users |

Pieces: `component`.

Example (what developer mode's Show slots renders here):

```ts
userDetailsSection({
  id: 'example',
  title: 'Example section',
  serviceUsers: true,
  component: () => import('./Component'),
})
```

### `userDetails.menuItem`: `userDetailsMenuItem`

An item in the user details panel's "more" menu (Settings → Users), for the selected users. It shows from the description; `run` loads when the menu opens and is called on click. Loads: menu open / click.

| Description field | Type | |
|---|---|---|
| `selection` | `UserSelection \| undefined` | `single`: only when one user is selected; `multi` (default): for one or more |
| `id` (required) | `string` | unique among the addon's items of the slot |
| `label` (required) | `string` | the menu entry |
| `icon` (required) | `string` | a Material Symbols icon name |
| `position` | `MenuItemPosition \| undefined` | `top`: first in the menu; `bottom` (default): after the menu's own items, above the destructive ones (Delete, Archive) |
| `order` | `number \| undefined` | order among addon items with the same position, lowest first |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'userDetails.menuItem'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `readOnly` (required) | `boolean` | the signed-in user can't change these users (a manager and an admin among them): show, don't edit |
| `users` (required) | `UserRef[]` | the users the slot is about, e.g. the ones selected in Settings → Users |

Pieces: `run`.

Example (what developer mode's Show slots renders here):

```ts
userDetailsMenuItem({
  id: 'example',
  label: 'Example menu item',
  icon: 'extension',
  run: () => import('./Run'),
})
```

### `profile.section`: `profileSection`

A section on the signed-in user's profile page (Account → Profile), next to AYON's profile form (below it on narrow screens). The section shows from the description, titled like AYON's; `component` loads when it is first shown. Saving is the section's own: AYON's "Save profile" button doesn't see it. Loads: first shown.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's sections |
| `title` (required) | `string` | the section's title, above its content |
| `order` | `number \| undefined` | order among addon sections, lowest first |
| `powerFeature` | `boolean \| undefined` | a Power Pack feature: shown only with a Power Pack licence. Without one, AYON shows its own preview of the feature where it has one. `false` by default |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'profile.section'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |

Pieces: `component`.

Example (what developer mode's Show slots renders here):

```ts
profileSection({
  id: 'example',
  title: 'Example section',
  component: () => import('./Component'),
})
```

### `app.service`: `appService`

Code with no UI that runs while AYON is open, whatever the page: keeping a state, listening to websocket events, registering a store listener. `component` loads at startup and is mounted once for the whole app, under AYON's providers (store, router, contexts), so it can use hooks; it renders nothing (`return null`). Clean up in its effects. A crash unmounts it and shows a toast; the rest of AYON keeps working. Loads: at startup.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's services |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'app.service'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `projectName` (required) | `string \| null` | the project whose page is open, else `null` |

Pieces: `component`.

Example (what developer mode's Show slots renders here):

```ts
appService({
  id: 'example',
  component: () => import('./Component'),
})
```
