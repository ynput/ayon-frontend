import type { NavLinkItem } from '@containers/header/AppNavLinks'
import type { NavItem, NavLayout } from './types'

/**
 * Showing the navigation as an arrangement (`NavLayout`) says: the order of the sidebar's items
 * and dividers, and of each tab row, and what they hide. Where an arrangement comes from and how
 * it changes is the arranging addon's (`NavArrangement`); without one, nothing is arranged.
 */

/**
 * The sidebar's items (already filtered and in sidebar order) in the arrangement's order within
 * each section; the ones it doesn't mention go at the end of their section. For an arrangement
 * that doesn't arrange the whole sidebar (not `free`).
 */
const arrangeItems = (items: NavItem[], layout: NavLayout): NavItem[] => {
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

/** A divider on the sidebar: in an arrangement's order, `divider:<id>`. */
const DIVIDER = 'divider:'

export const isDividerId = (id: string) => id.startsWith(DIVIDER)

/** A group of sidebar items: in an arrangement's order, `folder:<id>`. */
const FOLDER = 'folder:'

export const isFolderId = (id: string) => id.startsWith(FOLDER)

/** A group on the sidebar: its name and its items, in their order. */
export interface RailFolder {
  label: string
  items: NavItem[]
}

/** What the sidebar shows, top down: an item, a group (`folder`), or a divider (neither). */
export interface RailEntry {
  id: string
  item?: NavItem
  folder?: RailFolder
}

/** An entry that shows something: an item or a group, not a divider. */
export const isSolid = (entry?: RailEntry) => !!entry?.item || !!entry?.folder

/** The entries without the dividers that separate nothing: at either end, and after another. */
export const trimDividers = (entries: RailEntry[]) =>
  entries.filter(
    (entry, index) =>
      isSolid(entry) ||
      (isSolid(entries[index - 1]) && entries.slice(index + 1).some((next) => isSolid(next))),
  )

/** Every item on the sidebar, a group's included, top down. */
export const entryItems = (entries: RailEntry[]): NavItem[] =>
  entries.flatMap((entry) => (entry.item ? [entry.item] : entry.folder?.items ?? []))

/** The entries with only the items `keep` keeps, in groups too; a group left empty goes. */
export const keepItems = (entries: RailEntry[], keep: (item: NavItem) => boolean): RailEntry[] =>
  entries.flatMap((entry) => {
    if (entry.item) return keep(entry.item) ? [entry] : []
    if (!entry.folder) return [entry]
    const items = entry.folder.items.filter(keep)
    return items.length ? [{ ...entry, folder: { ...entry.folder, items } }] : []
  })

/**
 * The sidebar's items (already filtered and in sidebar order) and dividers, as the arrangement
 * puts them. One that arranges the whole sidebar (`free`) is its order, items and dividers
 * anywhere; an item it doesn't mention (an addon page installed since) goes after the last item of
 * its section, else at the end. Otherwise the items are in their sections, in the arrangement's
 * order within each, a divider between sections. Every divider is kept: once the hidden items are
 * out, `trimDividers` drops the ones left separating nothing.
 */
export const arrangeRail = (items: NavItem[], layout: NavLayout): RailEntry[] => {
  let entries: RailEntry[]
  if (layout.free) {
    const order = layout.order ?? []
    const folders = layout.folders ?? {}
    // an item in a group is there only
    const grouped = new Set(Object.values(folders).flatMap((folder) => folder.items))
    entries = order.flatMap((id) => {
      if (isDividerId(id)) return [{ id }]
      if (isFolderId(id)) {
        const folder = folders[id]
        if (!folder) return []
        const members = folder.items.flatMap((member) => items.filter((item) => item.id === member))
        return [{ id, folder: { label: folder.label, items: members } }]
      }
      if (grouped.has(id)) return []
      const item = items.find((other) => other.id === id)
      return item ? [{ id, item }] : []
    })
    // a group goes by its last item's section
    const section = (entry: RailEntry) =>
      entry.item?.section ?? entry.folder?.items[entry.folder.items.length - 1]?.section
    items.forEach((item) => {
      if (order.includes(item.id) || grouped.has(item.id)) return
      const kin = entries.map(section).lastIndexOf(item.section)
      entries.splice(kin === -1 ? entries.length : kin + 1, 0, { id: item.id, item })
    })
  } else {
    const arranged = arrangeItems(items, layout)
    entries = arranged.flatMap((item, index) =>
      index > 0 && arranged[index - 1].section !== item.section
        ? [{ id: `${DIVIDER}${item.section}` }, { id: item.id, item }]
        : [{ id: item.id, item }],
    )
  }
  return entries
}

/** A pinned view's tab id in an arrangement. */
export const pinTabId = (viewId: string) => `view:${viewId}`

/** A tab's id in an arrangement: its module, or `view:<id>` for a pinned view. */
export const tabId = (tab: NavLinkItem) =>
  tab.pinnedView ? pinTabId(tab.pinnedView) : (tab.module as string | undefined)

/**
 * An item's tab row in the arrangement's order, without the tabs it hides (with them,
 * `keepHidden`, while it is being edited). A pin it doesn't mention follows its page's tab (and
 * that page's pins); any other tab it doesn't mention (a new addon page) goes at the end.
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

/** The admin pages on the sidebar until an arrangement says which; the others are in the Admin menu. */
export const DEFAULT_PROMOTED = ['settings', 'projects', 'events']

/** The admin pages an arrangement puts on the sidebar, in their order. */
export const promotedIds = (layout?: { promoted?: string[] }) =>
  layout?.promoted ?? DEFAULT_PROMOTED

/**
 * After a drag ends, the click the browser then sends to what is under the pointer opens nothing:
 * a dragged tab or sidebar item is a link.
 */
export const swallowNextClick = () => {
  const stop = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()
  }
  window.addEventListener('click', stop, { capture: true, once: true })
  // the click comes with the pointer's release, before any timer
  setTimeout(() => window.removeEventListener('click', stop, { capture: true }))
}
