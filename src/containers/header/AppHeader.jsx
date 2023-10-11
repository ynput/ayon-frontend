import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { InputSwitch, Spacer, UserImage } from '@ynput/ayon-react-components'

import Breadcrumbs from '../Breadcrumbs/Breadcrumbs'
import HeaderButton from './HeaderButton'
import AppMenu from '../../components/Menu/Menus/AppMenu'
import ProjectMenu from '../ProjectMenu/projectMenu'
import { useDispatch, useSelector } from 'react-redux'
import InstallerDownload from '/src/components/InstallerDownload/InstallerDownload'
import { toggleMenuOpen, setMenuOpen } from '/src/features/context'
import { HelpMenu, UserMenu } from '/src/components/Menu'
import MenuContainer from '/src/components/Menu/MenuComponents/MenuContainer'
import { useUpdateUserMutation } from '/src/services/user/updateUser'
import { toast } from 'react-toastify'
import { onProfileUpdate } from '/src/features/user'
import styled from 'styled-components'

const DeveloperSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
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
      await updateUser({
        name: user.name,
        patch: {
          attrib: { developerMode: !developerMode },
        },
      }).unwrap()

      // update redux state with new data
      dispatch(onProfileUpdate({ developerMode: !developerMode }))
    } catch (error) {
      console.error(error)
      toast.error('Unable to update developer mode: ' + error.details)
    }
  }

  return (
    <nav className="primary" onClick={handleNavClick}>
      <HeaderButton
        icon="event_list"
        label="Projects"
        variant="text"
        onClick={() => handleToggleMenu('project')}
        style={{
          alignItems: 'center',
          display: 'flex',
        }}
      />

      <ProjectMenu visible={menuOpen === 'project'} onHide={() => handleSetMenu(false)} />

      <Breadcrumbs />
      <Spacer />
      <InstallerDownload isSpecial />
      {isDeveloper && (
        <DeveloperSwitch $isChecked={developerMode} onClick={handleDeveloperMode}>
          <span>Developer Mode</span>
          <StyledSwitch checked={developerMode} readOnly />
        </DeveloperSwitch>
      )}
      <HeaderButton
        icon="help"
        ref={helpButtonRef}
        onClick={() => handleToggleMenu('help')}
        active={menuOpen === 'help'}
        variant="text"
      />
      <MenuContainer id="help" target={helpButtonRef.current}>
        <HelpMenu user={user} />
      </MenuContainer>
      <HeaderButton
        active={menuOpen === 'user'}
        onClick={() => handleToggleMenu('user')}
        ref={userButtonRef}
        variant="text"
      >
        <UserImage
          size={26}
          src={user?.attrib?.avatarUrl}
          fullName={user?.attrib?.fullName || user?.name}
        />
      </HeaderButton>
      <MenuContainer id="user" target={userButtonRef.current}>
        <UserMenu user={user} />
      </MenuContainer>
      <HeaderButton
        icon="apps"
        onClick={() => handleToggleMenu('app')}
        ref={appButtonRef}
        active={menuOpen === 'app'}
        variant="text"
      />
      <MenuContainer id="app" target={appButtonRef.current}>
        <AppMenu user={user} />
      </MenuContainer>
    </nav>
  )
}

export default Header
