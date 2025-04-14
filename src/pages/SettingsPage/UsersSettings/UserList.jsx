import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import UserImage from '@components/UserImage'

import './users.scss'

import { useMemo } from 'react'
import styled from 'styled-components'
import useCreateContextMenu from '@shared/ContextMenu/useCreateContextMenu'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { useGetUserPoolsQuery } from '@queries/auth/getAuth'
import { accessGroupsSortFunction, userPoolSortFunction } from './tableSorting'

const StyledProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
`

const StyledLicenseRow = styled.div`
  &.invalid {
    color: var(--md-sys-color-error);
  }
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

const getUserRole = (user) => {
  if (user.isAdmin) return 'Admin'
  if (user.isService) return 'Service'
  if (user.isManager) return 'Manager'
  return 'User'
}

const UserList = ({
  selectedProjects,
  selectedUsers,
  userList,
  tableList,
  setShowRenameUser,
  setShowDeleteUser,
  setShowSetPassword,
  isLoading,
  onSelectUsers,
  isSelfSelected,
}) => {
  // GET LICENSE USER POOLS
  const { data: userPools = [] } = useGetUserPoolsQuery()

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
        command: () => setShowDeleteUser(newSelectedUsers),
        icon: 'delete',
        danger: true,
      },
    ]
  }

  const [ctxMenuShow] = useCreateContextMenu()

  const tableData = useTableLoadingData(tableList, isLoading, 40, 'name')

  const findUserPool = (poolId) => userPools.find((p) => p.id === poolId)

  // Render
  return (
    <Section wrap>
      <TablePanel>
        <DataTable
          value={tableData}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={clsx('user-list-table', { loading: isLoading })}
          rowClassName={(rowData) => clsx({ inactive: !rowData.active, loading: isLoading })}
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
            body={(rowData) => !isLoading && <ProfileRow rowData={rowData} />}
            resizeable
          />
          <Column field="attrib.fullName" header="Full name" sortable resizeable />
          <Column field="attrib.email" header="Email" sortable />
          {!!userPools.length && (
            <Column
              field="userPool"
              header="License"
              body={(rowData) => {
                const pool = findUserPool(rowData.userPool)
                return (
                  <StyledLicenseRow className={clsx({ invalid: rowData.userPool && !pool })}>
                    {rowData.userPool ? pool?.label || 'Invalid' : ''}
                  </StyledLicenseRow>
                )
              }}
              sortable
              sortFunction={(event) => userPoolSortFunction(event, userPools)}
              resizeable
            />
          )}
          <Column
            field={'accessLevel'}
            header="Access level"
            body={(rowData) => getUserRole(rowData)}
            sortFunction={accessGroupsSortFunction}
            sortable
            resizeable
          />
          <Column
            field="defaultAccessGroups"
            header="Default projects access"
            sortable
            resizeable
            body={(rowData) => rowData.defaultAccessGroups?.join(', ')}
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
