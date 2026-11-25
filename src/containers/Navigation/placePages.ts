import type { PageMeta } from '@ynput/ayon-addon'
import type { NavLinkItem } from '@containers/header/AppNavLinks'
import { DEFAULT_ADDON_ICON, type KnownPlacement } from './knownPages'
import type { InspectorTags, NavItem } from './types'

/** An addon page (contribution, legacy keyword module or classic iframe addon) and its tab. */
export interface PageEntry {
  /** the item id when the page gets an item of its own */
  id: string
  /** the addon, for its group ids */
  addon?: string
  tab: NavLinkItem
  /** what the page declares about its place, on its contribution */
  meta?: Pick<PageMeta, 'placement' | 'icon' | 'section' | 'group' | 'groupTitle' | 'order'>
  /** the slot inspector's tags */
  tags?: InspectorTags
}

const byOrder = <T extends { order?: number }>(list: T[]) =>
  // stable: items without an order keep their place after the ordered ones
  list
    .map((value, index) => ({ value, index }))
    .sort(
      (a, b) =>
        (a.value.order ?? Infinity) - (b.value.order ?? Infinity) || a.index - b.index,
    )
    .map(({ value }) => value)

/**
 * Turns addon pages into sidebar items, in the pages' order. A page declaring `placement: 'tab'`
 * becomes a tab of `main`; pages sharing a group become one item at the first page's place.
 * What a page declares wins over the `known` placement of its module.
 */
export const placePages = (
  main: NavItem,
  entries: PageEntry[],
  known: Record<string, KnownPlacement>,
): NavItem[] => {
  const items: NavItem[] = []
  const groups = new Map<string, { item: NavItem; tabs: { tab: NavLinkItem; order?: number }[] }>()

  for (const { id, addon, tab, meta = {}, tags } of entries) {
    if (meta.placement === 'tab') {
      main.tabs.push(tab)
      continue
    }
    const placement: KnownPlacement | undefined = known[tab.module ?? '']
    const icon = meta.icon || placement?.icon || DEFAULT_ADDON_ICON
    const section = meta.section || placement?.section || 'other'

    const groupId = meta.group
      ? `group:${addon}/${meta.group}`
      : placement?.group && placement.group.addon === (addon ?? placement.group.addon)
        ? `group:${placement.group.addon}/${placement.group.id}`
        : undefined

    if (groupId) {
      const group = groups.get(groupId)
      if (group) {
        group.tabs.push({ tab, order: meta.order })
        continue
      }
      const item: NavItem = {
        id: groupId,
        label: meta.groupTitle || placement?.group?.title || tab.name || id,
        icon,
        section,
        order: meta.order,
        tabs: [],
        tags,
      }
      groups.set(groupId, { item, tabs: [{ tab, order: meta.order }] })
      items.push(item)
      continue
    }

    items.push({
      id,
      label: placement?.label || tab.name || id,
      icon,
      section,
      order: meta.order,
      // a renamed item's one tab takes the same name
      tabs: [placement?.label ? { ...tab, name: placement.label } : tab],
      tags,
    })
  }

  for (const { item, tabs } of groups.values()) {
    item.tabs = byOrder(tabs).map(({ tab }) => tab)
  }
  return items
}
