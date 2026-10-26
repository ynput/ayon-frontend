<!-- Generated from src/slots.ts by scripts/generate-docs.mjs. Edit those, not this file. -->
# @ynput/ayon-addon 0.1.0

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
- Globals are imports, never context: `useUser`, `useNavigate` and the other router hooks, `Link`,
  `toast`, the layout components (`ProjectPageLayout`, `Slicer`, `StudioPageLayout`,
  `ProjectList`). Data comes from `@ynput/ayon-frontend-shared/api` (AYON's api and cache).
- A crash stays inside the contribution: AYON wraps each one in an error boundary (menu items: a toast).

## Slots

### `project.page`: `projectPage`

A tab on the project page, at `/projects/<project>/<id>`. The tab shows from the description; `component` loads when the page is first opened. Loads: first shown.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | The page's URL segment and tab id: `/projects/<project>/<id>`, `/dashboard/<id>`. A built-in page with the same id wins. |
| `title` (required) | `string` | the tab label |
| `access` | `Access \| undefined` | `manager` or `admin`: the tab is hidden from everyone else, and its URL redirects them |
| `viewType` | `string \| undefined` | the view type its views are saved under, when the page uses views |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'project.page'` | the slot this is rendered in |
| `project` (required) | `ProjectInfo \| undefined` | the project; `undefined` while it loads |
| `projectName` (required) | `string` |  |
| `slicer` (required) | `SlicerSelection` | empty until the user selects something in a `<Slicer>` the page places |

Pieces: `component`.

### `studio.page`: `studioPage`

A tab on the dashboard (studio level), at `/dashboard/<id>`. The tab shows from the description; `component` loads when the page is first opened. Loads: first shown.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | The page's URL segment and tab id: `/projects/<project>/<id>`, `/dashboard/<id>`. A built-in page with the same id wins. |
| `title` (required) | `string` | the tab label |
| `access` | `Access \| undefined` | `manager` or `admin`: the tab is hidden from everyone else, and its URL redirects them |
| `viewType` | `string \| undefined` | the view type its views are saved under, when the page uses views |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'studio.page'` | the slot this is rendered in |
| `selectedProjects` (required) | `string[]` | projects selected in the page's `<ProjectList>`; saved per page |

Pieces: `component`.

### `header.item`: `headerItem`

A button in the main header. The host draws it from the description, like its own buttons; `component` (a dialog or popover) loads on the first click and gets `open` / `onClose`. Loads: first click.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's header items |
| `label` (required) | `string` | shown next to the icon on the left, as the tooltip on the right |
| `icon` (required) | `string` | a Material Symbols icon name |
| `tooltip` | `string \| undefined` | shown on hover; the label when not set |
| `placement` (required) | `"left" \| "right"` | `left`: after the Home button; `right`: before chat and the inbox |
| `order` | `number \| undefined` | order among addon items on the same side, lowest first |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'header.item'` | the slot this is rendered in |
| `projectName` (required) | `string \| null` | the project whose page is open, else `null` |
| `open` (required) | `boolean` |  |
| `onClose` (required) | `() => void` |  |
| `anchor` (required) | `HTMLElement \| null` | the button, to anchor a popover to |

Pieces: `component`.

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
| `scope` (required) | `string` | where the panel is open (`overview`, `dashboard`, `inbox`, ...); the panel opens in many places |
| `projectName` (required) | `string` |  |
| `entityType` (required) | `string` |  |
| `entities` (required) | `EntityRef[]` |  |

Pieces: `component`.

### `detailsPanel.menuItem`: `detailsPanelMenuItem`

An item in the details panel's "more" menu. It shows from the description; `run` loads when the menu opens and is called on click. Loads: menu open / click.

| Description field | Type | |
|---|---|---|
| `entityTypes` | `string[] \| undefined` | entity types the item shows for; all when not set |
| `id` (required) | `string` | unique among the addon's items of the slot |
| `label` (required) | `string` | the menu entry |
| `icon` (required) | `string` | a Material Symbols icon name |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'detailsPanel.menuItem'` | the slot this is rendered in |
| `entityType` (required) | `string` |  |
| `selectedEntities` (required) | `EntityRef[]` | the entities the panel shows |
| `projectName` (required) | `string` |  |

Pieces: `run`.

### `projectList.menuItem`: `projectListMenuItem`

An item in the project list's menus (dashboard, project menu, studio pages' ProjectList): the right-click menu, the "more" dropdown, or both (`in`). It acts on the selected projects. Loads: menu open / click.

| Description field | Type | |
|---|---|---|
| `in` | `MenuKind[] \| undefined` | which menus show it: both when not set |
| `id` (required) | `string` | unique among the addon's items of the slot |
| `label` (required) | `string` | the menu entry |
| `icon` (required) | `string` | a Material Symbols icon name |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'projectList.menuItem'` | the slot this is rendered in |
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

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'slicer.menuItem'` | the slot this is rendered in |
| `sliceType` (required) | `string` |  |
| `selected` (required) | `SlicerRowRef[]` | the rows it acts on: the selected ones, or the right-clicked one |
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

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'entityMenuItem'` | the slot this is rendered in |
| `page` (required) | `ProjectTablePage` |  |
| `entities` (required) | `EntityRef[]` | the selected entities (not table rows: list items resolve to their entity) |
| `projectName` (required) | `string` |  |

Pieces: `run`.

### `projectTable.toolbarItem`: `projectTableToolbarItem`

A button in the project tables' toolbar, before Customize (Overview, Products, Lists). The host draws it from the description; `component` (a dialog or popover) loads on the first click. Loads: first click.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | unique among the addon's toolbar items |
| `icon` (required) | `string` | a Material Symbols icon name |
| `label` | `string \| undefined` | shown next to the icon; an icon-only button when not set |
| `tooltip` | `string \| undefined` | shown on hover; the label when not set |
| `pages` | `ProjectTablePage[] \| undefined` | which tables' toolbars show it; all (Overview, Products, Lists) when not set |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'projectTable.toolbarItem'` | the slot this is rendered in |
| `page` (required) | `ProjectTablePage` |  |
| `list` | `{ id: string; label: string; entityType: string; } \| undefined` | on Lists: the open list |
| `projectName` (required) | `string` |  |
| `open` (required) | `boolean` |  |
| `onClose` (required) | `() => void` |  |
| `anchor` (required) | `HTMLElement \| null` | the button, to anchor a popover to |

Pieces: `component`.

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
| `page` (required) | `ProjectTablePage` |  |
| `projectName` (required) | `string` |  |

Pieces: `component`.

### `tableColumn`: `tableColumn`

A read-only column in the project tables (Overview, Products, Lists). It is in the column settings from the description; `cell` and `useData` load with the table. Not sortable, and pasting into it changes nothing. Loads: with the page.

| Description field | Type | |
|---|---|---|
| `id` (required) | `string` | part of the column id, so only letters, digits and `_` |
| `label` (required) | `string` | the column header and its name in the column settings |
| `icon` | `string \| undefined` |  |
| `entityTypes` | `string[] \| undefined` | entity types with a cell; other rows show an empty read-only cell. All when not set |
| `pages` | `ProjectTablePage[] \| undefined` | which tables offer it; all (Overview, Products, Lists) when not set |
| `width` | `number \| undefined` | width in pixels |
| `defaultVisible` | `boolean \| undefined` | shown before the user picks columns; off by default, like most columns |

| Context (props, `useSlot`) | Type | |
|---|---|---|
| `slot` (required) | `'tableColumn'` | the slot this is rendered in |
| `page` (required) | `ProjectTablePage` |  |
| `entity` (required) | `EntityRef` |  |
| `value` (required) | `unknown` | what the column's `useData` returned for this entity; `undefined` without `useData` |
| `projectName` (required) | `string` |  |

Pieces: `cell`, `useData` (optional).
