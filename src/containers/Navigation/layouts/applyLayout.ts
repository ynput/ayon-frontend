import type { NavLinkItem } from '@containers/header/AppNavLinks'
import type { NavItem, NavLayout } from '../types'
import type { LayoutSettings } from './types'

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

/** A tab's id in a layout: its module, or `view:<id>` for a pinned view. */
export const tabId = (tab: NavLinkItem) =>
  tab.pinnedView ? `view:${tab.pinnedView}` : (tab.module as string | undefined)

/**
 * An item's tab row in the layout's order, without the tabs it hides. A pin it doesn't mention
 * follows its page's tab (and that page's pins); any other tab it doesn't mention (a new addon
 * page) goes at the end.
 */
export const arrangeTabs = (tabs: NavLinkItem[], layout: NavLayout, itemId: string) => {
  const own = layout.tabs?.[itemId]
  if (!own) return tabs
  const hidden = new Set(own.hidden ?? [])
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
