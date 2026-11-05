// Addon contributions to the user details panel (Settings → Users, @ynput/ayon-addon): sections
// below AYON's forms (userDetails.section) and items in the header's "more" menu
// (userDetails.menuItem). Used by the app's UserDetail and by the dev shell.
import { useCallback, useMemo } from 'react'
import {
  ContributionView,
  prefetchPiece,
  runContribution,
  useContributions,
} from '@ynput/ayon-addon'
import type { Contribution, UserDetailsContext, UserRef, UserSelection } from '@ynput/ayon-addon'
import { menuItemsAt } from '@ynput/ayon-addon/host'
import { Panel } from '@ynput/ayon-react-components'
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

const showsFor = (selection: UserSelection | undefined, count: number) =>
  count > 0 && (selection !== 'single' || count === 1)

/** The context of the user details slots for the selected users. */
export const useUserDetailsSlotContext = (
  users: UserDetailsSource[],
  readOnly: boolean,
): UserDetailsContext =>
  useMemo(() => ({ users: users.map(toUserRef), readOnly }), [users, readOnly])

interface AddonUserDetailsSectionsProps {
  context: UserDetailsContext
}

/** The addons' sections, each in a panel titled like AYON's own. */
export const AddonUserDetailsSections = ({ context }: AddonUserDetailsSectionsProps) => {
  const { contributions } = useContributions('userDetails.section')
  const hasServiceUser = context.users.some((user) => user.isService)
  const sections = useMemo(
    () =>
      contributions
        .filter((section) => showsFor(section.selection, context.users.length))
        .filter((section) => !hasServiceUser || section.serviceUsers)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [contributions, context.users.length, hasServiceUser],
  )

  return (
    <>
      {sections.map((section) => (
        <Panel key={section.key} data-addon-section={section.key}>
          <b>{section.title}</b>
          <ContributionView contribution={section} context={context} />
        </Panel>
      ))}
    </>
  )
}

export interface AddonUserMenuItems {
  /** first in the menu (`position: 'top'`) */
  topItems: MenuItemType[]
  /** after the menu's own items, above Delete */
  items: MenuItemType[]
  /** loads the items' code: call it when the menu opens */
  prefetch: () => void
}

/** The addons' items for the user details "more" menu. */
export const useAddonUserMenuItems = (context: UserDetailsContext): AddonUserMenuItems => {
  const { contributions } = useContributions('userDetails.menuItem')
  const applicable = useMemo(
    () => contributions.filter((item) => showsFor(item.selection, context.users.length)),
    [contributions, context.users.length],
  )
  const toMenuItem = useCallback(
    (item: Contribution<'userDetails.menuItem'>): MenuItemType => ({
      id: item.key,
      label: item.label,
      icon: item.icon,
      'data-addon-item': item.key,
      onClick: () => runContribution(item, context),
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
