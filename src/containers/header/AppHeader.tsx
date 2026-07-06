import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserImage } from '@shared/components'

import Breadcrumbs from '../Breadcrumbs/Breadcrumbs'
import HeaderButton from './HeaderButton'
import AppMenu from '@components/Menu/Menus/AppMenu'
import ProjectMenu from '../ProjectMenu/projectMenu'
import { useAppDispatch, useAppSelector } from '@state/store'
import InstallerDownloadPrompt from '@components/InstallerDownload/InstallerDownloadPrompt'
import { useMenuContext } from '@shared/context/MenuContext'
import { HelpMenu, UserMenu } from '@components/Menu'
import { MenuContainer } from '@shared/components'
import styled from 'styled-components'
import { useRestart } from '@context/RestartContext'
import clsx from 'clsx'
import InboxNotificationIcon from './InboxNotification'
import ReleaseInstallerPrompt from '@containers/ReleaseInstallerDialog/ReleaseInstallerPrompt/ReleaseInstallerPrompt'
import ChatBubbleButton from './ChatBubbleButton'
import BundleModeSelector from './BundleMode/BundleMode'

const FlexWrapper = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

const FlexWrapperEnd = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  justify-content: end;
  align-items: center;
`

const ProjectsButton = styled(HeaderButton)`
  align-items: center;
  display: flex;
`

const UserButton = styled(HeaderButton)`
  padding: 6px;
`

const Header: React.FC = () => {
  const dispatch = useAppDispatch()
  const { menuOpen, toggleMenuOpen, setMenuOpen } = useMenuContext()
  const handleToggleMenu = (menu: string | false) => toggleMenuOpen(menu)
  const handleSetMenu = (menu: string | false) => setMenuOpen(menu)
  const location = useLocation()
  const navigate = useNavigate()
  // get user from redux store
  const user = useAppSelector((state) => state.user)
  const avatarKey = useAppSelector((state) => state.user.avatarKey)

  // restart server notification
  const { isSnoozing } = useRestart()

  // BUTTON REFS used to attach menu to buttons
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)
  const appButtonRef = useRef<HTMLButtonElement>(null)

  // if last path in pathname is 'appMenu' then open appMenu
  useEffect(() => {
    if (location.pathname.split('/').pop() === 'appMenu') {
      // parse query params from current URL
      const searchParams = new URLSearchParams(location.search)

      // set localStorage to true
      localStorage.setItem('appMenuOpen', 'true')
      // then remove 'appMenu' from pathname
      const newPathname = location.pathname.replace('/appMenu', '')

      // append query params to new URL
      const newUrl = `${newPathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      navigate(newUrl, { replace: true })
    } else if (localStorage.getItem('appMenuOpen') === 'true') {
      handleSetMenu('app')
      // delete
      localStorage.removeItem('appMenuOpen')
    }
  }, [location.pathname, localStorage])

  const handleNavClick = (e: MouseEvent<HTMLElement>) => {
    // if target us nav, then close menu
    if ((e.target as HTMLElement).tagName === 'NAV') handleSetMenu(false)
  }

  // if on certain page, hide
  const hiddenOnPages = ['/review']
  if (hiddenOnPages.includes(location.pathname)) return null

  return (
    <nav className="primary" onClick={handleNavClick}>
      <FlexWrapper>
        {user.uiExposureLevel >= 500 && (
          <ProjectsButton
            icon="left_panel_open"
            variant="nav"
            onClick={() => handleToggleMenu('project')}
          />
        )}

        <Link to={'/dashboard/tasks'}>
          <HeaderButton
            icon="home"
            label="Home"
            variant="nav"
            className={clsx({ selected: location.pathname.startsWith('/dashboard') })}
            id="home-button"
            iconProps={{ filled: true }}
          />
        </Link>

        <ProjectMenu isOpen={menuOpen === 'project'} onHide={() => handleSetMenu(false)} />
      </FlexWrapper>

      <Breadcrumbs />
      <FlexWrapperEnd id="header-menu-right">
        <InstallerDownloadPrompt />
        <ReleaseInstallerPrompt isAdmin={user.data.isAdmin} />
        <BundleModeSelector />

        {!user.data.isGuest && (
          <>
            <ChatBubbleButton />

            {/* help icon and menu vvv */}
            <HeaderButton
              icon="help"
              ref={helpButtonRef}
              onClick={() => handleToggleMenu('help')}
              className={clsx({ active: menuOpen === 'help' })}
              variant="nav"
            />
            <MenuContainer id="help" target={helpButtonRef.current}>
              <HelpMenu user={user} />
            </MenuContainer>
            {/* help icon and menu ^^^ */}

            {/* Inbox icon */}
            <InboxNotificationIcon />

            {/* App icon and menu vvv */}
            <HeaderButton
              icon="apps"
              onClick={() => handleToggleMenu('app')}
              ref={appButtonRef}
              variant="nav"
              className={clsx({ active: menuOpen === 'app', notification: isSnoozing })}
            />

            <MenuContainer id="app" target={appButtonRef.current}>
              <AppMenu user={user} />
            </MenuContainer>
          </>
        )}
        {/* App icon and menu ^^^ */}

        {/* User icon and menu vvv */}
        <UserButton
          className={clsx({ active: menuOpen === 'user' })}
          onClick={() => handleToggleMenu('user')}
          aria-label="User menu"
          ref={userButtonRef}
          variant="nav"
        >
          <UserImage size={26} name={user?.name} imageKey={avatarKey} />
        </UserButton>
        <MenuContainer id="user" target={userButtonRef.current}>
          <UserMenu user={user} />
        </MenuContainer>
        {/* User icon and menu ^^^ */}
      </FlexWrapperEnd>
    </nav>
  )
}

export default Header
