import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, Spacer } from 'openpype-components'

import Breadcrumbs from './breadcrumbs'
import UserMenu from './userMenu'
import ProjectMenu from './projectMenu'

const Header = () => {
  const [projectMenuVisible, setProjectMenuVisible] = useState(false)
  const [userMenuVisible, setUserMenuVisible] = useState(false)
  const location = useLocation()

  // Hide sidebars when location changes
  useEffect(() => {
    setProjectMenuVisible(false)
    setUserMenuVisible(false)
  }, [location.pathname])

  return (
    <nav className="primary">
      <ProjectMenu
        visible={projectMenuVisible}
        onHide={() => setProjectMenuVisible(false)}
      />
      <UserMenu
        visible={userMenuVisible}
        onHide={() => setUserMenuVisible(false)}
      />

      <Button
        icon="dataset"
        className="transparent"
        onClick={() => setProjectMenuVisible(true)}
      />

      <Spacer>
        <Breadcrumbs />
      </Spacer>

      <Button
        icon="person"
        className="transparent"
        onClick={() => setUserMenuVisible(true)}
      />
    </nav>
  )
}

export default Header
