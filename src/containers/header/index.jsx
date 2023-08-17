import { useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Spacer, UserImage } from '@ynput/ayon-react-components'

import Breadcrumbs from './breadcrumbs'
import HeaderButton from './HeaderButton'
import AppMenu from './appMenu'
import ProjectMenu from './projectMenu'
import { useDispatch, useSelector } from 'react-redux'
import InstallerDownload from '/src/components/InstallerDownload/InstallerDownload'
import { setMenuOpen as setMenuOpenAction } from '/src/features/context'
import { HelpMenu } from '/src/components/Menu'

const Header = () => {
  const dispatch = useDispatch()
  const menuOpen = useSelector((state) => state.context.menuOpen)
  const setMenuOpen = (menu) => dispatch(setMenuOpenAction(menu))
  const location = useLocation()
  const navigate = useNavigate()
  // get user from redux store
  const user = useSelector((state) => state.user)

  // BUTTON REFS used to attach menu to buttons
  const helpButtonRef = useRef(null)
  const profileButtonRef = useRef(null)

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
      setMenuOpen('app')
      // delete
      localStorage.removeItem('appMenuOpen')
    }
  }, [location.pathname, localStorage])

  const closeMenu = () => setMenuOpen(false)

  return (
    <nav className="primary">
      <ProjectMenu visible={menuOpen === 'project'} onHide={closeMenu} />
      <AppMenu visible={menuOpen === 'app'} onHide={closeMenu} />

      <HeaderButton
        icon="event_list"
        label="Projects"
        onClick={() => setMenuOpen('project')}
        style={{
          alignItems: 'center',
          display: 'flex',
        }}
      />

      <Spacer>
        <Breadcrumbs />
      </Spacer>

      <InstallerDownload isSpecial />
      <HeaderButton
        icon="help"
        ref={helpButtonRef}
        onClick={() => setMenuOpen('help')}
        active={menuOpen === 'help'}
      />
      <HelpMenu target={helpButtonRef.current} />
      <HeaderButton
        active={menuOpen === 'user'}
        onClick={() => setMenuOpen('help')}
        ref={profileButtonRef}
      >
        <UserImage
          size={26}
          src={user?.attrib?.avatarUrl}
          fullName={user?.attrib?.fullName || user?.name}
        />
      </HeaderButton>
      <HeaderButton icon="apps" onClick={() => setMenuOpen('app')} />
    </nav>
  )
}

export default Header
