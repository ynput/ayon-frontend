import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import UserImage from '@shared/components/UserImage'

import './users.scss'

import { memo, useEffect, useMemo, useReducer, useRef } from 'react'
import styled from 'styled-components'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import { useTableExportContext } from '@shared/context'
import clsx from 'clsx'
import { omit } from 'lodash'
import useTableLoadingData from '@hooks/useTableLoadingData'
import { useGetUserPoolsQuery } from '@shared/api'
import { getUserSortFunctions, USERS_TABLE_STATE_KEY } from './tableSorting'
import InvitationStatus from './InvitationStatus'
import { getInvitationState } from './InvitationStatusHelpers'

// fixed row height, needed by the virtual scroller
const ROW_HEIGHT = 33

// Save sort, column widths and order only. Left to itself the table also saves every selected user
// object, on every render, and selects them again on mount.
const saveTableState = (state) => {
  try {
    localStorage.setItem(USERS_TABLE_STATE_KEY, JSON.stringify(omit(state, 'selection')))
  } catch {
    // storage full or blocked: the table works without it
  }
}

const restoreTableState = () => {
  try {
    return omit(JSON.parse(localStorage.getItem(USERS_TABLE_STATE_KEY) || '{}'), 'selection')
  } catch {
    return {}
  }
}

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
  const { name, self, isMissing, missingReason } = rowData
  return (
    <StyledProfileRow data-tooltip={missingReason}>
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
  setShowInviteUser,
  isLoading,
  onSelectUsers,
  selfName,
  managerDisabled,
}) => {
  // GET LICENSE USER POOLS
  const { data: userPools = [] } = useGetUserPoolsQuery()
  const sortFunctions = getUserSortFunctions(userPools)
  const tableExport = useTableExportContext()

  // Selection
  const selection = useMemo(() => {
    const selected = new Set(selectedUsers)
    return userList.filter((user) => selected.has(user.name))
  }, [selectedUsers, selectedProjects, userList])

  const onContextMenu = (e) => {
    const newSelectedUsers = selectedUsers.includes(e.data.name) ? selectedUsers : [e.data.name]
    ctxMenuShow(e.originalEvent, ctxMenuItems(newSelectedUsers))
  }

  const tableRef = useRef(null)
  const anchorName = useRef(null)
  const shiftRange = useRef(null)

  // With the virtual scroller the table only knows the rendered rows, so its own shift-click range
  // is wrong or throws. Track the range here, by index in display order. The anchor is a user name:
  // the table's anchor is an index, which points at another user after a sort or reload.
  const onRowClick = ({ data, index, originalEvent }) => {
    shiftRange.current = null
    if (originalEvent.shiftKey) {
      const items = tableRef.current.getVirtualScroller().props.items
      const anchor = items.findIndex((user) => user.name === anchorName.current)
      // no anchor, or it's filtered out or deleted: select the clicked user only
      shiftRange.current =
        anchor === -1 ? [index, index] : [Math.min(anchor, index), Math.max(anchor, index)]
    }
    anchorName.current = data.name
  }

  const onSelectionChange = (e) => {
    if (!onSelectUsers) return
    // the scroller's items are the rows in display order: filtered and sorted
    const users = shiftRange.current
      ? tableRef.current
          .getVirtualScroller()
          .props.items.slice(shiftRange.current[0], shiftRange.current[1] + 1)
      : e.value
    shiftRange.current = null
    let result = []
    for (const user of users) if (user) result.push(user.name)
    onSelectUsers(result)
  }

  // IDEA: Can these go into the details panel as well?
  // built from the right-clicked selection; the dialogs act on the selected users, so an action
  // selects a right-clicked user that is not selected yet
  const ctxMenuItems = (newSelectedUsers) => {
    const withSelection = (open) => () => {
      if (newSelectedUsers !== selectedUsers) onSelectUsers(newSelectedUsers)
      open()
    }
    const ctxSelection = userList.filter((u) => newSelectedUsers.includes(u.name))
    const ctxSelfSelected = newSelectedUsers.includes(selfName)
    const ctxHasInvitable = ctxSelection.some((u) => !!u.attrib?.email)
    const inviteLabel =
      ctxSelection.length === 1 && getInvitationState(ctxSelection[0]) === 'pending'
        ? 'Resend'
        : 'Invite'

    return [
      {
        label: 'Set username',
        disabled: ctxSelection.length !== 1,
        command: withSelection(() => setShowRenameUser(true)),
        icon: 'edit',
      },
      {
        label: 'Set password',
        disabled: ctxSelection.length !== 1,
        command: withSelection(() => setShowSetPassword(true)),
        icon: 'key',
      },
      {
        label: inviteLabel,
        disabled: !ctxHasInvitable || managerDisabled,
        command: withSelection(() => setShowInviteUser(true)),
        icon: 'mail',
      },
      {
        label: 'Export',
        icon: 'download',
        powerFeature: 'tableExport',
        disabled: !ctxSelection.length,
        command: withSelection(() => tableExport?.openExport('selection')),
      },
      {
        label: 'Delete selected',
        disabled: !ctxSelection.length || ctxSelfSelected,
        command: withSelection(() => setShowDeleteUser(newSelectedUsers)),
        icon: 'delete',
        danger: true,
      },
    ]
  }

  const [ctxMenuShow] = useCreateContextMenu()

  const tableData = useTableLoadingData(tableList, isLoading, 40, 'name')

  // The virtual scroller (primereact 9.6) doesn't follow row changes by itself:
  // - it applies a new scroll height only on its next render, so render once more.
  // - it keeps its first rendered row until it scrolls, so scroll inside the new list.
  const [, rerender] = useReducer((n) => n + 1, 0)
  const prevUserList = useRef(userList)
  useEffect(() => {
    const scroller = tableRef.current?.getVirtualScroller()
    const element = scroller?.getElementRef().current
    if (element) {
      if (prevUserList.current === userList) {
        // same users, so the search changed: show the results from the top
        if (element.scrollTop > 0) scroller.scrollTo({ top: 0 })
      } else {
        // users were added, deleted or reloaded: stay where we were
        const maxTop = Math.max(0, tableData.length * ROW_HEIGHT - element.clientHeight)
        if (element.scrollTop > maxTop) scroller.scrollTo({ top: maxTop })
      }
    }
    prevUserList.current = userList
    rerender()
  }, [tableData, userList])

  const findUserPool = (poolId) => userPools.find((p) => p.id === poolId)

  // Render
  return (
    <Section wrap>
      <TablePanel>
        <DataTable
          ref={tableRef}
          value={tableData}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={clsx('user-list-table', { loading: isLoading })}
          rowClassName={(rowData) => clsx({ inactive: !rowData.active, loading: isLoading })}
          onRowClick={onRowClick}
          onSelectionChange={onSelectionChange}
          onContextMenu={onContextMenu}
          selection={selection}
          columnResizeMode="expand"
          resizableColumns
          responsive="true"
          stateStorage="custom"
          customSaveState={saveTableState}
          customRestoreState={restoreTableState}
          reorderableColumns
          // render only the visible rows: thousands of users otherwise means thousands of rows
          // and avatar requests
          virtualScrollerOptions={{ itemSize: ROW_HEIGHT }}
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
              sortFunction={sortFunctions.userPool}
              resizeable
            />
          )}
          <Column
            field={'accessLevel'}
            header="Access level"
            body={(rowData) => getUserRole(rowData)}
            sortFunction={sortFunctions.accessLevel}
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
            header="Active"
            body={(rowData) => (rowData.active ? 'yes' : '')}
            field="active"
            sortable
            resizeable
          />
          <Column
            header="Invitation"
            field="inviteSentAt"
            body={(rowData) => <InvitationStatus user={rowData} plain />}
            sortable
            sortFunction={sortFunctions.inviteSentAt}
            resizeable
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

// memo: typing in the search box re-renders the page, the table only changes with the results
export default memo(UserList)
