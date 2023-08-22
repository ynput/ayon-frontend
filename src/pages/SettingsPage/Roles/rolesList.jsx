import { useState, useMemo } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { Button, TablePanel, Section, Toolbar } from '@ynput/ayon-react-components'
import { useGetRolesQuery } from '../../../services/roles/getRoles'
import NewRole from './NewRole'

const RolesList = ({ projectName, selectedRole, onSelectRole }) => {
  const [showNewRole, setShowNewRole] = useState(false)

  // Load user list
  const { data: rolesList = [], isLoading: loading } = useGetRolesQuery({ projectName })

  // Selection
  const selection = useMemo(() => {
    for (const role of rolesList) {
      if (role.name === selectedRole?.name) return role
    }
  }, [selectedRole, rolesList])

  const onSelectionChange = (e) => {
    if (!onSelectRole) return
    onSelectRole({
      name: e.value.name,
      isProjectLevel: e.value.isProjectLevel,
    })
  }

  // FIXME: this doesn't update when role details updates
  const getRowClass = (rowData) => {
    return { 'changed-project': rowData.isProjectLevel }
  }

  // Render

  return (
    <Section style={{ maxWidth: 400 }}>
      {showNewRole && <NewRole onClose={() => setShowNewRole(false)} rolesList={rolesList} />}

      <Toolbar>
        <Button label="New role" onClick={() => setShowNewRole(true)} icon="group_add" />
      </Toolbar>

      <TablePanel loading={loading}>
        <DataTable
          value={rolesList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="single"
          selection={selection}
          onSelectionChange={onSelectionChange}
          rowClassName={getRowClass}
        >
          <Column field="name" header="Role name" />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default RolesList
