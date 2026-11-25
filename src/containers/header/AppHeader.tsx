import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserImage } from '@shared/components'

import Breadcrumbs from '../Breadcrumbs/Breadcrumbs'
import { HeaderButton } from '@shared/components'
import AppMenu from '@components/Menu/Menus/AppMenu'
import ProjectMenu from '../ProjectMenu/projectMenu'
import { useAppDispatch, useAppSelector } from '@state/store'
import InstallerDownloadPrompt from '@components/InstallerDownload/InstallerDownloadPrompt'
import { useMenuContext } from '@shared/context'
import { HelpMenu, UserMenu } from '@components/Menu'
import { MenuContainer } from '@shared/components'
import styled from 'styled-components'
import { useRestart } from '@context'
import clsx from 'clsx'
import InboxNotificationIcon from './InboxNotification'
import ReleaseInstallerPrompt from '@containers/ReleaseInstallerDialog/ReleaseInstallerPrompt/ReleaseInstallerPrompt'
import ChatBubbleButton from './ChatBubbleButton'
import BundleModeSelector from './BundleMode/BundleMode'
import AddonHeaderItems from './AddonHeaderItems'
import StudioBrand from './StudioBrand'

const Side = styled.div`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  /* stop short of the centred studio brand (max 240px wide) */
  @media (min-width: 1281px) {
    max-width: calc(50% - 136px);
  }
`

// the icons never shrink: on narrow windows the context pill truncates instead
const SideEnd = styled.div`
  flex: 0 0 auto;
  margin-left: auto;
  display: flex;
  align-items: center;
  justify-content: end;
  gap: var(--base-gap-small);
`

// centred on the bar, not between the sides
const Center = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;

  /* the context pill needs the room more than the brand */
  @media (max-width: 1280px) {
    display: none;
  }
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
      <Side>
        <Link to={'/dashboard/tasks'}>
          <HeaderButton
            icon="home"
            label="Home"
            variant="nav"
            // Home is the context of every page outside a project
            className={clsx({ selected: !location.pathname.startsWith('/projects/') })}
            id="home-button"
            iconProps={{ filled: true }}
          />
        </Link>

        {!user.data.isGuest && <AddonHeaderItems placement="left" />}

        {/* the project name opens the project switcher */}
        <Breadcrumbs
          onProjectsClick={
            user.uiExposureLevel >= 500 ? () => handleToggleMenu('project') : undefined
          }
          projectsOpen={menuOpen === 'project'}
        />

        <ProjectMenu isOpen={menuOpen === 'project'} onHide={() => handleSetMenu(false)} />
      </Side>

      <Center>
        <StudioBrand />
      </Center>

      <SideEnd id="header-menu-right">
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

            <AddonHeaderItems placement="right" />

            {/* Inbox icon */}
            <InboxNotificationIcon />

            {/* Server menu vvv: the apps menu's links moved to Home's sidebar, the server's
            actions (update, restart, Ynput Cloud, bootstrap) stay here */}
            {(user.data.isAdmin || user.attrib?.developerMode) && (
              <>
                <HeaderButton
                  icon="dns"
                  onClick={() => handleToggleMenu('app')}
                  ref={appButtonRef}
                  variant="nav"
                  aria-label="Server"
                  data-tooltip="Server"
                  className={clsx({ active: menuOpen === 'app', notification: isSnoozing })}
                />

                <MenuContainer id="app" target={appButtonRef.current}>
                  <AppMenu user={user} />
                </MenuContainer>
              </>
            )}
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
          <UserImage size={25} name={user?.name} imageKey={avatarKey} />
        </UserButton>
        <MenuContainer id="user" target={userButtonRef.current}>
          <UserMenu user={user} />
        </MenuContainer>
        {/* User icon and menu ^^^ */}
      </SideEnd>
    </nav>
  )
}

export default Header
