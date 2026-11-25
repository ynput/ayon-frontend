import { useSelector } from 'react-redux'
import type { NavLinkItem } from '@containers/header/AppNavLinks'
import type { NavAccess, NavItem, NavLayout } from './types'

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
 * The one filter over the registry: an item shows when the user can open one of its tabs and the
 * layout doesn't hide it. Exposure levels and hidden contributions are applied before the items
 * are built (an addon page the user can't see has no tab). Tabs stay as they are, so the tab row
 * can still redirect from a tab the user can't open.
 */
export const filterNavigation = (
  items: NavItem[],
  access: NavAccess,
  layout: NavLayout = {},
): NavItem[] =>
  items.filter(
    (item) =>
      !layout.hidden?.includes(item.id) && item.tabs.some((tab) => canOpenTab(tab, access)),
  )

/** Every item's tabs in registry order: the single tab row before the sidebar existed. */
export const flattenTabs = (items: NavItem[]): NavLinkItem[] => items.flatMap((item) => item.tabs)
