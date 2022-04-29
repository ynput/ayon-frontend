import { useRef, useState } from 'react'
import { useNavigate } from "react-router-dom";
import { Button, Spacer } from '../../components'

import {Sidebar} from 'primereact/sidebar'

import Breadcrumbs from './breadcrumbs'
import UserMenu from './userMenu'


const SidebarMenu = ({visible, onHide}) => {
  const navigate = useNavigate()
  return(
    <Sidebar
        position="left"
        visible={visible}
        onHide={onHide}
    >
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >

    <Button 
      label="Project manager"
      onClick={() => {
        navigate('/projects')
        onHide()
      }}
    />

    </div>
    </Sidebar>
  )
}

const Header = () => {
  const menuRef = useRef()
  const [sidebarVisible, setSidebarVisible] = useState(false)
 

  return (
    <nav id="main-header">
      <SidebarMenu
        visible={sidebarVisible} 
        onHide={() => setSidebarVisible(false)}
      />
      <Button 
        icon="pi pi-bars"
        className="p-button-link"
        onClick={(e) => setSidebarVisible(true)}
      />


      <Spacer />

      <Breadcrumbs />

      <Spacer />

      <UserMenu menuRef={menuRef}/>

      <Button
        className="p-button-link p-button-info"
        label={""}
        icon="pi pi-user"
        onClick={(event) => menuRef.current.toggle(event)}
      />
    </nav>
  )

}

export default Header
