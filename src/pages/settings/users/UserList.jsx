import { useMemo, useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import './users.sass'
import useColumnResize from '/src/hooks/useColumnResize'
import UserImage from './UserImage'

const UserList = ({
  selectedProjects,
  selectedUsers,
  setSelectedUsers,
  userList,
  tableList,
  setShowRenameUser,
  setShowSetPassword,
  onDelete,
  isLoading,
  isLoadingRoles,
}) => {
  const contextMenuRef = useRef(null)

  // COLUMN WIDTH
  const [columnsWidths, setColumnWidths] = useColumnResize('users')

  // Selection

  const selection = useMemo(() => {
    let result = []
    for (const user of userList) {
      if (selectedUsers.includes(user.name)) result.push(user)
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
    <Section className="wrap">
      <TablePanel loading={isLoading || isLoadingRoles}>
        <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
        <div style={{ overflow: 'scroll', width: 'auto', height: '100%' }}>
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
            }}
            selection={selection}
            columnResizeMode="expand"
            resizableColumns
            onColumnResizeEnd={setColumnWidths}
            responsive="true"
            stateKey="users-datatable"
            stateStorage={'local'}
            reorderableColumns
          >
            <Column
              field="profile"
              body={(col) => (
                <UserImage
                  fullName={col.attrib.fullName || col.name}
                  size={25}
                  style={{ margin: 'auto', padding: 5, transform: 'scale(0.8)' }}
                />
              )}
              resizeable
            />
            <Column
              field="name"
              header="Username"
              sortable

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
        </div>
      </TablePanel>
    </Section>
  )
}

export default UserList
