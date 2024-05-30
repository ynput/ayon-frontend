import { useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Spacer, InputSwitch } from '@ynput/ayon-react-components'
import UserImage from '/src/components/UserImage'

import Breadcrumbs from '../Breadcrumbs/Breadcrumbs'
import HeaderButton from './HeaderButton'
import AppMenu from '../../components/Menu/Menus/AppMenu'
import ProjectMenu from '../ProjectMenu/projectMenu'
import { useDispatch, useSelector } from 'react-redux'
import InstallerDownloadPrompt from '../../components/InstallerDownload/InstallerDownloadPrompt'
import { toggleMenuOpen, setMenuOpen } from '/src/features/context'
import { HelpMenu, UserMenu } from '/src/components/Menu'
import MenuContainer from '/src/components/Menu/MenuComponents/MenuContainer'
import { useUpdateUserMutation } from '/src/services/user/updateUser'
import { toast } from 'react-toastify'
import { toggleDevMode } from '/src/features/user'
import styled from 'styled-components'
import { useRestart } from '/src/context/restartContext'
import { classNames } from 'primereact/utils'
import { useGetInboxHasUnreadQuery } from '/src/services/inbox/getInbox'

const DeveloperSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-small);
  border-radius: var(--border-radius-l);
  padding: 4px 4px 4px 8px;
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
  const dispatch = useDispatch()
  const menuOpen = useSelector((state) => state.context.menuOpen)
  const handleToggleMenu = (menu) => dispatch(toggleMenuOpen(menu))
  const handleSetMenu = (menu) => dispatch(setMenuOpen(menu))
  const location = useLocation()
  const navigate = useNavigate()
  // get user from redux store
  const user = useSelector((state) => state.user)

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

  const { data: isNewMessages, refetch } = useGetInboxHasUnreadQuery()

  useEffect(() => {
    refetch() // Check messages immediately on location change

    const interval = setInterval(refetch, 600000) // Check messages every 10 minutes

    const timeout = setTimeout(() => {
      refetch() // Check messages after 10 minutes, even if the location hasn't changed
    }, 600000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [location.pathname])

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

  return (
    <nav className="primary" onClick={handleNavClick}>
      <Link to={'/dashboard/tasks'}>
        <HeaderButton
          icon="home"
          label="Home"
          variant="nav"
          className={classNames({ selected: location.pathname.startsWith('/dashboard') })}
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

      <Breadcrumbs />
      <Spacer />
      <InstallerDownloadPrompt />
      {isDeveloper && (
        <DeveloperSwitch $isChecked={developerMode} onClick={handleDeveloperMode}>
          <span>Developer Mode</span>
          <StyledSwitch checked={developerMode} readOnly />
        </DeveloperSwitch>
      )}

      {/* help icon and menu vvv */}
      <HeaderButton
        icon="help"
        ref={helpButtonRef}
        onClick={() => handleToggleMenu('help')}
        className={classNames({ active: menuOpen === 'help' })}
        variant="nav"
      />
      <MenuContainer id="help" target={helpButtonRef.current}>
        <HelpMenu user={user} />
      </MenuContainer>
      {/* help icon and menu ^^^ */}

      {/* Inbox icon */}
      <Link to="/inbox/important">
        <HeaderButton
          icon="inbox"
          variant="nav"
          className={classNames({ notification: isNewMessages })}
        />
      </Link>

      {/* App icon and menu vvv */}
      <HeaderButton
        icon="apps"
        onClick={() => handleToggleMenu('app')}
        ref={appButtonRef}
        variant="nav"
        className={classNames({ active: menuOpen === 'app', notification: isSnoozing })}
      />
      <MenuContainer id="app" target={appButtonRef.current}>
        <AppMenu user={user} />
      </MenuContainer>
      {/* App icon and menu ^^^ */}

      {/* User icon and menu vvv */}
      <HeaderButton
        className={classNames({ active: menuOpen === 'user' })}
        onClick={() => handleToggleMenu('user')}
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
    </nav>
  )
}

export default Header
