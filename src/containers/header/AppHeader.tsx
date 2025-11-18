import { useEffect, useRef } from 'react'
import type { MouseEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { InputSwitch } from '@ynput/ayon-react-components'
import { UserImage } from '@shared/components'
import { useUpdateUserMutation } from '@shared/api'

import Breadcrumbs from '../Breadcrumbs/Breadcrumbs'
import HeaderButton from './HeaderButton'
import AppMenu from '@components/Menu/Menus/AppMenu'
import ProjectMenu from '../ProjectMenu/projectMenu'
import { useAppDispatch, useAppSelector } from '@state/store'
import InstallerDownloadPrompt from '@components/InstallerDownload/InstallerDownloadPrompt'
import { useMenuContext } from '@shared/context/MenuContext'
import { HelpMenu, UserMenu } from '@components/Menu'
import MenuContainer from '@components/Menu/MenuComponents/MenuContainer'
import { toast } from 'react-toastify'
import { toggleDevMode } from '@state/user'
import styled from 'styled-components'
import { useRestart } from '@context/RestartContext'
import clsx from 'clsx'
import InboxNotificationIcon from './InboxNotification'
import ReleaseInstallerPrompt from '@containers/ReleaseInstallerDialog/ReleaseInstallerPrompt/ReleaseInstallerPrompt'
import ChatBubbleButton from './ChatBubbleButton'

const FlexWrapper = styled.div`
  display: flex;
  gap: var(--base-gap-small);
`

const FlexWrapperEnd = styled.div`
  display: flex;
  gap: var(--base-gap-small);
  justify-content: end;
`

const DeveloperSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-l);
  padding: 4px 4px 4px 8px;
  margin: 4px 0;
  cursor: pointer;
  z-index: 10;
  transition: background-color 0.2s;
  background-color: var(--md-sys-color-surface-container-highest);

  & > span {
    user-select: none;
  }

  &:hover {
    background-color: var(--md-sys-color-surface-container-highest-hover);
  }

  &.active {
    background-color: var(--color-hl-developer-container);

    & > span {
      color: var(--color-hl-developer);
    }

    &:hover {
      background-color: var(--color-hl-developer-container-hover);
    }
  }
`

const StyledSwitch = styled(InputSwitch)`
  pointer-events: none;

  .switch-body input:checked + .slider {
    background-color: var(--color-hl-developer);
    border-color: var(--color-hl-developer);

    &,
    &:hover {
      &::before {
        background-color: var(--color-hl-developer-container);
      }
    }
  }
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

  // Get developer states
  const isDeveloper = (user?.data as any)?.isDeveloper
  const developerMode = user?.attrib.developerMode

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

  // UPDATE USER DATA
  const [updateUser] = useUpdateUserMutation()
  const handleDeveloperMode = async () => {
    try {
      const newDeveloperMode = !developerMode
      // optimistic update the switch
      dispatch(toggleDevMode(newDeveloperMode))

      await updateUser({
        name: user.name,
        patch: {
          attrib: { developerMode: newDeveloperMode },
        },
      }).unwrap()

      // if the request fails, revert the switch
    } catch (error) {
      console.error(error)
      const errorMessage = (error as any)?.details || 'Unknown error'
      toast.error('Unable to update developer mode: ' + errorMessage)
      // reset switch on error
      dispatch(toggleDevMode(developerMode))
    }
  }

  // if on certain page, hide
  const hiddenOnPages = ['/review']
  if (hiddenOnPages.includes(location.pathname)) return null

  return (
    <nav className="primary" onClick={handleNavClick}>
      <FlexWrapper>
        <Link to={'/dashboard/tasks'}>
          <HeaderButton
            icon="home"
            label="Home"
            variant="nav"
            className={clsx({ selected: location.pathname.startsWith('/dashboard') })}
            id="home-button"
          />
        </Link>

        {user.uiExposureLevel >= 500 && (
          <ProjectsButton
            icon="event_list"
            label="Projects"
            variant="nav"
            onClick={() => handleToggleMenu('project')}
          />
        )}

        <ProjectMenu isOpen={menuOpen === 'project'} onHide={() => handleSetMenu(false)} />
      </FlexWrapper>

      <Breadcrumbs />
      <FlexWrapperEnd id="header-menu-right">
        <InstallerDownloadPrompt />
        <ReleaseInstallerPrompt isAdmin={user.data.isAdmin} />
        {isDeveloper && (
          <DeveloperSwitch
            className={clsx({ active: developerMode })}
            onClick={handleDeveloperMode}
          >
            <span>Developer Mode</span>
            <StyledSwitch checked={developerMode} readOnly />
          </DeveloperSwitch>
        )}

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
