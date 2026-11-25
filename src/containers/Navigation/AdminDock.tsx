import { useRef } from 'react'
import clsx from 'clsx'
import { useLocation } from 'react-router-dom'
import { Icon } from '@ynput/ayon-react-components'
import { MenuContainer } from '@shared/components'
import { useMenuContext } from '@shared/context'
import { useRestart } from '@context'
import { useAppSelector } from '@state/store'
import AppMenu from '@components/Menu/Menus/AppMenu'
import {
  filterNavigation,
  findActiveItem,
  itemLandingPath,
  splitAdminItems,
  useNavAccess,
} from './filterNavigation'
import { useAdminNavigation } from './useSettingsNavigation'
import RailItem from './RailItem'
import * as Styled from './NavRail.styled'

/**
 * The sidebar's bottom, below a divider: the admin pages a layout promotes as items (Settings,
 * Projects and Events for now), then the Admin menu with the other admin pages and the server's
 * actions, the top bar's old apps menu. The menu's id is the one the /appMenu redirect (after
 * signing in to Ynput Cloud) opens.
 */
const AdminDock = ({ projectName }: { projectName?: string }) => {
  const { pathname } = useLocation()
  const access = useNavAccess()
  const user = useAppSelector((state) => state.user)
  const { menuOpen, toggleMenuOpen } = useMenuContext()
  const { isSnoozing } = useRestart()
  const anchorRef = useRef<HTMLSpanElement>(null)

  const items = filterNavigation(useAdminNavigation(projectName), access)
  const active = findActiveItem(items, pathname)
  const { docked, folded } = splitAdminItems(items)

  const isOpen = menuOpen === 'app'
  const hasMenu = !!folded.length || !!user.data?.isAdmin || !!user.attrib?.developerMode
  // a regular user's menu only has developer mode's actions
  const menuLabel = access.manager ? 'Admin' : 'More'

  return (
    <Styled.Dock data-rail-pinned="" data-rail-dock="">
      <Styled.Divider />
      {docked.map((item) => {
        const to = itemLandingPath(item, access)
        if (!to) return null
        return (
          <RailItem key={item.id} item={item} to={to} isActive={item.id === active?.id} compact />
        )
      })}
      {hasMenu && (
        <>
          <Styled.MoreItem
            type="button"
            className={clsx('compact', {
              active: isOpen || folded.some((item) => item.id === active?.id),
            })}
            aria-label={menuLabel}
            aria-haspopup="menu"
            aria-expanded={isOpen}
            data-rail-item="admin-menu"
            data-tooltip={menuLabel}
            data-tooltip-position="right"
            onClick={() => toggleMenuOpen('app')}
          >
            {/* not More's icon: both can show at once */}
            <Icon icon={access.manager ? 'admin_panel_settings' : 'more_horiz'} />
            <Styled.Label>{menuLabel}</Styled.Label>
            {isSnoozing && <Styled.NotificationDot />}
            {/* the menu opens beside the sidebar */}
            <Styled.MoreAnchor ref={anchorRef} />
          </Styled.MoreItem>
          <MenuContainer id="app" target={anchorRef.current} align="left">
            <AppMenu
              user={user}
              places={folded.map((item) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                link: itemLandingPath(item, access),
                selected: item.id === active?.id,
              }))}
            />
          </MenuContainer>
        </>
      )}
    </Styled.Dock>
  )
}

export default AdminDock
