import { useEffect, useRef } from 'react'
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
import { toggleMenuOpen, setMenuOpen } from '@state/context'
import { HelpMenu, UserMenu } from '@components/Menu'
import MenuContainer from '@components/Menu/MenuComponents/MenuContainer'
import { toast } from 'react-toastify'
import { toggleDevMode } from '@state/user'
import styled from 'styled-components'
import { useRestart } from '@context/RestartContext'
import clsx from 'clsx'
import InboxNotificationIcon from './InboxNotification'
import ReleaseInstallerPrompt from '@containers/ReleaseInstallerDialog/ReleaseInstallerPrompt/ReleaseInstallerPrompt'
import { useFeedback } from '@/feedback/FeedbackContext'
import { SupportBubble } from '@/feedback/SupportBubble'

const FlexWrapper = styled.div`
  display: flex;
  gap: var(--base-gap-small);
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

  background-color: ${({ $isChecked }) =>
    $isChecked
      ? 'var(--color-hl-developer-container)'
      : 'var(--md-sys-color-surface-container-highest)'};

  & > span {
    color: ${({ $isChecked }) => ($isChecked ? 'var(--color-hl-developer)' : 'inherit')};
    user-select: none;
  }

  &:hover {
    background-color: ${({ $isChecked }) =>
      $isChecked
        ? 'var(--color-hl-developer-container-hover)'
        : 'var(--md-sys-color-surface-container-highest-hover)'};
  }
`

const StyledSwitch = styled(InputSwitch)`
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
  pointer-events: none;
`

const Header = () => {
  const dispatch = useAppDispatch()
  const menuOpen = useAppSelector((state) => state.context.menuOpen)
  const handleToggleMenu = (menu) => dispatch(toggleMenuOpen(menu))
  const handleSetMenu = (menu) => dispatch(setMenuOpen(menu))
  const location = useLocation()
  const navigate = useNavigate()
  // get user from redux store
  const user = useAppSelector((state) => state.user)

  const { openSupport, messengerLoaded } = useFeedback()

  // restart server notification
  const { isSnoozing } = useRestart()

  // Get developer states
  const isDeveloper = user?.data?.isDeveloper
  const developerMode = user?.attrib.developerMode

  // BUTTON REFS used to attach menu to buttons
  const helpButtonRef = useRef(null)
  const userButtonRef = useRef(null)
  const appButtonRef = useRef(null)

  // if last path in pathname is 'appMenu' then open appMenu
  useEffect(() => {
    if (location.pathname.split('/').pop() === 'appMenu') {
      // parse query params from current URL
      const searchParams = new URLSearchParams(location.search)

      // set localStorage to true
      localStorage.setItem('appMenuOpen', true)
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

  const handleNavClick = (e) => {
    // if target us nav, then close menu
    if (e.target.tagName === 'NAV') handleSetMenu(false)
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
      toast.error('Unable to update developer mode: ' + error.details)
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

        <HeaderButton
          icon="event_list"
          label="Projects"
          variant="nav"
          onClick={() => handleToggleMenu('project')}
          style={{
            alignItems: 'center',
            display: 'flex',
          }}
        />

        <ProjectMenu isOpen={menuOpen === 'project'} onHide={() => handleSetMenu(false)} />
      </FlexWrapper>

      <Breadcrumbs />
      <FlexWrapper style={{ justifyContent: 'end' }} id="header-menu-right">
        <InstallerDownloadPrompt />
        <ReleaseInstallerPrompt isAdmin={user.data.isAdmin} />
        {isDeveloper && (
          <DeveloperSwitch $isChecked={developerMode} onClick={handleDeveloperMode}>
            <span>Developer Mode</span>
            <StyledSwitch checked={developerMode} readOnly />
          </DeveloperSwitch>
        )}

        {messengerLoaded && (
          <HeaderButton
            style={{ padding: '8px 6px' }}
            onClick={() => openSupport('NewMessage')}
            variant="nav"
          >
            <SupportBubble />
          </HeaderButton>
        )}

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
        {/* App icon and menu ^^^ */}

        {/* User icon and menu vvv */}
        <HeaderButton
          className={clsx({ active: menuOpen === 'user' })}
          onClick={() => handleToggleMenu('user')}
          aria-label="User menu"
          ref={userButtonRef}
          variant="nav"
          style={{ padding: 6 }}
        >
          <UserImage size={26} name={user?.name} />
        </HeaderButton>
        <MenuContainer id="user" target={userButtonRef.current}>
          <UserMenu user={user} />
        </MenuContainer>
        {/* User icon and menu ^^^ */}
      </FlexWrapper>
    </nav>
  )
}

export default Header
