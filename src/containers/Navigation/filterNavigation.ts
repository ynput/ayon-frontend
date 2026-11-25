import { useSelector } from 'react-redux'
import type { NavLinkItem } from '@containers/header/AppNavLinks'
import { NAV_SECTIONS, type NavAccess, type NavItem, type NavLayout } from './types'
import { arrangeTabs } from './layouts/applyLayout'

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
 * open one of the tabs the layout shows. Exposure levels and hidden contributions are applied
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
      arrangeTabs(item.tabs, layout, item.id).some((tab) => canOpenTab(tab, access)),
  )

/** The admin pages shown as items until a layout promotes others. */
export const DEFAULT_PROMOTED = ['settings', 'projects', 'events']

/** The admin items a layout promotes to the sidebar, and the rest, which go in the Admin menu. */
export const splitAdminItems = (items: NavItem[], layout: NavLayout = {}) => {
  const promoted = layout.promoted ?? DEFAULT_PROMOTED
  return {
    docked: items.filter((item) => promoted.includes(item.id)),
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
 * Whether the layout shows the open tab in its item's row: the pinned view open by `?view=`, else
 * the page's own tab (a path no tab holds counts as shown).
 */
export const isTabShown = (
  item: NavItem,
  pathname: string,
  layout: NavLayout,
  viewId?: string | null,
) => {
  const holds = (link: NavLinkItem) => !!link.path && isUnder(pathname, pathOf(link.path))
  const tab =
    (viewId && item.tabs.find((link) => link.pinnedView === viewId && holds(link))) ||
    item.tabs.find((link) => !link.pinnedView && holds(link))
  return !tab || arrangeTabs(item.tabs, layout, item.id).includes(tab)
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
