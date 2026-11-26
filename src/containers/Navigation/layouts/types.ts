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

/** The sidebar's arrangement: its items (NavItem ids) and, once the user arranged it, dividers. */
export interface RailArrangement extends Arrangement {
  /**
   * The user arranged the sidebar: `order` is all of it, items and dividers (`divider:<id>`), and
   * the sections no longer apply. Without it (no change yet, or a layout saved before), `order`
   * orders the items within their sections and a divider separates the sections.
   */
  free?: boolean
}

/** What a layout says about one context (a project, or Home). */
export interface ContextLayout {
  items?: RailArrangement
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

/** A layout as the layout menu lists it. */
export interface LayoutMenuItem {
  id: string
  label: string
  owner?: string
  /** saved as its owner's working view (before every layout had a name): private to them */
  working?: boolean
  /** 30 the owner, 20 may change it, 10 may read it */
  accessLevel?: number
}

/**
 * What the layout menu gets (Power Pack's `views/LayoutMenu`, in the header): the layouts, which
 * one applies here and why, and what the user may do with them. Saving, sharing, renaming and
 * deleting a layout are the views API's.
 */
export interface LayoutMenuProps {
  userName: string
  /**
   * the layout that applies has loaded: until then (just after a switch, or while a project
   * loads) the actions on it wait
   */
  ready: boolean
  /** the layouts the user can read; the studio default is `studioDefaultId`, not one of these */
  layouts: LayoutMenuItem[]
  /** the layout that applies here, if any */
  activeId?: string
  /** its name, for the menu's button */
  activeName: string
  /** its settings, for Save as new */
  activeSettings?: LayoutSettings
  /** the layout the user picked; without one, the default applies */
  pickedId?: string
  /** the studio default (the base view), if there is one */
  studioDefaultId?: string
  /** the open project, if any, and its default layout */
  projectName?: string
  projectDefaultId?: string
  /** picks a layout, everywhere; `null` follows the defaults again */
  pick: (layoutId: string | null) => Promise<void>
  /** edits the layout that applies here; missing while that can't start */
  customize?: () => void
  /** managers, in a project: makes a layout its default, or clears it with `null` */
  setProjectDefault?: (layoutId: string | null) => Promise<void>
  /** admins: copies a layout into the studio default, or removes it with `null` */
  setStudioDefault?: (layoutId: string | null) => Promise<void>
  /** the app store's dispatch, for the views dialogs (as `ViewFormDialog` gets it) */
  dispatch: (action: any) => any
}
