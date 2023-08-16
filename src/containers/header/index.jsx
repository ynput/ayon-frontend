import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Spacer, UserImage } from '@ynput/ayon-react-components'

import Breadcrumbs from './breadcrumbs'
import HeaderButton from './HeaderButton'
import AppMenu from './appMenu'
import ProjectMenu from './projectMenu'
import { useSelector } from 'react-redux'
import InstallerDownload from '/src/components/InstallerDownload/InstallerDownload'

const Header = () => {
  const [projectMenuVisible, setProjectMenuVisible] = useState(false)
  const [appMenuOpen, setAppMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  // get user from redux store
  const user = useSelector((state) => state.user)

  // Hide sidebars when location changes
  useEffect(() => {
    setProjectMenuVisible(false)
    setAppMenuOpen(false)
  }, [location.pathname])

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
      setAppMenuOpen(true)
      // delete
      localStorage.removeItem('appMenuOpen')
    }
  }, [location.pathname, localStorage])

  return (
    <nav className="primary">
      <ProjectMenu visible={projectMenuVisible} onHide={() => setProjectMenuVisible(false)} />
      <AppMenu visible={appMenuOpen} onHide={() => setAppMenuOpen(false)} />

      <HeaderButton
        icon="event_list"
        label="Projects"
        onClick={() => setProjectMenuVisible(true)}
        style={{
          alignItems: 'center',
          display: 'flex',
        }}
      />

      <Spacer>
        <Breadcrumbs />
      </Spacer>

      <InstallerDownload isSpecial />

      <Link to="/profile">
        <HeaderButton>
          <UserImage
            size={26}
            src={user?.attrib?.avatarUrl}
            fullName={user?.attrib?.fullName || user?.name}
          />
        </HeaderButton>
      </Link>
      <HeaderButton icon="apps" onClick={() => setAppMenuOpen(true)} />
    </nav>
  )
}

export default Header
