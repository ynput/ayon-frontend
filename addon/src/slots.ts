import type { ComponentType } from 'react'
import type {
  EntityRef,
  EntityScope,
  ProjectTablePage,
  PageMeta,
  ProjectFoldersScope,
  ProjectNameScope,
  ProjectScope,
  SlicerScope,
  ViewsScope,
} from './scopes'
import { isReservedShortcut, parseShortcut } from './shortcuts'

// The slots: places in the AYON web UI that addons contribute to.
// SlotMap is the single source of truth. Each entry has the slot's version, the description the
// host reads straight from the manifest (`meta`), the context the addon's code gets (`context`)
// and the pieces of code it loads (`pieces`). SLOTS repeats what the host checks at run time.

/**
 * A piece of a contribution: a dynamic import of a file in the addon, `() => import('./NotesTab')`.
 * The build puts each piece in its own chunk, and the slot decides when it loads.
 */
export type Loader<T> = () => Promise<{ default: T }>

/**
 * Every slot this version of AYON has. Keys are slot names (`'project.page'`); each value has
 * the slot's `version`, its description fields (`meta`), the context its code gets (`context`)
 * and its pieces (`pieces`).
 */
export interface SlotMap {
  /**
   * A tab on the project page, at `/projects/<project>/<id>`. The tab shows from the
   * description; `component` loads when the page is first opened.
   */
  'project.page': {
    version: 1
    meta: PageMeta
    context: ProjectScope & SlicerScope & ProjectFoldersScope & ViewsScope
    pieces: { component: Loader<ComponentType<SlotProps<'project.page'>>> }
  }
  /**
   * A tab on the dashboard (studio level), at `/dashboard/<id>`. The tab shows from the
   * description; `component` loads when the page is first opened.
   */
  'studio.page': {
    version: 1
    meta: PageMeta
    context: StudioPageContext
    pieces: { component: Loader<ComponentType<SlotProps<'studio.page'>>> }
  }
  /**
   * A button in the main header, drawn by the host like its own buttons. What a click does is the
   * addon's: navigate (`to`), run code (`run`), open a dialog (`dialog`) or a menu (`menu`); or the
   * addon draws the item itself (`component`, loaded with the header). Set exactly one.
   */
  'header.item': {
    version: 1
    meta: HeaderItemMeta
    context: HeaderItemContext
    pieces: ButtonPieces<'header.item'>
  }
  /**
   * A tab in the details panel. The tab button shows from the description, for `entityTypes`;
   * `component` loads when the tab is first opened.
   */
  'detailsPanel.tab': {
    version: 1
    meta: DetailsPanelTabMeta
    context: DetailsPanelTabContext
    pieces: { component: Loader<ComponentType<SlotProps<'detailsPanel.tab'>>> }
  }
  /**
   * An item in the details panel's "more" menu. It shows from the description; `run` loads when
   * the menu opens and is called on click.
   */
  'detailsPanel.menuItem': {
    version: 1
    meta: DetailsPanelMenuItemMeta
    context: DetailsPanelMenuItemContext
    pieces: { run: Loader<RunPiece<'detailsPanel.menuItem'>> }
  }
  /**
   * An item in the project list's menus (dashboard, project menu, studio pages' ProjectList): the
   * right-click menu, the "more" dropdown, or both (`in`). It acts on the selected projects.
   */
  'projectList.menuItem': {
    version: 1
    meta: ListMenuItemMeta
    context: ProjectListMenuItemContext
    pieces: { run: Loader<RunPiece<'projectList.menuItem'>> }
  }
  /**
   * An item in the project page slicer's menus: the right-click menu, the panel's dropdown, or both
   * (`in`), for the slice types it lists.
   */
  'slicer.menuItem': {
    version: 1
    meta: SlicerMenuItemMeta
    context: SlicerMenuItemContext
    pieces: { run: Loader<RunPiece<'slicer.menuItem'>> }
  }
  /**
   * An item in the right-click menu of the project tables' cells, for the selected entities. It
   * shows from the description; `run` loads when the menu opens and is called on click.
   */
  entityMenuItem: {
    version: 1
    meta: EntityMenuItemMeta
    context: EntityMenuItemContext
    pieces: { run: Loader<RunPiece<'entityMenuItem'>> }
  }
  /**
   * A button in the project tables' toolbar, before Customize (Overview, Products, Lists), drawn
   * by the host like the toolbar's own. What a click does is the addon's: navigate (`to`), run code
   * (`run`), open a dialog (`dialog`) or a menu (`menu`); or the addon draws the item itself
   * (`component`, loaded with the toolbar). Set exactly one.
   */
  'projectTable.toolbarItem': {
    version: 1
    meta: ProjectTableToolbarItemMeta
    context: ProjectTableToolbarItemContext
    pieces: ButtonPieces<'projectTable.toolbarItem'>
  }
  /**
   * A section in the project tables' Customize panel (Overview, Products, Lists). The entry shows
   * from the description; `component` loads when the section is opened.
   */
  'projectTable.customizeSection': {
    version: 1
    meta: ProjectTableCustomizeSectionMeta
    context: ProjectTableCustomizeSectionContext
    pieces: { component: Loader<ComponentType<SlotProps<'projectTable.customizeSection'>>> }
  }
  /**
   * A read-only column in the project tables (Overview, Products, Lists). It is in the column
   * settings from the description; `cell` and `fetchValues` load with the table. The host draws
   * the cell box (padding, selection, focus), so `cell` renders only its content; selecting, the
   * right-click menu and Copy (the cell's `value` as text) work as in other columns. Not sortable,
   * and pasting into it changes nothing. When the values depend on data your mutations change, list
   * its cache tags in `providesTags` and the column refreshes itself when they are invalidated:
   * `tableColumn({ id, label, cell, fetchValues, providesTags: [{ type: 'myaddonLog', id: 'LIST' }] })`.
   */
  tableColumn: {
    version: 1
    meta: TableColumnMeta
    context: TableCellContext
    pieces: {
      cell: Loader<ComponentType<SlotProps<'tableColumn'>>>
      fetchValues?: Loader<TableColumnFetch>
    }
  }
  /**
   * A keyboard shortcut on the cells of AYON's tables: the project tables (Overview, Products,
   * Lists) and the panels' tables (slicer, project list, lists, versions). Pressed in a cell, it
   * runs code (`run`) or opens a dialog (`dialog`) with the selected rows; set exactly one. AYON's
   * own keys (arrows, Enter, Escape, Tab, Space, `r`, Delete, copy, paste, undo) can't be taken,
   * and the key does nothing while a cell is being edited.
   */
  'table.shortcut': {
    version: 1
    meta: TableShortcutMeta
    context: TableShortcutContext
    pieces: TableShortcutPieces
  }
}

/** Description fields of a button the host draws (header and toolbar items). */
export interface ButtonMeta {
  /** a Material Symbols icon name; required unless the item is a `component` */
  icon?: string
  /** shown on hover; the label when not set */
  tooltip?: string
  /** navigates there on click, e.g. `/dashboard/comments` (exactly one action: see the slot) */
  to?: string
  /** the `dialog`'s title; the label when not set */
  dialogTitle?: string
  /** the `dialog`'s size, `md` by default */
  dialogSize?: 'sm' | 'md' | 'lg' | 'full'
}

/** Context of a button's code (`run`, `dialog`, `menu`, `component`) besides the slot's own. */
export interface ButtonScope {
  /** goes to an AYON URL, e.g. `navigate('/dashboard/comments')` */
  navigate: (to: string) => void
}

/** What a `dialog` piece gets besides the slot context. */
export interface DialogScope {
  /** closes the dialog */
  close: () => void
}

/** An entry of a button's `menu`. */
export type AddonMenuItem =
  | { divider: true }
  | {
      id: string
      label: string
      icon?: string
      /** goes to an AYON URL when clicked */
      to?: string
      /** opens an external URL in a new tab when clicked */
      href?: string
      /** called when clicked; an error is shown as a toast */
      onClick?: () => void | Promise<void>
      /** a submenu */
      items?: AddonMenuItem[]
      disabled?: boolean
      selected?: boolean
      danger?: boolean
    }

/** What a `menu` piece exports as default: the menu's items, built each time the menu opens. */
export type MenuPiece<S extends SlotName> = (
  context: SlotContext<S>,
) => AddonMenuItem[] | Promise<AddonMenuItem[]>

/**
 * The pieces of a button: what a click does. Set exactly one of them, or `to` in the description.
 */
export interface ButtonPieces<S extends SlotName> {
  /** called on click with the context (it has `navigate`) */
  run?: Loader<RunPiece<S>>
  /** the content of a dialog the host opens and closes: AYON's dialog with title and close button */
  dialog?: Loader<ComponentType<SlotProps<S> & DialogScope>>
  /** the items of a menu the host opens under the button, like the header's help menu */
  menu?: Loader<MenuPiece<S>>
  /** the addon's own component instead of the host's button: a dropdown, a toggle, anything */
  component?: Loader<ComponentType<SlotProps<S>>>
}

/** Description of a `header.item` contribution. */
export interface HeaderItemMeta extends ButtonMeta {
  /** unique among the addon's header items */
  id: string
  /** shown next to the icon on the left, as the tooltip on the right */
  label: string
  /** `left`: after the Home button; `right`: before chat and the inbox */
  placement: 'left' | 'right'
  /** order among addon items on the same side, lowest first */
  order?: number
}

/** Context of a header item. */
export interface HeaderItemContext extends ButtonScope {
  /** the project whose page is open, else `null` */
  projectName: string | null
}

/** Description of a `detailsPanel.tab` contribution. */
export interface DetailsPanelTabMeta {
  /** the tab id is `<addon>.<id>` */
  id: string
  /** the tab button's tooltip */
  label: string
  /** a Material Symbols icon name, the tab button */
  icon: string
  /** entity types the tab shows for; all when not set */
  entityTypes?: string[]
}

/** Context of a details panel tab. */
export interface DetailsPanelTabContext extends ProjectNameScope, EntityScope {
  /** where the panel is open (`overview`, `dashboard`, `inbox`, ...); the panel opens in many places */
  scope: string
}

/** What a menu item's `run` piece exports as default: called on click with the slot context. */
export type RunPiece<S extends SlotName> = (context: SlotContext<S>) => void | Promise<void>

/** Where an addon's item goes in a menu. */
export type MenuItemPosition = 'top' | 'bottom'

/** Description of a menu item contribution. */
export interface MenuItemMeta {
  /** unique among the addon's items of the slot */
  id: string
  /** the menu entry */
  label: string
  /** a Material Symbols icon name */
  icon: string
  /**
   * `top`: first in the menu; `bottom` (default): after the menu's own items, above the
   * destructive ones (Delete, Archive)
   */
  position?: MenuItemPosition
  /** order among addon items with the same position, lowest first */
  order?: number
}

/** Description of a `detailsPanel.menuItem` contribution. */
export interface DetailsPanelMenuItemMeta extends MenuItemMeta {
  /** entity types the item shows for; all when not set */
  entityTypes?: string[]
  /**
   * shown as an icon button in the panel's header, next to the "more" button, instead of in its
   * menu (the label is the tooltip); `position` and `order` then order the header buttons
   */
  pinned?: boolean
}

/** Context of a details panel menu item. */
export interface DetailsPanelMenuItemContext extends ProjectNameScope {
  entityType: string
  /** the entities the panel shows */
  selectedEntities: EntityRef[]
}

/** Description of a `tableColumn` contribution. */
export interface TableColumnMeta {
  /** part of the column id, so only letters, digits and `_` */
  id: string
  /** the column header and its name in the column settings */
  label: string
  icon?: string
  /** entity types with a cell; other rows show an empty read-only cell. All when not set */
  entityTypes?: string[]
  /** which tables offer it; all (Overview, Products, Lists) when not set */
  pages?: ProjectTablePage[]
  /** width in pixels. Addon columns start hidden: users show them in Customize */
  width?: number
  /**
   * where the column sits in the "Add column" menu: a submenu named after the addon when not
   * set, a submenu with this name (columns giving the same name share it, across addons too), or
   * `false` for the menu's top level
   */
  menu?: string | false
  /**
   * cache tags of AYON's api that the values depend on: when one is invalidated (by your
   * mutations or AYON's), the values are fetched again as with `refreshTableColumn`. Needs
   * `fetchValues`. Names as you register them (`enhanceEndpoints({ addTagTypes })`, prefixed with
   * your addon name) or AYON's own. A plain name follows invalidations of the whole type only: to
   * follow `{ type, id }`, such as a list tag, give that tag
   */
  providesTags?: TableColumnTag[]
}

/**
 * A cache tag a `tableColumn` depends on (`providesTags`), as in RTK Query: a tag type, or a type
 * and id. Invalidating `'x'` refreshes columns that list `'x'` or `{ type: 'x', id }`;
 * invalidating `{ type: 'x', id: 'LIST' }` refreshes only columns that list that tag.
 */
export type TableColumnTag = string | { type: string; id?: string | number }

/** Context of one cell of a `tableColumn`. */
export interface TableCellContext extends ProjectNameScope {
  page: ProjectTablePage
  entity: EntityRef
  /** what the column's `fetchValues` returned for this entity; `undefined` without `fetchValues` */
  value: unknown
}

/** What a column's `fetchValues` gets. */
export interface TableColumnFetchArgs extends ProjectNameScope {
  page: ProjectTablePage
  /** the rows to get values for (entities, not list items): at most 100 */
  entities: EntityRef[]
  /** aborted when the table no longer needs them (another project or table) */
  signal: AbortSignal
}

/**
 * Gets a column's values, by entity id; each cell gets its own as `value`. AYON calls it with
 * the rows that come on screen and that it has no value for yet, in batches once scrolling
 * pauses, and keeps what it returns: scrolling back costs nothing. A row whose entity changes
 * (here or by someone else) is asked for again; for anything else the values depend on, list its
 * cache tags in the column's `providesTags`, or call `refreshTableColumn(id)` to ask again for all.
 * When it throws, those cells show the error and are tried again when they next come on
 * screen. Fetch through AYON's store (`dispatch(api.endpoints.x.initiate(...))`) to share its
 * cache.
 */
export type TableColumnFetch = (args: TableColumnFetchArgs) => Promise<Record<string, unknown>>

/** Description of an `entityMenuItem` contribution. */
export interface EntityMenuItemMeta extends MenuItemMeta {
  /** entity types it acts on: shown only when every selected entity is one of them. All when not set */
  entityTypes?: string[]
  /** which tables offer it; all (Overview, Products, Lists) when not set */
  pages?: ProjectTablePage[]
  /** `single`: only for one selected entity; `multi` (default): for one or more */
  selection?: 'single' | 'multi'
}

/** Context of an entity menu item. */
export interface EntityMenuItemContext extends ProjectNameScope {
  page: ProjectTablePage
  /** the selected entities (not table rows: list items resolve to their entity) */
  entities: EntityRef[]
}

/**
 * A table with addon shortcuts: the project tables (`overview`, `products`, `lists`) and the
 * panels' tables: the slicer, the project list, the Lists page's lists and the Products page's
 * versions.
 */
export type ShortcutTable = ProjectTablePage | 'slicer' | 'projects' | 'listsPanel' | 'versionsPanel'

/** Description of a `table.shortcut` contribution. */
export interface TableShortcutMeta {
  /** unique among the addon's shortcuts */
  id: string
  /** what it does, e.g. `Copy row as JSON`; the dialog's title when `dialogTitle` is not set */
  label: string
  /**
   * the key and its modifiers joined by `+`, lower case: `g`, `shift+mod+c`, `alt+1`, `f2`. `mod` is
   * ⌘ on macOS and Ctrl elsewhere; `ctrl`, `meta`, `alt` and `shift` are the keys themselves.
   * Letters and digits match the key's place on the keyboard, so `alt+g` works on macOS too
   */
  keys: string
  /**
   * which tables it works in; all when not set. `overview`, `products`, `lists` (the project
   * tables), `slicer`, `projects`, `listsPanel`, `versionsPanel`
   */
  tables?: ShortcutTable[]
  /** the `dialog`'s title; the label when not set */
  dialogTitle?: string
  /** the `dialog`'s size, `md` by default */
  dialogSize?: 'sm' | 'md' | 'lg' | 'full'
}

/** A table row a shortcut acts on. */
export interface TableRowRef {
  /** project tables: the entity's id (list items resolve to their entity); else the row's id */
  id: string
  /** project tables: `folder`, `task`, `product`, `version`, ... */
  entityType?: string
  name?: string
  label?: string
  /**
   * the row as the table has it: an entity's fields and `attrib` in the project tables, the
   * project, list, version or slicer value in the panels
   */
  data: Record<string, unknown>
}

/** Context of a table shortcut. */
export interface TableShortcutContext {
  /** the table the key was pressed in */
  table: ShortcutTable
  /** the open project; `null` in the project list */
  projectName: string | null
  /** the rows it acts on: the selected ones when the key was pressed in one of them, else its row */
  rows: TableRowRef[]
  /** where the key was pressed: the row's id, and the column's in the project tables */
  focused: { rowId: string; columnId?: string }
  /** project tables: the selected cells, by row (entity) and column id; empty elsewhere */
  cells: { rowId: string; columnId: string }[]
}

/** The pieces of a table shortcut: what the key does. Set exactly one. */
export interface TableShortcutPieces {
  /** called with the context when the key is pressed */
  run?: Loader<RunPiece<'table.shortcut'>>
  /** the content of a dialog the host opens: AYON's dialog with title and close button */
  dialog?: Loader<ComponentType<SlotProps<'table.shortcut'> & DialogScope>>
}

/** Which menu a list's menu item is in: the right-click menu or the "more" dropdown. */
export type MenuKind = 'context' | 'dropdown'

/** Description of a `projectList.menuItem` or `slicer.menuItem` contribution. */
export interface ListMenuItemMeta extends MenuItemMeta {
  /** which menus show it: both when not set */
  in?: MenuKind[]
}

/** Context of a project list menu item. */
export interface ProjectListMenuItemContext {
  /** the selected projects (project folders left out) */
  projectNames: string[]
  menu: MenuKind
}

/** Description of a `slicer.menuItem` contribution. */
export interface SlicerMenuItemMeta extends ListMenuItemMeta {
  /** slice types it shows for (`hierarchy`, `assignees`, `status`, ...); all when not set */
  sliceTypes?: string[]
}

/** A row of the slicer: a folder in `hierarchy`, a value (user, status, type) in the others. */
export interface SlicerRowRef {
  id: string
  label?: string
  /** for `hierarchy` rows: `folder` (or `task`) */
  entityType?: string
}

/** Context of a slicer menu item. */
export interface SlicerMenuItemContext extends ProjectNameScope {
  sliceType: string
  /** the rows it acts on: the selected ones, or the right-clicked one */
  selected: SlicerRowRef[]
  menu: MenuKind
}

/** Description of a `projectTable.toolbarItem` contribution. */
export interface ProjectTableToolbarItemMeta extends ButtonMeta {
  /** unique among the addon's toolbar items */
  id: string
  /** shown next to the icon; an icon-only button when not set */
  label?: string
  /** which tables' toolbars show it; all (Overview, Products, Lists) when not set */
  pages?: ProjectTablePage[]
}

/** Context of a project table toolbar item. */
export interface ProjectTableToolbarItemContext extends ProjectNameScope, ButtonScope {
  page: ProjectTablePage
  /** on Lists: the open list */
  list?: { id: string; label: string; entityType: string }
}

/** Description of a `projectTable.customizeSection` contribution. */
export interface ProjectTableCustomizeSectionMeta {
  /** unique among the addon's sections */
  id: string
  /** the section's entry in Customize and its title when open */
  title: string
  /** a Material Symbols icon name */
  icon: string
  /** which tables' Customize panels show it; all (Overview, Products, Lists) when not set */
  pages?: ProjectTablePage[]
}

/** Context of a Customize section. */
export interface ProjectTableCustomizeSectionContext extends ProjectNameScope {
  page: ProjectTablePage
}

/** Context of a studio page. */
export interface StudioPageContext extends ViewsScope {
  /** projects selected in the page's `<ProjectList>`; saved per page */
  selectedProjects: string[]
}

/** The name of a slot, e.g. `'project.page'`. */
export type SlotName = keyof SlotMap & string

/** What the code of a contribution to slot `S` gets: `{ slot: S, ...context }`. */
export type SlotContext<S extends SlotName> = S extends SlotName
  ? { slot: S } & SlotMap[S]['context']
  : never

/** Props of the component a contribution to slot `S` renders. Same as `SlotContext<S>`. */
export type SlotProps<S extends SlotName> = SlotContext<S>

/** What the host checks for each slot when it reads a manifest. */
export interface SlotDefinition {
  version: number
  /** description fields that must be non-empty strings */
  required: readonly string[]
  /** pieces that must be loaders */
  pieces: readonly string[]
  /** pieces that may be left out */
  optionalPieces?: readonly string[]
  /** description fields that may be left out, and the pattern they must match when set */
  optional?: { readonly [field: string]: RegExp }
  /** further rules: returns why the contribution is skipped, or nothing */
  check?: (contribution: Readonly<Record<string, unknown>>) => string | undefined
}

// the server's NAME_REGEX: what the views API takes as a view type
const VIEW_TYPE_PATTERN = /^[a-zA-Z0-9_]([a-zA-Z0-9_.-]*[a-zA-Z0-9_])?$/
const pageFields = { access: /^(manager|admin)$/, viewType: VIEW_TYPE_PATTERN }
const menuItemFields = { position: /^(top|bottom)$/ }

// header and toolbar items: exactly one action, and an icon unless the addon draws the item
const BUTTON_ACTIONS = ['to', 'run', 'dialog', 'menu', 'component'] as const
const buttonPieces = ['run', 'dialog', 'menu', 'component']
const buttonFields = { to: /^\//, dialogSize: /^(sm|md|lg|full)$/ }
const checkButton = (item: Readonly<Record<string, unknown>>) => {
  const actions = BUTTON_ACTIONS.filter((action) => item[action] !== undefined)
  if (actions.length !== 1) {
    return `set exactly one of ${BUTTON_ACTIONS.join(', ')} (it has ${actions.join(', ') || 'none'})`
  }
  if (actions[0] !== 'component' && typeof item.icon !== 'string') return 'missing icon'
}

// table shortcuts: exactly one action, and keys that parse and aren't AYON's own
const checkShortcut = (item: Readonly<Record<string, unknown>>) => {
  const actions = ['run', 'dialog'].filter((action) => item[action] !== undefined)
  if (actions.length !== 1) return `set exactly one of run, dialog (it has ${actions.join(', ') || 'none'})`
  const shortcut = parseShortcut(String(item.keys))
  if (!shortcut) return `keys "${item.keys}" is not a key combination, e.g. "g" or "shift+mod+c"`
  if (isReservedShortcut(shortcut)) return `keys "${item.keys}" is one of AYON's own table keys`
}

// table columns: a menu name or false, and tags (RTK Query's shape) only with values to refresh
const isTag = (tag: unknown) => {
  if (typeof tag === 'string') return !!tag
  const { type, id } = (tag ?? {}) as { type?: unknown; id?: unknown }
  return typeof type === 'string' && !!type && ['undefined', 'string', 'number'].includes(typeof id)
}
const checkTableColumn = (item: Readonly<Record<string, unknown>>) => {
  if (item.menu !== undefined && item.menu !== false && !(typeof item.menu === 'string' && item.menu.trim())) {
    return 'menu must be a name or false'
  }
  if (item.providesTags === undefined) return
  if (!Array.isArray(item.providesTags) || !item.providesTags.every(isTag)) {
    return "providesTags must be a list of tag types or { type, id } tags, e.g. ['myaddonItem']"
  }
  if (!item.fetchValues) return 'providesTags needs fetchValues: the tags refresh its values'
}

/** The slots this host knows. A contribution to any other slot is skipped. */
export const SLOTS: { readonly [S in SlotName]: SlotDefinition } = {
  'project.page': { version: 1, required: ['title'], pieces: ['component'], optional: pageFields },
  'studio.page': { version: 1, required: ['title'], pieces: ['component'], optional: pageFields },
  'header.item': {
    version: 1,
    required: ['label'],
    pieces: [],
    optionalPieces: buttonPieces,
    optional: buttonFields,
    check: checkButton,
  },
  'detailsPanel.tab': { version: 1, required: ['label', 'icon'], pieces: ['component'] },
  'detailsPanel.menuItem': {
    version: 1,
    required: ['label', 'icon'],
    pieces: ['run'],
    optional: menuItemFields,
    check: (item) =>
      item.pinned !== undefined && typeof item.pinned !== 'boolean' ? 'pinned must be true or false' : undefined,
  },
  tableColumn: {
    version: 1,
    required: ['label'],
    pieces: ['cell'],
    optionalPieces: ['fetchValues'],
    check: checkTableColumn,
  },
  entityMenuItem: { version: 1, required: ['label', 'icon'], pieces: ['run'], optional: menuItemFields },
  'projectList.menuItem': { version: 1, required: ['label', 'icon'], pieces: ['run'], optional: menuItemFields },
  'slicer.menuItem': { version: 1, required: ['label', 'icon'], pieces: ['run'], optional: menuItemFields },
  'projectTable.toolbarItem': {
    version: 1,
    required: [],
    pieces: [],
    optionalPieces: buttonPieces,
    optional: buttonFields,
    check: checkButton,
  },
  'projectTable.customizeSection': {
    version: 1,
    required: ['title', 'icon'],
    pieces: ['component'],
  },
  'table.shortcut': {
    version: 1,
    required: ['label', 'keys'],
    pieces: [],
    optionalPieces: ['run', 'dialog'],
    optional: { dialogSize: buttonFields.dialogSize },
    check: checkShortcut,
  },
}

export const isKnownSlot = (slot: unknown): slot is SlotName =>
  typeof slot === 'string' && Object.prototype.hasOwnProperty.call(SLOTS, slot)
