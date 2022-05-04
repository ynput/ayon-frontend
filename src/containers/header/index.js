import { useRef, useState } from 'react'
import { Button, Spacer } from '../../components'

import Breadcrumbs from './breadcrumbs'
import UserMenu from './userMenu'
import SidebarMenu from './sidebar'

const Header = () => {
  const menuRef = useRef()
  const [sidebarVisible, setSidebarVisible] = useState(false)

  return (
    <nav className="primary">
      <SidebarMenu
        visible={sidebarVisible}
        onHide={() => setSidebarVisible(false)}
      />
      <Button
        icon="pi pi-bars"
        className="p-button-link"
        onClick={() => setSidebarVisible(true)}
      />

      <Spacer>
        <Breadcrumbs />
      </Spacer>

      <UserMenu menuRef={menuRef} />

      <Button
        className="p-button-link"
        icon="pi pi-user"
        onClick={(event) => menuRef.current.toggle(event)}
      />
    </nav>
  )
}

export default Header
