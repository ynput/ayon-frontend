// Context and menu items of the user details slots (userDetails.section, userDetails.menuItem,
// @ynput/ayon-addon). The sections themselves are AddonUserDetailsSections.
import { menuSection } from '@shared/components/Menu/menuSections'
import { useCallback, useMemo } from 'react'
import { prefetchPiece, runContribution, useContributions } from '@ynput/ayon-addon'
import type {
  Contribution,
  MenuKind,
  UserDetailsContext,
  UserRef,
  UserSelection,
} from '@ynput/ayon-addon'
import { contributionTags, menuItemsAt } from '@ynput/ayon-addon/host'
import type { MenuItemType } from '@shared/components/Menu/Menu'

/** A user as AYON's users queries have it. */
export interface UserDetailsSource {
  name: string
  active?: boolean
  isAdmin?: boolean
  isManager?: boolean
  isGuest?: boolean
  isService?: boolean
  attrib?: { fullName?: string | null; email?: string | null } | null
}

export const toUserRef = (user: UserDetailsSource): UserRef => ({
  name: user.name,
  fullName: user.attrib?.fullName || undefined,
  email: user.attrib?.email || undefined,
  active: user.active !== false,
  isAdmin: !!user.isAdmin,
  isManager: !!(user.isManager || user.isAdmin),
  isGuest: !!user.isGuest,
  isService: !!user.isService,
})

/** A contribution with this `selection` shows for `count` selected users. */
export const showsForSelection = (selection: UserSelection | undefined, count: number) =>
  count > 0 && (selection !== 'single' || count === 1)

/** The context of the user details slots for the selected users. */
export const useUserDetailsSlotContext = (
  users: UserDetailsSource[],
  readOnly: boolean,
): UserDetailsContext =>
  useMemo(() => ({ users: users.map(toUserRef), readOnly }), [users, readOnly])

export interface AddonUserMenuItems {
  /** first in the menu (`position: 'top'`) */
  topItems: MenuItemType[]
  /** after the menu's own items, above Delete */
  items: MenuItemType[]
  /** loads the items' code: call it when the menu opens */
  prefetch: () => void
}

// the items of `menu`: those whose `in` lists it (both menus when not set)
const toMenuItems = (
  contributions: readonly Contribution<'userDetails.menuItem'>[],
  context: UserDetailsContext,
  menu: MenuKind,
): AddonUserMenuItems => {
  const applicable = contributions.filter(
    (item) =>
      showsForSelection(item.selection, context.users.length) &&
      (!item.in?.length || item.in.includes(menu)),
  )
  const toMenuItem = (item: Contribution<'userDetails.menuItem'>): MenuItemType => ({
    id: item.key,
    label: item.label,
    icon: item.icon,
    'data-addon-item': item.key,
    onClick: () => runContribution(item, { ...context, menu }),
    ...contributionTags(item),
  })
  return {
    // addon items are a section of their own
    topItems: menuSection(menuItemsAt(applicable, 'top').map(toMenuItem)),
    items: menuSection(menuItemsAt(applicable, 'bottom').map(toMenuItem)),
    prefetch: () => applicable.forEach((item) => prefetchPiece(item.run)),
  }
}

/**
 * The addons' items for the user details "more" menu, tagged for the slot inspector. The button that
 * opens the menu carries `data-ayon-trigger="userDetails.menuItem"`.
 */
export const useAddonUserMenuItems = (context: UserDetailsContext): AddonUserMenuItems => {
  const { contributions } = useContributions('userDetails.menuItem')
  return useMemo(() => toMenuItems(contributions, context, 'dropdown'), [contributions, context])
}

/**
 * The same items for users known only when the menu opens: the users table's context menu, for
 * the right-clicked users.
 */
export const useAddonUserMenuItemsFor = (readOnly: boolean) => {
  const { contributions } = useContributions('userDetails.menuItem')
  return useCallback(
    (users: UserDetailsSource[]) =>
      toMenuItems(contributions, { users: users.map(toUserRef), readOnly }, 'context'),
    [contributions, readOnly],
  )
}
