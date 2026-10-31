<!-- Generated from src/slots.ts by scripts/generate-docs.mjs. Edit those, not this file. -->
# @ynput/ayon-addon 0.1.1

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
  its dialog around your content, which gets `close`), `menu` (a function returning the items) or
  `component` (your own JSX instead of AYON's button). Their code gets `navigate` in the context.
- Globals are imports, never context: `useNavigate` and the other router hooks, `Link`,
  `toast`, the layout components (`ProjectPageLayout`, `Slicer`, `StudioPageLayout`,
  `ProjectList`), `MoreMenu` (below). Data comes from `@ynput/ayon-frontend-shared/api`
  (AYON's api and cache): components use its hooks, `run` and `menu` pieces
  `dispatch(api.endpoints.x.initiate(args))` with `dispatch` from this package (AYON's store).
- A crash stays inside the contribution: AYON wraps each one in an error boundary (menu items: a toast).

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

## Slots

### `project.page`: `projectPage`

A tab on the project page, at `/projects/<project>/<id>`. The tab shows from the description; `component` loads when the page is first opened. Loads: first shown.

| Description field | Type | |
|---|---|---|
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

### `header.item`: `headerItem`

A button in the main header, drawn by the host like its own buttons. What a click does is the addon's: navigate (`to`), run code (`run`), open a dialog (`dialog`) or a menu (`menu`); or the addon draws the item itself (`component`, loaded with the header). Set exactly one. Loads: first click (component: with the page).

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

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'header.item'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `projectName` (required) | `string \| null` | the project whose page is open, else `null` |
| `navigate` (required) | `(to: string) => void` | goes to an AYON URL, e.g. `navigate('/dashboard/comments')` |

Pieces: `run` (optional), `dialog` (optional), `menu` (optional), `component` (optional).

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

Pieces: `run`.

### `projectTable.toolbarItem`: `projectTableToolbarItem`

A button in the project tables' toolbar, before Customize (Overview, Products, Lists), drawn by the host like the toolbar's own. What a click does is the addon's: navigate (`to`), run code (`run`), open a dialog (`dialog`) or a menu (`menu`); or the addon draws the item itself (`component`, loaded with the toolbar). Set exactly one. Loads: first click (component: with the page).

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

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'projectTable.toolbarItem'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `page` (required) | `ProjectTablePage` |  |
| `list` | `{ id: string; label: string; entityType: string; } \| undefined` | on Lists: the open list |
| `projectName` (required) | `string` |  |
| `navigate` (required) | `(to: string) => void` | goes to an AYON URL, e.g. `navigate('/dashboard/comments')` |

Pieces: `run` (optional), `dialog` (optional), `menu` (optional), `component` (optional).

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

### `tableColumn`: `tableColumn`

A read-only column in the project tables (Overview, Products, Lists). It is in the column settings from the description; `cell` and `fetchValues` load with the table. The host draws the cell box (padding, selection, focus), so `cell` renders only its content; selecting, the right-click menu and Copy (the cell's `value` as text) work as in other columns. Not sortable, and pasting into it changes nothing. Loads: with the page.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | part of the column id, so only letters, digits and `_` |
| `label` (required) | `string` | the column header and its name in the column settings |
| `icon` | `string \| undefined` |  |
| `entityTypes` | `string[] \| undefined` | entity types with a cell; other rows show an empty read-only cell. All when not set |
| `pages` | `ProjectTablePage[] \| undefined` | which tables offer it; all (Overview, Products, Lists) when not set |
| `width` | `number \| undefined` | width in pixels. Addon columns start hidden: users show them in Customize |
| `menu` | `string \| false \| undefined` | where the column sits in the "Add column" menu: a submenu named after the addon when not set, a submenu with this name (columns giving the same name share it, across addons too), or `false` for the menu's top level |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'tableColumn'` | the slot this is rendered in |
| `user` (required) | `AddonUser` | the signed-in user |
| `page` (required) | `ProjectTablePage` |  |
| `entity` (required) | `EntityRef` |  |
| `value` (required) | `unknown` | what the column's `fetchValues` returned for this entity; `undefined` without `fetchValues` |
| `projectName` (required) | `string` |  |

Pieces: `cell`, `fetchValues` (optional).

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

Pieces: `run` (optional), `dialog` (optional).
