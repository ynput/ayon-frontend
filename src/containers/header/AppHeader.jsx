import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { UserImage } from '@ynput/ayon-react-components'

import Breadcrumbs from './breadcrumbs'
import HeaderButton from './HeaderButton'
import AppMenu from '../../components/Menu/Menus/AppMenu'
import ProjectMenu from './projectMenu'
import { useDispatch, useSelector } from 'react-redux'
import InstallerDownload from '/src/components/InstallerDownload/InstallerDownload'
import { toggleMenuOpen, setMenuOpen } from '/src/features/context'
import { HelpMenu, UserMenu } from '/src/components/Menu'
import MenuContainer from '/src/components/Menu/MenuComponents/MenuContainer'

const Header = () => {
  const dispatch = useDispatch()
  const menuOpen = useSelector((state) => state.context.menuOpen)
  const handleToggleMenu = (menu) => dispatch(toggleMenuOpen(menu))
  const handleSetMenu = (menu) => dispatch(setMenuOpen(menu))
  const location = useLocation()
  const navigate = useNavigate()
  // get user from redux store
  const user = useSelector((state) => state.user)

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

  return (
    <nav className="primary" onClick={handleNavClick}>
      <ProjectMenu visible={menuOpen === 'project'} onHide={() => handleSetMenu(false)} />

      <HeaderButton
        icon="event_list"
        label="Projects"
        onClick={() => handleToggleMenu('project')}
        style={{
          alignItems: 'center',
          display: 'flex',
        }}
      />

      <Breadcrumbs />

      <InstallerDownload isSpecial />
      <HeaderButton
        icon="help"
        ref={helpButtonRef}
        onClick={() => handleToggleMenu('help')}
        active={menuOpen === 'help'}
      />
      <MenuContainer id="help" target={helpButtonRef.current}>
        <HelpMenu user={user} />
      </MenuContainer>
      <HeaderButton
        active={menuOpen === 'user'}
        onClick={() => handleToggleMenu('user')}
        ref={userButtonRef}
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
      />
      <MenuContainer id="app" target={appButtonRef.current}>
        <AppMenu user={user} />
      </MenuContainer>
    </nav>
  )
}

export default Header
