/** Layouts are saved views of this type. */
export const LAYOUT_VIEW_TYPE = 'layout'

/** The pages whose saved views can be pinned as tabs, by view type. */
export const PINNED_PAGES = {
  overview: { module: 'overview', icon: 'table_rows' },
  versions: { module: 'products', icon: 'layers' },
  lists: { module: 'lists', icon: 'list' },
  reviews: { module: 'reviews', icon: 'play_circle' },
} as const

export type PinnableViewType = keyof typeof PINNED_PAGES

export const isPinnableViewType = (viewType?: string): viewType is PinnableViewType =>
  !!viewType && viewType in PINNED_PAGES

/** A saved view pinned as a tab in the project's Production tab row. */
export interface PinnedView {
  /** the view's id */
  id: string
  viewType: PinnableViewType
  /** the tab's own name; the view's label when not set */
  label?: string
  /** where the view is stored; a project view is pinned in its project only */
  scope?: 'project' | 'studio'
  projectName?: string
}

/** An order and what's hidden, by id. Ids it doesn't mention show, after the ones it does. */
export interface Arrangement {
  order?: string[]
  hidden?: string[]
}

/** What a layout says about one context (a project, or Home). */
export interface ContextLayout {
  /** the sidebar's items (NavItem ids), within their sections */
  items?: Arrangement
  /** each item's tab row, by item id: a page tab's module, or `view:<id>` for a pinned view */
  tabs?: Record<string, Arrangement>
  pinned?: PinnedView[]
}

/** A layout's settings: a view of type `layout`. */
export interface LayoutSettings {
  version?: 1
  project?: ContextLayout
  studio?: ContextLayout
  /** admin pages shown as sidebar items (the others are in the Admin menu) */
  promoted?: string[]
}

/** Where a user's picked layout (user preferences) and a project's default (project data) live. */
export const LAYOUT_KEY = 'navigationLayout'
