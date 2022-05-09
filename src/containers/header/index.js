import { useState } from 'react'
import { Button, Spacer } from '../../components'

import Breadcrumbs from './breadcrumbs'
import UserMenu from './userMenu'
import ProjectMenu from './projectMenu'

const Header = () => {
  const [projectMenuVisible, setProjectMenuVisible] = useState(false)
  const [userMenuVisible, setUserMenuVisible] = useState(false)

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
        icon="pi pi-bars"
        className="p-button-link"
        onClick={() => setProjectMenuVisible(true)}
      />

      <Spacer>
        <Breadcrumbs />
      </Spacer>

      <Button
        className="p-button-link"
        icon="pi pi-user"
        onClick={() => setUserMenuVisible(true)}
      />
    </nav>
  )
}

export default Header
