import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Spacer, UserImage } from '@ynput/ayon-react-components'

import Breadcrumbs from './breadcrumbs'
import HeaderButton from './HeaderButton'
import UserMenu from './userMenu'
import ProjectMenu from './projectMenu'
import { useSelector } from 'react-redux'
import InstallerDownload from '/src/components/InstallerDownload/InstallerDownload'

const Header = () => {
  const [projectMenuVisible, setProjectMenuVisible] = useState(false)
  const [userMenuVisible, setUserMenuVisible] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  // get user from redux store
  const user = useSelector((state) => state.user)

  // Hide sidebars when location changes
  useEffect(() => {
    setProjectMenuVisible(false)
    setUserMenuVisible(false)
  }, [location.pathname])

  // if last path in pathname is 'userMenu' then open userMenu
  useEffect(() => {
    if (location.pathname.split('/').pop() === 'userMenu') {
      // parse query params from current URL
      const searchParams = new URLSearchParams(location.search)

      // set localStorage to true
      localStorage.setItem('userMenuVisible', true)
      // then remove 'userMenu' from pathname
      const newPathname = location.pathname.replace('/userMenu', '')

      // append query params to new URL
      const newUrl = `${newPathname}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`
      navigate(newUrl, { replace: true })
    } else if (localStorage.getItem('userMenuVisible') === 'true') {
      setUserMenuVisible(true)
      // delete
      localStorage.removeItem('userMenuVisible')
    }
  }, [location.pathname, localStorage])

  return (
    <nav className="primary">
      <ProjectMenu visible={projectMenuVisible} onHide={() => setProjectMenuVisible(false)} />
      <UserMenu visible={userMenuVisible} onHide={() => setUserMenuVisible(false)} />

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
      <HeaderButton icon="apps" onClick={() => setUserMenuVisible(true)} />
    </nav>
  )
}

export default Header
