import type { NavLinkItem } from '@containers/header/AppNavLinks'
import type { NavItem, NavLayout } from '../types'
import type { ContextLayout, LayoutSettings } from './types'

/** A layout's settings for one context, as the navigation applies them. */
export const toNavLayout = (
  settings: LayoutSettings | undefined,
  context: 'project' | 'studio',
): NavLayout => {
  const own = settings?.[context]
  return {
    hidden: own?.items?.hidden,
    order: own?.items?.order,
    tabs: own?.tabs,
    promoted: settings?.promoted,
  }
}

/**
 * The sidebar's items (already filtered and in sidebar order) in the layout's order within each
 * section; the ones it doesn't mention go at the end of their section.
 */
export const arrangeItems = (items: NavItem[], layout: NavLayout): NavItem[] => {
  const order = layout.order
  if (!order?.length) return items
  const rank = (item: NavItem) => {
    const index = order.indexOf(item.id)
    return index === -1 ? order.length : index
  }
  return items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        // sections keep their order: only items of the same section move
        (a.item.section === b.item.section ? rank(a.item) - rank(b.item) : 0) || a.index - b.index,
    )
    .map(({ item }) => item)
}

/** A pinned view's tab id in a layout. */
export const pinTabId = (viewId: string) => `view:${viewId}`

/** A tab's id in a layout: its module, or `view:<id>` for a pinned view. */
export const tabId = (tab: NavLinkItem) =>
  tab.pinnedView ? pinTabId(tab.pinnedView) : (tab.module as string | undefined)

/**
 * An item's tab row in the layout's order, without the tabs it hides (with them, `keepHidden`,
 * while it is being edited). A pin it doesn't mention follows its page's tab (and that page's
 * pins); any other tab it doesn't mention (a new addon page) goes at the end.
 */
export const arrangeTabs = (
  tabs: NavLinkItem[],
  layout: NavLayout,
  itemId: string,
  keepHidden = false,
) => {
  const own = layout.tabs?.[itemId]
  if (!own) return tabs
  const hidden = new Set(keepHidden ? [] : own.hidden ?? [])
  const shown = tabs.filter((tab) => !hidden.has(tabId(tab) ?? ''))
  const order = own.order ?? []
  const result = order.flatMap((id) => shown.filter((tab) => tabId(tab) === id))
  shown.forEach((tab) => {
    if (result.includes(tab)) return
    const page = tab.pinnedView ? result.map((other) => other.module).lastIndexOf(tab.module) : -1
    result.splice(page === -1 ? result.length : page + 1, 0, tab)
  })
  return result
}

export type LayoutSource = 'picked' | 'project' | 'studio' | 'own' | 'none'

/**
 * Which layout applies, by id: the one the user picked, else the project's default, else the
 * studio default (the base view), else the user's own layout, else none (AYON's navigation). A
 * layout the user can't read (not in their list) is skipped.
 */
export const resolveLayout = ({
  picked,
  projectDefault,
  readable,
  studioDefault,
  own,
}: {
  picked?: string
  projectDefault?: string
  /** ids of the layouts the user can read */
  readable: string[]
  studioDefault?: string
  own?: string
}): { source: LayoutSource; id?: string } => {
  if (picked && readable.includes(picked)) return { source: 'picked', id: picked }
  if (projectDefault && readable.includes(projectDefault))
    return { source: 'project', id: projectDefault }
  if (studioDefault) return { source: 'studio', id: studioDefault }
  if (own) return { source: 'own', id: own }
  return { source: 'none' }
}

/**
 * The layout with a tab moved one place within the row the user sees (`rowIds`, the arranged
 * row's tab ids), recorded in that item's tab order. Ids the row doesn't show (a pin of another
 * project) keep their place in it.
 */
export const moveTabInRow = (
  layout: LayoutSettings | undefined,
  context: 'project' | 'studio',
  itemId: string,
  rowIds: string[],
  id: string,
  delta: -1 | 1,
): LayoutSettings => {
  const from = rowIds.indexOf(id)
  const to = from + delta
  if (from === -1 || to < 0 || to >= rowIds.length) return { ...layout }
  const own: ContextLayout = layout?.[context] ?? {}
  // the stored order with the row's other tabs in it, each after the one before it in the row
  // (the row follows the stored order), then the two tabs swap places
  const order = [...(own.tabs?.[itemId]?.order ?? [])]
  rowIds.forEach((rowId, index) => {
    if (!order.includes(rowId))
      order.splice(index ? order.indexOf(rowIds[index - 1]) + 1 : 0, 0, rowId)
  })
  const [a, b] = [order.indexOf(id), order.indexOf(rowIds[to])]
  ;[order[a], order[b]] = [order[b], order[a]]
  return {
    ...layout,
    version: 1,
    [context]: {
      ...own,
      tabs: { ...own.tabs, [itemId]: { ...own.tabs?.[itemId], order } },
    },
  }
}

/** The layout with one tab id replaced (`to`), or left out (no `to`), in every tab arrangement. */
export const replaceTabId = (
  layout: LayoutSettings | undefined,
  from: string,
  to?: string,
): LayoutSettings => {
  const swap = (ids?: string[]) => ids?.flatMap((id) => (id === from ? (to ? [to] : []) : [id]))
  const context = (own?: ContextLayout): ContextLayout | undefined =>
    own?.tabs
      ? {
          ...own,
          tabs: Object.fromEntries(
            Object.entries(own.tabs).map(([item, tabs]) => [
              item,
              { ...tabs, order: swap(tabs.order), hidden: swap(tabs.hidden) },
            ]),
          ),
        }
      : own
  return { ...layout, project: context(layout?.project), studio: context(layout?.studio) }
}

const toggled = (ids: string[] | undefined, id: string) =>
  ids?.includes(id) ? ids.filter((other) => other !== id) : [...(ids ?? []), id]

/** The layout with a sidebar item shown again, or hidden. */
export const toggleItemHidden = (
  layout: LayoutSettings | undefined,
  context: 'project' | 'studio',
  itemId: string,
): LayoutSettings => {
  const own: ContextLayout = layout?.[context] ?? {}
  return {
    ...layout,
    version: 1,
    [context]: { ...own, items: { ...own.items, hidden: toggled(own.items?.hidden, itemId) } },
  }
}

/** The layout with a tab of an item's row shown again, or hidden. */
export const toggleTabHidden = (
  layout: LayoutSettings | undefined,
  context: 'project' | 'studio',
  itemId: string,
  id: string,
): LayoutSettings => {
  const own: ContextLayout = layout?.[context] ?? {}
  const row = own.tabs?.[itemId]
  return {
    ...layout,
    version: 1,
    [context]: {
      ...own,
      tabs: { ...own.tabs, [itemId]: { ...row, hidden: toggled(row?.hidden, id) } },
    },
  }
}

/**
 * What editing changes (the sidebar and the tab rows of both contexts) put onto the layout as it
 * is now, which keeps its pins and promoted admin pages.
 */
export const applyEdits = (
  current: LayoutSettings | undefined,
  draft: LayoutSettings,
): LayoutSettings => ({
  ...current,
  version: 1,
  project: { ...current?.project, items: draft.project?.items, tabs: draft.project?.tabs },
  studio: { ...current?.studio, items: draft.studio?.items, tabs: draft.studio?.tabs },
})
