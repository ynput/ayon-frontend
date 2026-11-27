import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { UserImage } from '@shared/components'

import Breadcrumbs from '../Breadcrumbs/Breadcrumbs'
import { HeaderButton } from '@shared/components'
import ProjectMenu from '../ProjectMenu/projectMenu'
import { useAppDispatch, useAppSelector } from '@state/store'
import InstallerDownloadPrompt from '@components/InstallerDownload/InstallerDownloadPrompt'
import { useMenuContext } from '@shared/context'
import { HelpMenu, UserMenu } from '@components/Menu'
import { MenuContainer } from '@shared/components'
import styled from 'styled-components'
import clsx from 'clsx'
import InboxNotificationIcon from './InboxNotification'
import ReleaseInstallerPrompt from '@containers/ReleaseInstallerDialog/ReleaseInstallerPrompt/ReleaseInstallerPrompt'
import ChatBubbleButton from './ChatBubbleButton'
import BundleModeSelector from './BundleMode/BundleMode'
import AddonHeaderItems from './AddonHeaderItems'
import LayoutMenuHost from '@containers/Navigation/layouts/LayoutMenuHost'
import StudioBrand from './StudioBrand'
import { Icon } from '@ynput/ayon-react-components'

const Side = styled.div`
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);

  /* stop 32px short of the centred studio brand (--brand-width, measured) */
  @media (min-width: 1281px) {
    max-width: calc(50% - var(--brand-width, 240px) / 2 - 32px);
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

// Home leading the path where there's no sidebar to head (guests, an addon's own route; hidden
// beside the sidebar, index.scss): in the path's style, then the chevron into the project
const HeaderHome = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;

  a {
    display: flex;
    align-items: center;
    gap: 6px;
    height: 32px;
    padding: 0 12px 0 10px;
    border-radius: var(--border-radius-m);
    background-color: var(--md-sys-color-surface-container-highest);
    color: var(--md-sys-color-on-surface);
    text-decoration: none;
    font-size: 14px;

    &:hover {
      background-color: var(--md-sys-color-surface-container-highest-hover);
    }
    .icon {
      font-size: 18px;
    }
  }
  & > .icon {
    font-size: 20px;
    color: var(--md-sys-color-on-surface-variant);
  }
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

  // BUTTON REFS used to attach menu to buttons
  const helpButtonRef = useRef<HTMLButtonElement>(null)
  const userButtonRef = useRef<HTMLButtonElement>(null)

  // the studio brand's width: the left side runs up to it
  const brandRef = useRef<HTMLDivElement>(null)
  const [brandWidth, setBrandWidth] = useState<number>()
  useEffect(() => {
    if (!brandRef.current) return
    const observer = new ResizeObserver(([entry]) =>
      setBrandWidth(Math.round(entry.contentRect.width)),
    )
    observer.observe(brandRef.current)
    return () => observer.disconnect()
  }, [])

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
      <Side
        style={
          brandWidth !== undefined
            ? ({ '--brand-width': `${brandWidth}px` } as CSSProperties)
            : undefined
        }
      >
        <HeaderHome className="header-home">
          <Link to="/dashboard/tasks">
            <Icon icon="home" />
            Home
          </Link>
          <Icon icon="chevron_right" />
        </HeaderHome>

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

      <Center ref={brandRef}>
        <StudioBrand />
      </Center>

      <SideEnd id="header-menu-right">
        <InstallerDownloadPrompt />
        <ReleaseInstallerPrompt isAdmin={user.data.isAdmin} />
        <BundleModeSelector />

        {!user.data.isGuest && (
          <>
            <LayoutMenuHost />
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
          </>
        )}

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
