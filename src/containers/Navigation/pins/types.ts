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

/** A saved view pinned as a tab in a project's tab row. */
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
