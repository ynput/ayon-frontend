import { useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { TablePanel, Section, UserImage } from '@ynput/ayon-react-components'
import './users.scss'

import { useMemo } from 'react'
import styled from 'styled-components'

const StyledProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`

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
  onSelectUsers,
  isSelfSelected,
  setLastSelectedUser,
}) => {
  const contextMenuRef = useRef(null)

  // Selection
  const selection = useMemo(
    () => userList.filter((user) => selectedUsers.includes(user.name)),
    [selectedUsers, selectedProjects, userList],
  )

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

  const ProfileRow = ({ rowData }) => (
    <StyledProfileRow>
      <UserImage
        fullName={rowData.attrib.fullName || rowData.name}
        size={25}
        style={{ margin: 'auto', transform: 'scale(0.8)', maxHeight: 25, maxWidth: 25 }}
        highlight={rowData.self}
        src={rowData.attrib.avatarUrl}
      />
      <span>{rowData.self ? `${rowData.name} (me)` : rowData.name}</span>
    </StyledProfileRow>
  )

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
            setLastSelectedUser(e.data.name)
          }}
          selection={selection}
          columnResizeMode="expand"
          resizableColumns
          responsive="true"
          stateKey="users-datatable"
          stateStorage={'local'}
          reorderableColumns
          onRowClick={(e) => {
            setLastSelectedUser(e.data.name)
          }}
        >
          <Column
            field="name"
            header="Username"
            sortable
            body={(rowData) => ProfileRow({ rowData })}
            resizeable
            style={{ width: 150 }}
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
