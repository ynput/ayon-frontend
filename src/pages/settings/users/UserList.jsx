import { useMemo, useRef, useState } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import './users.scss'
import useColumnResize from '/src/hooks/useColumnResize'
import UserImage from './UserImage'

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
    defaultRoles: lastSelectedUser?.defaultRoles,
  }
}

const UserList = ({
  selectedProjects,
  selectedUsers,
  userList,
  tableList,
  setShowRenameUser,
  setShowSetPassword,
  onDelete,
  isLoading,
  isLoadingRoles,
  setUserDetailData,
  rolesList,
  isFetching,
  onSelectUsers,
  isSelfSelected,
}) => {
  const contextMenuRef = useRef(null)

  // COLUMN WIDTH
  const [columnsWidths, setColumnWidths] = useColumnResize('users')
  const [lastSelectedUser, setLastSelectedUser] = useState(null)

  // Selection

  const selection = useMemo(() => {
    if (isFetching) return []
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
  }, [selectedUsers, userList, selectedProjects, isFetching])

  const onSelectionChange = (e) => {
    if (!onSelectUsers) return
    let result = []
    for (const user of e.value) result.push(user.name)
    onSelectUsers(result)
  }

  // IDEA: Can these go into the details panel aswell?
  const contextMenuModel = [
    {
      label: 'Set username',
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
      disabled: !selection.length || isSelfSelected,
      command: () => onDelete(),
    },
  ]

  // Render

  return (
    <Section className="wrap">
      <TablePanel loading={isLoading || isLoadingRoles}>
        <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
        <DataTable
          value={tableList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className="user-list-table"
          onSelectionChange={onSelectionChange}
          onContextMenu={(e) => contextMenuRef.current.show(e.originalEvent)}
          onContextMenuSelectionChange={(e) => {
            if (!selectedUsers.includes(e.value.name)) {
              onSelectUsers([...selection, e.value.name])
            }
            setLastSelectedUser(e.data)
          }}
          selection={selection}
          columnResizeMode="expand"
          resizableColumns
          onColumnResizeEnd={setColumnWidths}
          responsive="true"
          stateKey="users-datatable"
          stateStorage={'local'}
          reorderableColumns
          onRowClick={(e) => {
            setLastSelectedUser(e.data)
          }}
        >
          <Column
            field="profile"
            body={(col) => (
              <UserImage
                fullName={col.attrib.fullName || col.name}
                size={25}
                style={{ margin: 'auto', transform: 'scale(0.8)' }}
                highlight={col.self}
                src={col.attrib.avatarUrl}
              />
            )}
            resizeable
          />
          <Column
            field="name"
            header="Username"
            sortable
            body={(rowData) => (rowData.self ? `${rowData.name} (me)` : rowData.name)}
            // resizeable
          />
          <Column field="attrib.fullName" header="Full name" sortable resizeable />
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
            style={{ flex: `1 1 ${columnsWidths['rolesList']}px` }}
            resizeable
          />
          <Column
            header="Has password"
            body={(rowData) => (rowData.hasPassword ? 'yes' : 'no')}
            field="hasPassword"
            sortable
            resizeable
          />
          <Column
            header="Guest"
            body={(rowData) => (rowData.isGuest ? 'yes' : '')}
            field="isGuest"
            sortable
            resizeable
          />
          <Column
            header="Active"
            body={(rowData) => (rowData.active ? 'yes' : '')}
            field="active"
            sortable
            resizeable
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default UserList
