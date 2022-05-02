import { useRef, useState, useEffect } from 'react'
import { useNavigate } from "react-router-dom";
import { Button, Spacer } from '../../components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import {Sidebar} from 'primereact/sidebar'
import axios from 'axios'

import Breadcrumbs from './breadcrumbs'
import UserMenu from './userMenu'


const SidebarMenu = ({visible, onHide}) => {
  const navigate = useNavigate()
  const [projectList, setProjectList] = useState([])

  useEffect(() => {
    axios
      .get('/api/projects')
      .then((response) => {
        setProjectList(response.data.projects || [])
      })
      .catch(() => {
        console.error.error('Unable to load projects')
      })
  }, [])

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
      <div style={{ flexGrow: 1}}>
          <DataTable
            value={projectList}
            scrollable
            scrollHeight="flex"
            selectionMode="single"
            responsive="true"
            dataKey="name"
            onSelectionChange={(e) => {
              navigate(`/projects/${e.value.name}/browser`)
              onHide()
            }}
          >
            <Column field="name" header="Name" />
          </DataTable>
    </div>

    <Button 
      label="Project manager"
      style={{ marginTop: 40}}
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
