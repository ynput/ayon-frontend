import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TableWrapper } from '/src/components'
import axios from 'axios'

const USERS_QUERY = `
  query UserList {
    users {
      edges {
        node {
          name
          isAdmin
          isManager
          roles
          hasPassword
          attrib {
            fullName
            email
          }
        }
      }
    }
  }
`

const formatRoles = (rowData, projectName) => {
  if (rowData.isAdmin) return 'admin'
  if (rowData.isManager) return 'manager'
  let result = []
  const roles = JSON.parse(rowData.roles)
  for (const role in roles) {
    if (!projectName) result.push(role)
    else if (roles[role] === 'all') result.push(role)
    else if (Array.isArray(roles[role]) && roles[role].includes(projectName))
      result.push(role)
  }
  return result.join(', ')
}

const UserList = ({ projectName, selectedUsers, onSelectUsers, reloadTrigger }) => {
  const [userList, setUserList] = useState([])
  const [loading, setLoading] = useState(false)

  // Load user list

  useEffect(() => {
    setLoading(true)
    let result = []
    axios
      .post('/graphql', {
        query: USERS_QUERY,
        variables: {},
      })
      .then((response) => {
        const edges = response?.data?.data?.users.edges
        if (!edges) return
        for (const edge of edges) result.push(edge.node)
      })
      .catch(() => {
        toast.error('Unable to load users')
      })
      .finally(() => {
        setUserList(result)
        setLoading(false)
      })
  }, [reloadTrigger])

  // Selection

  const selection = useMemo(() => {
    let result = []
    for (const user of userList) {
      if (selectedUsers.includes(user.name)) 
        result.push(user)
    }
    return result
  }, [selectedUsers, userList])

  const onSelectionChange = (e) => {
    if (!onSelectUsers) return
    let result = []
    for (const user of e.value) result.push(user.name)
    onSelectUsers(result)
  }

  // Render

  return (
    <TableWrapper>
      <DataTable
        value={userList}
        scrollable="true"
        scrollHeight="flex"
        dataKey="name"
        loading={loading}
        selectionMode="multiple"
        onSelectionChange={onSelectionChange}
        selection={selection}
      > 
        <Column field="name" header="Name" />
        <Column field="attrib.fullName" header="Full name" />
        <Column
          header="Roles"
          body={(rowData) => formatRoles(rowData, projectName)}
        />
        <Column
          header="Has password"
          body={(rowData) => (rowData.hasPassword ? 'yes' : '')}
        />
      </DataTable>
    </TableWrapper>
  )
}

export default UserList
