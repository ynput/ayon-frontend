import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import UserImage from '@components/UserImage'

import './users.scss'

import { useMemo } from 'react'
import styled from 'styled-components'
import useCreateContext from '@hooks/useCreateContext'

const StyledProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
`

export const ProfileRow = ({ rowData }) => {
  const { name, self, isMissing } = rowData
  return (
    <StyledProfileRow>
      <UserImage
        name={name}
        size={25}
        style={{
          transform: 'scale(0.8)',
          minHeight: 25,
          minWidth: 25,
          maxHeight: 25,
          maxWidth: 25,
        }}
        highlight={self}
      />
      <span
        style={{
          color: isMissing ? 'var(--color-hl-error)' : 'inherit',
        }}
      >
        {name}
      </span>
    </StyledProfileRow>
  )
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
  onSelectUsers,
  isSelfSelected,
}) => {
  // Selection
  const selection = useMemo(() => {
    return userList.filter((user) => selectedUsers.includes(user.name))
  }, [selectedUsers, selectedProjects, userList])

  const onContextMenu = (e) => {
    let newSelectedUsers = [...selectedUsers]
    if (!selectedUsers.includes(e.data.name)) {
      newSelectedUsers = [e.data.name]
    }
    onSelectUsers(newSelectedUsers)
    ctxMenuShow(e.originalEvent, ctxMenuItems(newSelectedUsers))
  }

  const onSelectionChange = (e) => {
    if (!onSelectUsers) return
    let result = []
    for (const user of e.value) result.push(user.name)
    onSelectUsers(result)
  }

  // IDEA: Can these go into the details panel as well?
  const ctxMenuItems = (newSelectedUsers) => {
    return [
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
        command: () => onDelete(newSelectedUsers),
        icon: 'delete',
        danger: true,
      },
    ]
  }

  const [ctxMenuShow] = useCreateContext()

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
          rowClassName={(rowData) => ({'inactive' : !rowData.active})}
          onSelectionChange={onSelectionChange}
          onContextMenu={onContextMenu}
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
            body={(rowData) => <ProfileRow rowData={rowData} />}
            resizeable
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
