import { useState, useMemo, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import './users.sass'

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

const UserList = ({
  selectedProjects,
  selectedUsers,
  setSelectedUsers,
  setUserDetailData,
  rolesList,
  userList,
  tableList,
  setShowRenameUser,
  setShowSetPassword,
  onDelete,
  isLoading,
  isLoadingRoles,
}) => {
  const [lastSelectedUser, setLastSelectedUser] = useState(null)
  const contextMenuRef = useRef(null)

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
  }, [selectedUsers, selectedProjects])

  const onSelectionChange = (e) => {
    if (!setSelectedUsers) return
    let result = []
    for (const user of e.value) result.push(user.name)
    setSelectedUsers(result)
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

  // Render

  return (
    <Section>
      <TablePanel loading={isLoading || isLoadingRoles}>
        <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
        <DataTable
          value={tableList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          onSelectionChange={onSelectionChange}
          onContextMenu={(e) => contextMenuRef.current.show(e.originalEvent)}
          onContextMenuSelectionChange={(e) => {
            if (!selectedUsers.includes(e.value.name)) {
              setSelectedUsers([...selection, e.value.name])
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
