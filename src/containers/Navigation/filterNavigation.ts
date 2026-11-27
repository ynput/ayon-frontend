import { useSelector } from 'react-redux'
import type { NavLinkItem } from '@containers/header/AppNavLinks'
import { NAV_SECTIONS, type NavAccess, type NavItem, type NavLayout } from './types'
import { arrangeTabs, promotedIds } from './arrange'

/** The access levels tabs check, as the tab row computes them. */
export const useNavAccess = (): NavAccess => {
  const isManager = useSelector((state: any) => state.user.data.isManager)
  const isAdmin = useSelector((state: any) => state.user.data.isAdmin)
  return { manager: isManager || isAdmin, admin: isAdmin }
}

/** A tab the user can open: a link that is enabled and passes its access levels. */
export const canOpenTab = (tab: NavLinkItem, access: NavAccess) =>
  !tab.node &&
  !!tab.path &&
  tab.enabled !== false &&
  (!tab.accessLevels?.length || tab.accessLevels.every((level) => access[level]))

/**
 * The one filter over the registry: an item shows when the layout doesn't hide it and the user can
 * open one of the tabs the layout shows (a disabled item has none, and shows). Exposure levels and hidden contributions are applied
 * before the items are built (an addon page the user can't see has no tab). Tabs stay as they are,
 * so the tab row can still redirect from a tab the user can't open.
 */
export const filterNavigation = (
  items: NavItem[],
  access: NavAccess,
  layout: NavLayout = {},
): NavItem[] =>
  items.filter(
    (item) =>
      !layout.hidden?.includes(item.id) &&
      (!!item.disabled ||
        arrangeTabs(item.tabs, layout, item.id).some((tab) => canOpenTab(tab, access))),
  )

/** a sidebar divider's height with its margins */
export const RAIL_DIVIDER_HEIGHT = 9
/** the gap between sidebar items */
const RAIL_GAP = 2

/**
 * How many of the sidebar's admin pages (`ids`, top down) fit in the admin area's `space`: its
 * divider, the pages, and the Admin menu's button when the menu shows (`menuShown`, or as soon as
 * a page goes into it). The rest go in the Admin menu. Before every page is measured, all stay.
 */
export const fitDocked = ({
  ids,
  heights,
  space,
  button,
  menuShown,
}: {
  ids: string[]
  heights: Record<string, number>
  space: number
  button: number
  menuShown: boolean
}): number => {
  if (!Number.isFinite(space) || ids.some((id) => heights[id] === undefined)) return ids.length
  const pages = (count: number) =>
    ids.slice(0, count).reduce((sum, id) => sum + heights[id] + RAIL_GAP, 0)
  const menu = button + RAIL_GAP
  if (RAIL_DIVIDER_HEIGHT + pages(ids.length) + (menuShown ? menu : 0) <= space) return ids.length
  let count = Math.max(0, ids.length - 1)
  while (count > 0 && RAIL_DIVIDER_HEIGHT + pages(count) + menu > space) count -= 1
  return count
}

/**
 * The admin items a layout promotes to the sidebar (in its order), and the rest, which go in the
 * Admin menu.
 */
export const splitAdminItems = (items: NavItem[], layout: NavLayout = {}) => {
  const promoted = promotedIds(layout)
  return {
    docked: items
      .filter((item) => promoted.includes(item.id))
      .sort((a, b) => promoted.indexOf(a.id) - promoted.indexOf(b.id)),
    folded: items.filter((item) => !promoted.includes(item.id)),
  }
}

const pathOf = (path: string) => path.split('?')[0]
const isUnder = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(path.endsWith('/') ? path : `${path}/`)

/** The item a path belongs to: one of its tabs, or one of its `match` prefixes, holds the path. */
export const findActiveItem = (items: NavItem[], pathname: string): NavItem | undefined =>
  items.find(
    (item) =>
      item.tabs.some((tab) => !!tab.path && isUnder(pathname, pathOf(tab.path))) ||
      item.match?.some((prefix) => isUnder(pathname, prefix)),
  )

/**
 * Whether the layout shows the open tab in its item's row: the pinned view open by `?view=` (not
 * shown when the layout doesn't pin it), else the page's own tab (a path no tab holds counts as
 * shown).
 */
export const isTabShown = (
  item: NavItem,
  pathname: string,
  layout: NavLayout,
  viewId?: string | null,
) => {
  const holds = (link: NavLinkItem) => !!link.path && isUnder(pathname, pathOf(link.path))
  const tab = viewId
    ? item.tabs.find((link) => link.pinnedView === viewId && holds(link))
    : item.tabs.find((link) => !link.pinnedView && holds(link))
  if (!tab) return !viewId
  return arrangeTabs(item.tabs, layout, item.id).includes(tab)
}

/** Where an item opens: its landing tab, else the first tab the user can open. */
export const itemLandingPath = (
  item: NavItem,
  access: NavAccess,
  layout?: NavLayout,
): string | undefined => {
  // with a layout, the tabs it shows, in its order
  const tabs = layout ? arrangeTabs(item.tabs, layout, item.id) : item.tabs
  const openable = tabs.filter((tab) => canOpenTab(tab, access))
  return (openable.find((tab) => tab.module === item.landing) ?? openable[0])?.path
}

/** Items in sidebar order: by section, then `order`, then registry order. */
export const sortForSidebar = (items: NavItem[]): NavItem[] =>
  items
    .map((item, index) => ({ item, index }))
    .sort(
      (a, b) =>
        NAV_SECTIONS.indexOf(a.item.section) - NAV_SECTIONS.indexOf(b.item.section) ||
        (a.item.order ?? Infinity) - (b.item.order ?? Infinity) ||
        a.index - b.index,
    )
    .map(({ item }) => item)
