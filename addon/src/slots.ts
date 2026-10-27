import type { ComponentType } from 'react'
import type {
  EntityRef,
  EntityScope,
  ProjectTablePage,
  PageMeta,
  PopupScope,
  ProjectFoldersScope,
  ProjectNameScope,
  ProjectScope,
  SlicerScope,
  ViewsScope,
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
   * A button in the project tables' toolbar, before Customize (Overview, Products, Lists). The
   * host draws it from the description; `component` (a dialog or popover) loads on the first click.
   */
  'projectTable.toolbarItem': {
    version: 1
    meta: ProjectTableToolbarItemMeta
    context: ProjectTableToolbarItemContext
    pieces: { component: Loader<ComponentType<SlotProps<'projectTable.toolbarItem'>>> }
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
  /** unique among the addon's header items */
  id: string
  /** shown next to the icon on the left, as the tooltip on the right */
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

/** Description of a menu item contribution. */
export interface MenuItemMeta {
  /** unique among the addon's items of the slot */
  id: string
  /** the menu entry */
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
export interface ProjectTableToolbarItemMeta {
  /** unique among the addon's toolbar items */
  id: string
  /** a Material Symbols icon name */
  icon: string
  /** shown next to the icon; an icon-only button when not set */
  label?: string
  /** shown on hover; the label when not set */
  tooltip?: string
  /** which tables' toolbars show it; all (Overview, Products, Lists) when not set */
  pages?: ProjectTablePage[]
}

/** Context of a project table toolbar item. */
export interface ProjectTableToolbarItemContext extends ProjectNameScope, PopupScope {
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
}

// the server's NAME_REGEX: what the views API takes as a view type
const VIEW_TYPE_PATTERN = /^[a-zA-Z0-9_]([a-zA-Z0-9_.-]*[a-zA-Z0-9_])?$/
const pageFields = { access: /^(manager|admin)$/, viewType: VIEW_TYPE_PATTERN }

/** The slots this host knows. A contribution to any other slot is skipped. */
export const SLOTS: { readonly [S in SlotName]: SlotDefinition } = {
  'project.page': { version: 1, required: ['title'], pieces: ['component'], optional: pageFields },
  'studio.page': { version: 1, required: ['title'], pieces: ['component'], optional: pageFields },
  'header.item': { version: 1, required: ['label', 'icon'], pieces: ['component'] },
  'detailsPanel.tab': { version: 1, required: ['label', 'icon'], pieces: ['component'] },
  'detailsPanel.menuItem': { version: 1, required: ['label', 'icon'], pieces: ['run'] },
  tableColumn: { version: 1, required: ['label'], pieces: ['cell'], optionalPieces: ['useData'] },
  entityMenuItem: { version: 1, required: ['label', 'icon'], pieces: ['run'] },
  'projectList.menuItem': { version: 1, required: ['label', 'icon'], pieces: ['run'] },
  'slicer.menuItem': { version: 1, required: ['label', 'icon'], pieces: ['run'] },
  'projectTable.toolbarItem': { version: 1, required: ['icon'], pieces: ['component'] },
  'projectTable.customizeSection': {
    version: 1,
    required: ['title', 'icon'],
    pieces: ['component'],
  },
}

export const isKnownSlot = (slot: unknown): slot is SlotName =>
  typeof slot === 'string' && Object.prototype.hasOwnProperty.call(SLOTS, slot)
