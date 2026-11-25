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
 * A stored order with a row the user sees (`row`, the ids it shows in their order) changed to
 * `next`, the same ids in a new order. The row's ids missing from the stored order go in first,
 * each after the one before it in the row (the row follows the stored order); then the row's
 * places take `next`. Ids the row doesn't show (a pin of another project) keep their place.
 */
export const placeRowOrder = (stored: string[] | undefined, row: string[], next: string[]) => {
  const order = [...(stored ?? [])]
  row.forEach((id, index) => {
    if (!order.includes(id)) order.splice(index ? order.indexOf(row[index - 1]) + 1 : 0, 0, id)
  })
  let at = 0
  return order.map((id) => (row.includes(id) ? next[at++] : id))
}

/** `ids` with `id` moved to where `overId` is (dropped on it). */
const moveTo = (ids: string[], id: string, overId: string) => {
  const from = ids.indexOf(id)
  const to = ids.indexOf(overId)
  if (from === -1 || to === -1 || from === to) return ids
  const next = ids.filter((other) => other !== id)
  next.splice(to, 0, id)
  return next
}

/** The layout with a tab of an item's row (`rowIds`, as shown) dropped where `overId` is. */
export const reorderTabs = (
  layout: LayoutSettings | undefined,
  context: 'project' | 'studio',
  itemId: string,
  rowIds: string[],
  id: string,
  overId: string,
): LayoutSettings => {
  const own: ContextLayout = layout?.[context] ?? {}
  const row = own.tabs?.[itemId]
  const order = placeRowOrder(row?.order, rowIds, moveTo(rowIds, id, overId))
  return {
    ...layout,
    version: 1,
    [context]: { ...own, tabs: { ...own.tabs, [itemId]: { ...row, order } } },
  }
}

/**
 * The layout with a sidebar item (of `rowIds`, the items as shown, in sidebar order) dropped
 * where `overId` is. The caller keeps it within its section.
 */
export const reorderItems = (
  layout: LayoutSettings | undefined,
  context: 'project' | 'studio',
  rowIds: string[],
  id: string,
  overId: string,
): LayoutSettings => {
  const own: ContextLayout = layout?.[context] ?? {}
  const order = placeRowOrder(own.items?.order, rowIds, moveTo(rowIds, id, overId))
  return { ...layout, version: 1, [context]: { ...own, items: { ...own.items, order } } }
}

/** The layout with a tab moved one place within the row the user sees (`rowIds`). */
export const moveTabInRow = (
  layout: LayoutSettings | undefined,
  context: 'project' | 'studio',
  itemId: string,
  rowIds: string[],
  id: string,
  delta: -1 | 1,
): LayoutSettings => {
  const neighbour = rowIds[rowIds.indexOf(id) + delta]
  if (!rowIds.includes(id) || !neighbour) return { ...layout }
  return reorderTabs(layout, context, itemId, rowIds, id, neighbour)
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
