// Context and menu items of the user details slots (userDetails.section, userDetails.menuItem,
// @ynput/ayon-addon). The sections themselves are AddonUserDetailsSections.
import { useCallback, useMemo } from 'react'
import { prefetchPiece, runContribution, useContributions } from '@ynput/ayon-addon'
import type { Contribution, UserDetailsContext, UserRef, UserSelection } from '@ynput/ayon-addon'
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

/**
 * The addons' items for the user details "more" menu, tagged for the slot inspector. The button that
 * opens the menu takes `useSlotTriggerProps('userDetails.menuItem')`.
 */
export const useAddonUserMenuItems = (context: UserDetailsContext): AddonUserMenuItems => {
  const { contributions } = useContributions('userDetails.menuItem')
  const applicable = useMemo(
    () => contributions.filter((item) => showsForSelection(item.selection, context.users.length)),
    [contributions, context.users.length],
  )
  const toMenuItem = useCallback(
    (item: Contribution<'userDetails.menuItem'>): MenuItemType => ({
      id: item.key,
      label: item.label,
      icon: item.icon,
      'data-addon-item': item.key,
      onClick: () => runContribution(item, context),
      ...contributionTags(item),
    }),
    [context],
  )
  const topItems = useMemo(
    () => menuItemsAt(applicable, 'top').map(toMenuItem),
    [applicable, toMenuItem],
  )
  const items = useMemo(
    () => menuItemsAt(applicable, 'bottom').map(toMenuItem),
    [applicable, toMenuItem],
  )
  const prefetch = useCallback(
    () => applicable.forEach((item) => prefetchPiece(item.run)),
    [applicable],
  )
  return { topItems, items, prefetch }
}
