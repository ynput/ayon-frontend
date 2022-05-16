import { useState } from 'react'
import { LinkButton, Spacer } from '../../components'

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

      <LinkButton icon="menu" onClick={() => setProjectMenuVisible(true)} />

      <Spacer>
        <Breadcrumbs />
      </Spacer>

      <LinkButton icon="person" onClick={() => setUserMenuVisible(true)} />
    </nav>
  )
}

export default Header
