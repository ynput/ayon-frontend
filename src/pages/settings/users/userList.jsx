import { useState, useEffect, useMemo } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TableWrapper, Button } from '/src/components'
import NewUserDialog from './newUserDialog'
import axios from 'axios'

import './users.sass'

const USERS_QUERY = `
  query UserList {
    users {
      edges {
        node {
          name
          isAdmin
          isManager
          active
          roles
          defaultRoles
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

const buildUserDetailData = (projectNames, roleNames, users, lastSelectedUser) => {
  let roles = []
  let roleSet = []
  if (lastSelectedUser){
    if (!projectNames)
      roleSet = lastSelectedUser.defaultRoles || []
    else {
      const uroles = JSON.parse(lastSelectedUser.roles) || []
      for (const projectName of projectNames || []) {
        roleSet = [...roleSet, ...uroles[projectName] || []]
      }
    }
  }

  for (const roleName of roleNames)
    roles.push({
      name: roleName,
      shouldSelect: roleSet.includes(roleName)
    })

  let userLevel = lastSelectedUser?.isManager ? "manager" : "user"
  if (lastSelectedUser?.isAdmin) userLevel = "admin"

  return {
    users,
    projectNames,
    roles,
    userLevel,
    userActive: lastSelectedUser?.active,
  }
}

const formatRoles = (rowData, selectedProjects) => {
  let res = {}
  if (rowData.isAdmin) res.admin = { cls: 'role admin' }
  else if (rowData.isManager) res.manager = { cls: 'role manager' }
  else if (!selectedProjects) {
    for (const name of rowData.defaultRoles || [])
      res[name] = { cls: 'role default' }
  } else {
    const roleSet = JSON.parse(rowData.roles)
    for (const projectName of selectedProjects) {
      for (const roleName of roleSet[projectName] || []) {
        if (roleName in res) res[roleName].count += 1
        else res[roleName] = { count: 1 }
        res[roleName].cls =
          res[roleName].count === selectedProjects.length
            ? 'role all'
            : 'role partial'
      }
    }
  }

  return (
    <>
      {Object.keys(res).map((roleName) => (
        <span key={roleName} className={res[roleName].cls}>
          {roleName}
        </span>
      ))}
    </>
  )
}

const UserList = ({
  selectedProjects,
  selectedUsers,
  onSelectUsers,
  reloadTrigger,
  setUserDetailData,
  onTriggerReload,
}) => {
  const [userList, setUserList] = useState([])
  const [rolesList, setRolesList] = useState([])
  const [loading, setLoading] = useState(false)
  const [showNewUser, setShowNewUser] = useState(false)
  const [lastSelectedUser, setLastSelectedUser] = useState(null)

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
        let newSelection = []
        for (const user of result) {
          if (selectedUsers.includes(user.name)) newSelection.push(user.name)
        }

        onSelectUsers(newSelection)
        setUserList(result)
        setLoading(false)
      })
  }, [reloadTrigger])

  useEffect(() => {
    setLoading(true)
    let result = []
    axios
      .get('/api/roles/_')
      .then((response) => {
        for (const role of response.data) result.push(role.name)
      })
      .catch(() => {
        toast.error('Unable to load roles')
      })
      .finally(() => {
        setRolesList(result)
        setLoading(false)
      })
  }, [])

  // Selection

  const selection = useMemo(() => {
    let result = []
    for (const user of userList) {
      if (selectedUsers.includes(user.name)) result.push(user)
    }
    if (setUserDetailData) {
      setUserDetailData(
        buildUserDetailData(selectedProjects, rolesList, result, lastSelectedUser)
      )
    }
    return result
  }, [selectedUsers, userList, selectedProjects])

  const onSelectionChange = (e) => {
    if (!onSelectUsers) return
    let result = []
    for (const user of e.value) result.push(user.name)
    onSelectUsers(result)
  }

  // Render

  return (
    <section
      className="invisible"
      style={{ flexGrow: 1, padding: 0, height: '100%' }}
    >
      <section className="invisible row">
        <Button onClick={() => setShowNewUser(true)} label="New user" />
      </section>

      {showNewUser && (
        <NewUserDialog
          rolesList={rolesList}
          onHide={() => {
            setShowNewUser(false)
            onTriggerReload()
          }}
        />
      )}

      <section className="lighter" style={{ flexGrow: 1 }}>
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
            onRowClick={e => {setLastSelectedUser(e.data)}}
          >
            <Column field="name" header="Name" />
            <Column field="attrib.fullName" header="Full name" />
            <Column field="attrib.email" header="Email" />
            <Column
              header="Roles"
              body={(rowData) => formatRoles(rowData, selectedProjects)}
            />
            <Column
              header="Has password"
              body={(rowData) => (rowData.hasPassword ? 'yes' : '')}
            />
            <Column
              header="Active"
              body={(rowData) => (rowData.active ? 'yes' : '')}
            />
          </DataTable>
        </TableWrapper>
      </section>
    </section>
  )
}

export default UserList
