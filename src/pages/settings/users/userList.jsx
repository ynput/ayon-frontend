import { useState, useEffect, useMemo, useRef } from 'react'
import { toast } from 'react-toastify'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { confirmDialog, ConfirmDialog } from 'primereact/confirmdialog'
import { TablePanel, Button, Section, Toolbar, InputText } from '@ynput/ayon-react-components'
// Comps
import NewUserDialog from './newUserDialog'
import SetPasswordDialog from './SetPasswordDialog'
import RenameUserDialog from './RenameUserDialog'
// utils
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
          isService
          isGuest
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
  if (lastSelectedUser) {
    if (!projectNames) roleSet = lastSelectedUser.defaultRoles || []
    else {
      const uroles = JSON.parse(lastSelectedUser.roles) || []
      for (const projectName of projectNames || []) {
        roleSet = [...roleSet, ...(uroles[projectName] || [])]
      }
    }
  }

  for (const roleName of roleNames)
    roles.push({
      name: roleName,
      shouldSelect: roleSet.includes(roleName),
    })

  let userLevel = 'user'
  if (lastSelectedUser?.isAdmin) userLevel = 'admin'
  else if (lastSelectedUser?.isService) userLevel = 'service'
  else if (lastSelectedUser?.isManager) userLevel = 'manager'

  return {
    users,
    projectNames,
    roles,
    userLevel,
    userActive: lastSelectedUser?.active,
    isGuest: lastSelectedUser?.isGuest,
  }
}

// TODO: Remove classname assignments and do in styled components
const formatRoles = (rowData, selectedProjects) => {
  let res = {}
  if (rowData.isAdmin) res.admin = { cls: 'role admin' }
  else if (rowData.isService) res.service = { cls: 'role manager' }
  else if (rowData.isManager) res.manager = { cls: 'role manager' }
  else if (!selectedProjects) {
    for (const name of rowData.defaultRoles || []) res[name] = { cls: 'role default' }
  } else {
    const roleSet = JSON.parse(rowData.roles)
    for (const projectName of selectedProjects) {
      for (const roleName of roleSet[projectName] || []) {
        if (roleName in res) res[roleName].count += 1
        else res[roleName] = { count: 1 }
        res[roleName].cls =
          res[roleName].count === selectedProjects.length ? 'role all' : 'role partial'
      }
    }
  }

  return { ...rowData, roles: res, rolesList: Object.keys(res) }
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
  const [showRenameUser, setShowRenameUser] = useState(false)
  const [showSetPassword, setShowSetPassword] = useState(false)
  const [rowsFilterSearch, setRowsFilterSearch] = useState('')
  const contextMenuRef = useRef(null)

  // TODO RTK QUERY
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

  // TODO RTK QUERY
  // loading roles
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
    let lastUsr = null
    for (const user of userList) {
      if (selectedUsers.includes(user.name)) result.push(user)
      if (user?.name === lastSelectedUser?.name) lastUsr = { ...user }
    }
    if (setUserDetailData) {
      setLastSelectedUser(lastUsr)

      setUserDetailData(buildUserDetailData(selectedProjects, rolesList, result, lastUsr))
    }
    return result
  }, [selectedUsers, userList, selectedProjects, reloadTrigger])

  const onSelectionChange = (e) => {
    if (!onSelectUsers) return
    let result = []
    for (const user of e.value) result.push(user.name)
    onSelectUsers(result)
  }

  // CTX

  const onDelete = async () => {
    confirmDialog({
      message: `Are you sure you want to delete ${selectedUsers.length} user(s)?`,
      header: 'Delete users',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        for (const user of selectedUsers) {
          try {
            await axios.delete(`/api/users/${user}`)
          } catch {
            toast.error(`Unable to delete user ${user}`)
          }
        }
        onTriggerReload()
      },
      reject: () => {},
    })
  }

  // IDEA: Can these go into the details panel aswell?
  const contextMenuModel = [
    {
      label: 'Rename user',
      disabled: selection.length !== 1,
      command: () => setShowRenameUser(true),
    },
    {
      label: 'Set password',
      disabled: selection.length !== 1,
      command: () => setShowSetPassword(true),
    },
    {
      label: 'Delete selected',
      disabled: !selection.length,
      command: () => onDelete(),
    },
  ]

  let userListWithRoles = useMemo(
    () => userList.map((user) => formatRoles(user, selectedProjects)),
    [userList],
  )

  const searchableFields = ['name', 'attrib.fullName', 'attrib.email', 'rolesList', 'hasPassword']

  // create keywords that are used for searching
  userListWithRoles = useMemo(
    () =>
      userListWithRoles.map((user) => ({
        ...user,
        keywords: Object.entries(user).flatMap(([k, v]) => {
          if (searchableFields.includes(k)) {
            if (typeof v === 'string') {
              return v.toLowerCase()
            } else if (Array.isArray(v)) {
              return v.flatMap((v) => v)
            } else if (typeof v === 'boolean' && v) {
              return k.toLowerCase()
            } else return []
          } else if (typeof v === 'object') {
            return Object.entries(v).flatMap(([k2, v2]) =>
              searchableFields.includes(`${k}.${k2}`) && v2 ? v2.toLowerCase() : [],
            )
          } else return []
        }),
      })),
    [userListWithRoles],
  )

  const searchTableData = useMemo(() => {
    // separate into array by ,
    const rowsFilterSearchKeywords = rowsFilterSearch.split(',').reduce((acc, cur) => {
      if (cur.trim() === '') return acc
      else {
        acc.push(cur.trim())
        return acc
      }
    }, [])

    if (rowsFilterSearchKeywords.length && userListWithRoles) {
      return userListWithRoles.filter((user) => {
        const matchingKeys = []
        user.keywords?.some((key) =>
          rowsFilterSearchKeywords.forEach((split) => {
            if (key.includes(split) && !matchingKeys.includes(split)) matchingKeys.push(split)
          }),
        )

        return matchingKeys.length >= rowsFilterSearchKeywords.length
      })
    } else return null
  }, [userListWithRoles, rowsFilterSearch])

  if (searchTableData) {
    userListWithRoles = searchTableData
  }

  // Render

  return (
    <Section>
      <ConfirmDialog />
      <Toolbar>
        <Button onClick={() => setShowNewUser(true)} label="Add a new user" icon="person_add" />
        <Button
          onClick={onDelete}
          label="Delete selected users"
          icon="person_remove"
          disabled={!selectedUsers.length}
        />
        <InputText
          style={{ width: '200px' }}
          placeholder="Filter subsets..."
          value={rowsFilterSearch}
          onChange={(e) => setRowsFilterSearch(e.target.value)}
        />
      </Toolbar>

      {showNewUser && (
        <NewUserDialog
          rolesList={rolesList}
          onHide={() => {
            setShowNewUser(false)
            onTriggerReload()
          }}
        />
      )}

      {showRenameUser && (
        <RenameUserDialog
          selectedUsers={selectedUsers}
          onHide={() => {
            setShowRenameUser(false)
            onTriggerReload()
          }}
        />
      )}

      {showSetPassword && (
        <SetPasswordDialog
          selectedUsers={selectedUsers}
          onHide={() => {
            setShowSetPassword(false)
            onTriggerReload()
          }}
        />
      )}

      <TablePanel loading={loading}>
        <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
        <DataTable
          value={userListWithRoles}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
          onContextMenu={(e) => contextMenuRef.current.show(e.originalEvent)}
          onContextMenuSelectionChange={(e) => {
            if (!selectedUsers.includes(e.value.name)) {
              onSelectUsers([...selection, e.value.name])
            }
            setLastSelectedUser(e.data)
          }}
          selection={selection}
          onRowClick={(e) => {
            setLastSelectedUser(e.data)
          }}
        >
          <Column field="name" header="Name" sortable />
          <Column field="attrib.fullName" header="Full name" sortable />
          <Column field="attrib.email" header="Email" sortable />
          <Column
            field={'rolesList'}
            header="Roles"
            body={(rowData) =>
              rowData &&
              Object.keys(rowData.roles).map((roleName) => (
                <span key={roleName} className={rowData.roles[roleName].cls}>
                  {roleName}
                </span>
              ))
            }
            sortable
          />
          <Column
            header="Has password"
            body={(rowData) => (rowData.hasPassword ? 'yes' : 'no')}
            field="hasPassword"
            sortable
          />
          <Column
            header="Guest"
            body={(rowData) => (rowData.isGuest ? 'yes' : '')}
            field="isGuest"
            sortable
          />
          <Column
            header="Active"
            body={(rowData) => (rowData.active ? 'yes' : '')}
            field="active"
            sortable
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default UserList
