import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Button, TableWrapper } from '../../components'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Sidebar } from 'primereact/sidebar'

import axios from 'axios'

const ProjectMenu = ({ visible, onHide }) => {
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

  return (
    <Sidebar
      position="left"
      visible={visible}
      onHide={onHide}
      icons={() => <h3>Project menu</h3>}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          width: '100%',
          height: '100%',
        }}
      >
        <TableWrapper>
          <DataTable
            value={projectList}
            scrollable="true"
            scrollHeight="flex"
            selectionMode="single"
            responsive="true"
            dataKey="name"
            onSelectionChange={(e) => {
              navigate(`/projects/${e.value.name}/browser`)
              onHide()
            }}
          >
            <Column field="name" header="Project name" />
          </DataTable>
        </TableWrapper>

        <Button
          icon="pi pi-cog"
          label="Project manager"
          style={{ marginTop: 10 }}
          onClick={() => {
            navigate('/projects')
            onHide()
          }}
        />
      </div>
    </Sidebar>
  )
}

export default ProjectMenu
