import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Spacer, UserImage } from '@ynput/ayon-react-components'

import Breadcrumbs from './breadcrumbs'
import HeaderButton from './HeaderButton'
import UserMenu from './userMenu'
import ProjectMenu from './projectMenu'
import { useDispatch, useSelector } from 'react-redux'
import { setProjectMenuOpen, setUserMenuOpen } from '/src/features/context'

const Header = () => {
  const dispatch = useDispatch()
  const location = useLocation()
  // get user from redux store
  const user = useSelector((state) => state.user)
  // user menu
  const userMenuVisible = useSelector((state) => state.context.userMenuOpen)
  const setUserMenuVisible = (open) => dispatch(setUserMenuOpen(open))

  const setProjectMenuVisible = (open) => {
    dispatch(setProjectMenuOpen(open))
  }

  // Hide sidebars when location changes
  useEffect(() => {
    setProjectMenuVisible(false)
    setUserMenuVisible(false)
  }, [location.pathname])

  return (
    <nav className="primary">
      <ProjectMenu onHide={() => setProjectMenuVisible(false)} />
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

      <Link to="/profile">
        <HeaderButton>
          <UserImage size={26} src={user?.attrib?.avatarUrl} fullName={user?.attrib?.fullName} />
        </HeaderButton>
      </Link>
      <HeaderButton icon="apps" onClick={() => setUserMenuVisible(true)} />
    </nav>
  )
}

export default Header
