import { useRef } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { TablePanel, Section, UserImage } from '@ynput/ayon-react-components'

import { useMemo } from 'react'
import styled from 'styled-components'

const StyledProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  overflow: hidden;
`

const ProfileRow = ({ rowData }) => {
  return (
    <StyledProfileRow>
      <UserImage
        fullName={rowData?.attrib?.fullName || rowData.name}
        size={25}
        style={{
          margin: 'auto',
          transform: 'scale(0.8)',
          minHeight: 25,
          minWidth: 25,
          maxHeight: 25,
          maxWidth: 25,
        }}
        highlight={rowData.self}
        src={rowData?.attrib?.avatarUrl}
      />
      <span
        style={{
          color: rowData.isMissing ? 'var(--color-hl-error)' : 'inherit',
        }}
      >
        {rowData.name}
      </span>
    </StyledProfileRow>
  )
}

const UserListTeams = ({
  selectedProjects,
  selectedUsers = [],
  userList = [],
  onSelectUsers,
  isLoading,
  selectedTeams,
  showAllUsers,
  onShowAllUsers,
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

  const contextMenuModel = [
    {
      label: showAllUsers ? 'Show All Users' : 'Show Members Only',
      command: onShowAllUsers,
    },
  ]

  // Render

  return (
    <Section
      style={{
        height: '100%',
        flex: 1.5,
      }}
    >
      <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
      <TablePanel loading={isLoading} onContextMenu={(e) => contextMenuRef.current.show(e)}>
        <DataTable
          value={userList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className="user-list-table"
          onSelectionChange={onSelectionChange}
          selection={selection}
          resizableColumns
          responsive="true"
          autoLayout="true"
          tableStyle={{
            width: '100%',
          }}
        >
          <Column
            field="name"
            header="Username"
            sortable
            body={(rowData) => ProfileRow({ rowData })}
            style={{
              width: '20%',
            }}
          />
          <Column
            field="attrib.fullName"
            header="Full Name"
            sortable
            style={{
              width: '20%',
            }}
          />
          <Column
            header="Teams"
            body={(rowData) => {
              // sort teams by leader and sort teams by if they are selected
              const teamNames = Object.keys(rowData.teams)
              teamNames.sort((a, b) => {
                if (selectedTeams.includes(a) && !selectedTeams.includes(b)) return -1
                if (!selectedTeams.includes(a) && selectedTeams.includes(b)) return 1
                if (rowData.teams[a].leader) return -1
                if (rowData.teams[b].leader) return 1
                return 0
              })

              return (
                <span>
                  {teamNames.map((team, i, arr) => (
                    <span
                      key={team}
                      style={{
                        color: rowData.teams[team].leader ? 'var(--color-hl-00)' : 'inherit',
                        opacity: selectedTeams.includes(team) ? 1 : 0.5,
                        marginLeft: i === 0 ? 0 : 4,
                      }}
                    >{`${team}${i < arr.length - 1 ? ',' : ''}`}</span>
                  ))}
                </span>
              )
            }}
            sortable
            sortField="teamsList"
          />
          <Column
            header="Roles"
            body={(rowData) => {
              const allRoles = []
              const selectedRoles = []

              for (const team in rowData.teams) {
                for (const role of rowData.teams[team].roles) {
                  if (!allRoles.includes(role)) allRoles.push(role)
                  if (selectedTeams.includes(team) && !selectedRoles.includes(role))
                    selectedRoles.push(role)
                }
              }

              return (
                <span>
                  {allRoles.map((role, i, arr) => (
                    <span
                      key={role}
                      style={{
                        opacity: selectedRoles.includes(role) ? 1 : 0.5,
                        marginLeft: i === 0 ? 0 : 4,
                      }}
                    >{`${role}${i < arr.length - 1 ? ',' : ''}`}</span>
                  ))}
                </span>
              )
            }}
            sortable
            sortField="rolesList"
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default UserListTeams
