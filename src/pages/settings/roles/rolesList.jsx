import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TableWrapper } from '/src/components'
import axios from 'axios'

const RolesList = ({
  projectName,
  selectedRole,
  onSelectRole,
  reloadTrigger,
}) => {
  const [rolesList, setRolesList] = useState([])
  const [loading, setLoading] = useState(false)

  // Load user list

  useEffect(() => {
    setLoading(true)
    let result = []
    axios
      .get(`/api/roles/${projectName || '_'}`)
      .then((response) => {
        result = response.data
      })
      .catch(() => {
        toast.error('Unable to load roles')
      })
      .finally(() => {
        setRolesList(result)
        setLoading(false)
      })
  }, [projectName, reloadTrigger])

  // Selection
  const selection = useMemo(() => {
    for (const role of rolesList) {
      if (role.name === selectedRole) return role
    }
  }, [selectedRole, rolesList])

  const onSelectionChange = (e) => {
    if (!onSelectRole) return
    onSelectRole(e.value.name)
  }

  const getRowClass = (rowData) => {
    return { 'changed-project': rowData.isProjectLevel }
  }

  // Render

  return (
    <TableWrapper>
      <DataTable
        value={rolesList}
        scrollable="true"
        scrollHeight="flex"
        dataKey="name"
        loading={loading}
        selectionMode="single"
        selection={selection}
        onSelectionChange={onSelectionChange}
        rowClassName={getRowClass}
      >
        <Column field="name" header="Role name" />
      </DataTable>
    </TableWrapper>
  )
}

export default RolesList
