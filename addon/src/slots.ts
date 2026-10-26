import type { ComponentType } from 'react'
import type {
  EntityRef,
  EntityScope,
  ProjectTablePage,
  PageMeta,
  PopupScope,
  ProjectNameScope,
  ProjectScope,
  SlicerScope,
} from './scopes'

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
    context: ProjectScope & SlicerScope
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
   * A button in the main header. The host draws it from the description, like its own buttons;
   * `component` (a dialog or popover) loads on the first click and gets `open` / `onClose`.
   */
  'header.item': {
    version: 1
    meta: HeaderItemMeta
    context: HeaderItemContext
    pieces: { component: Loader<ComponentType<SlotProps<'header.item'>>> }
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
   * A read-only column in the project tables (Overview, Products, Lists). It is in the column
   * settings from the description; `cell` and `useData` load with the table. Not sortable, and
   * pasting into it changes nothing.
   */
  tableColumn: {
    version: 1
    meta: TableColumnMeta
    context: TableCellContext
    pieces: {
      cell: Loader<ComponentType<SlotProps<'tableColumn'>>>
      useData?: Loader<TableColumnDataHook>
    }
  }
}

/** Description of a `header.item` contribution. */
export interface HeaderItemMeta {
  id: string
  label: string
  /** a Material Symbols icon name */
  icon: string
  /** shown on hover; the label when not set */
  tooltip?: string
  /** `left`: after the Home button; `right`: before chat and the inbox */
  placement: 'left' | 'right'
  /** order among addon items on the same side, lowest first */
  order?: number
}

/** Context of a header item. */
export interface HeaderItemContext extends PopupScope {
  /** the project whose page is open, else `null` */
  projectName: string | null
}

/** Description of a `detailsPanel.tab` contribution. */
export interface DetailsPanelTabMeta {
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

/** Description of a menu item contribution. */
export interface MenuItemMeta {
  id: string
  label: string
  /** a Material Symbols icon name */
  icon: string
}

/** Description of a `detailsPanel.menuItem` contribution. */
export interface DetailsPanelMenuItemMeta extends MenuItemMeta {
  /** entity types the item shows for; all when not set */
  entityTypes?: string[]
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
  /** width in pixels */
  width?: number
  /** shown before the user picks columns; off by default, like most columns */
  defaultVisible?: boolean
}

/** Context of one cell of a `tableColumn`. */
export interface TableCellContext extends ProjectNameScope {
  page: ProjectTablePage
  entity: EntityRef
  /** what the column's `useData` returned for this entity; `undefined` without `useData` */
  value: unknown
}

/** What a column's `useData` hook gets. */
export interface TableColumnDataArgs extends ProjectNameScope {
  page: ProjectTablePage
  /** the rows on screen (entities, not list items) */
  entities: EntityRef[]
}

/**
 * A column's data hook: called once per table with the rows on screen, while the column is
 * shown. Return values by entity id; each cell gets its own as `value`. Fetch through the shared
 * api (RTK Query) so the cache dedupes and invalidates it.
 */
export type TableColumnDataHook = (args: TableColumnDataArgs) => Record<string, unknown> | undefined

/** Context of a studio page. */
export interface StudioPageContext {
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
}

/** The slots this host knows. A contribution to any other slot is skipped. */
export const SLOTS: { readonly [S in SlotName]: SlotDefinition } = {
  'project.page': { version: 1, required: ['title'], pieces: ['component'] },
  'studio.page': { version: 1, required: ['title'], pieces: ['component'] },
  'header.item': { version: 1, required: ['label', 'icon'], pieces: ['component'] },
  'detailsPanel.tab': { version: 1, required: ['label', 'icon'], pieces: ['component'] },
  'detailsPanel.menuItem': { version: 1, required: ['label', 'icon'], pieces: ['run'] },
  tableColumn: { version: 1, required: ['label'], pieces: ['cell'], optionalPieces: ['useData'] },
}

export const isKnownSlot = (slot: unknown): slot is SlotName =>
  typeof slot === 'string' && Object.prototype.hasOwnProperty.call(SLOTS, slot)
