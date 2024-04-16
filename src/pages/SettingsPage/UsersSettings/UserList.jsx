import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import UserImage from '/src/components/UserImage'

import './users.scss'

import { useMemo } from 'react'
import styled from 'styled-components'
import useCreateContext from '/src/hooks/useCreateContext'

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
  onSelectUsers,
  isSelfSelected,
}) => {
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
  const ctxMenuTableItems = useMemo(
    () => [
      {
        label: 'Set username',
        disabled: selection.length !== 1,
        command: () => setShowRenameUser(true),
        icon: 'edit',
      },
      {
        label: 'Set password',
        disabled: selection.length !== 1,
        command: () => setShowSetPassword(true),
        icon: 'key',
      },
      {
        label: 'Delete selected',
        disabled: !selection.length || isSelfSelected,
        command: () => onDelete(),
        icon: 'delete',
        danger: true,
      },
    ],
    [selection, isSelfSelected, setShowRenameUser, setShowSetPassword, onDelete],
  )

  const [ctxMenuTableShow] = useCreateContext(ctxMenuTableItems)

  const ProfileRow = ({ rowData }) => {
    const { name, self } = rowData
    return (
      <StyledProfileRow>
        <UserImage
          name={name}
          size={25}
          style={{ margin: 'auto', transform: 'scale(0.8)', maxHeight: 25, maxWidth: 25 }}
          highlight={self}
        />
        <span>{self ? `${name} (me)` : name}</span>
      </StyledProfileRow>
    )
  }

  // create 10 dummy rows
  const loadingData = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      key: i,
      data: {},
    }))
  }, [])

  if (isLoading) {
    tableList = loadingData
  }
  // Render

  return (
    <Section wrap>
      <TablePanel>
        <DataTable
          value={tableList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={`user-list-table ${isLoading ? 'table-loading' : ''}`}
          onSelectionChange={onSelectionChange}
          onContextMenu={(e) => ctxMenuTableShow(e.originalEvent)}
          onContextMenuSelectionChange={(e) => {
            if (!selectedUsers.includes(e.value.name)) {
              onSelectUsers([...selection, e.value.name])
            }
          }}
          selection={selection}
          columnResizeMode="expand"
          resizableColumns
          responsive="true"
          stateKey="users-datatable"
          stateStorage={'local'}
          reorderableColumns
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
            field={'accessGroupList'}
            header="Project access"
            body={(rowData) =>
              rowData &&
              rowData.accessGroups &&
              [...Object.keys(rowData.accessGroups)]
                .sort((a, b) => a.localeCompare(b))
                .map((agName, i, arr) => (
                  <span key={agName} className={rowData.accessGroups[agName].cls}>
                    {agName}
                    {i < arr.length - 1 ? ', ' : ''}
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
