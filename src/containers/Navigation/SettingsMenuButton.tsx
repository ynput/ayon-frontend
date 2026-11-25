import { useRef } from 'react'
import clsx from 'clsx'
import { Icon } from '@ynput/ayon-react-components'
import { MenuContainer } from '@shared/components'
import { useMenuContext } from '@shared/context'
import { useRestart } from '@context'
import { useAppSelector } from '@state/store'
import AppMenu from '@components/Menu/Menus/AppMenu'
import * as Styled from './NavRail.styled'

interface SettingsMenuButtonProps {
  /** a settings or admin page is open */
  active?: boolean
  /** in a project: the menu's Projects Settings opens it */
  projectName?: string
}

/**
 * The sidebar's bottom button: settings, admin pages and the server's actions, the menu the top bar's
 * apps button had. Its id is the one the /appMenu redirect (after signing in to Ynput Cloud) opens.
 */
const SettingsMenuButton = ({ active, projectName }: SettingsMenuButtonProps) => {
  const { menuOpen, toggleMenuOpen } = useMenuContext()
  const user = useAppSelector((state) => state.user)
  const { isSnoozing } = useRestart()
  const anchorRef = useRef<HTMLSpanElement>(null)
  const isOpen = menuOpen === 'app'

  return (
    <>
      <Styled.MoreItem
        type="button"
        className={clsx({ active: active || isOpen })}
        aria-label="Settings"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        data-rail-item="settings-menu"
        data-rail-pinned=""
        data-tooltip="Settings"
        data-tooltip-position="right"
        onClick={() => toggleMenuOpen('app')}
      >
        <Icon icon="settings" />
        <Styled.Label>Settings</Styled.Label>
        {isSnoozing && <Styled.NotificationDot />}
        {/* the menu opens beside the sidebar */}
        <Styled.MoreAnchor ref={anchorRef} />
      </Styled.MoreItem>
      <MenuContainer id="app" target={anchorRef.current} align="left">
        <AppMenu user={user} projectName={projectName} />
      </MenuContainer>
    </>
  )
}

export default SettingsMenuButton
