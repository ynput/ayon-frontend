import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { ContextMenu } from 'primereact/contextmenu'
import { TablePanel, Section, UserImage } from '@ynput/ayon-react-components'

import { useMemo } from 'react'
import styled from 'styled-components'
import addRemoveMembers from './addRemoveMembers'
import useCreateContext from '/src/hooks/useCreateContext'

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
  teams = [],
  onUpdateTeams,
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

  const handleAddRemove = (add = [], remove = []) => {
    const updatedTeams = addRemoveMembers(teams, selectedUsers, add, remove)

    console.log(updatedTeams)

    onUpdateTeams(updatedTeams)
  }

  const onContextSelectionChange = (e) => {
    const name = e.value.name
    const index = selectedUsers.indexOf(name)
    if (index === -1) onSelectUsers([name])
  }

  // two arrays one for adding to teams and one for removing from teams
  // only one user that is not in the team is required to add to the team
  // only one user that is in the team is required to remove from the team
  const addToList = useMemo(
    () =>
      teams.filter((team) =>
        selectedUsers.some((user) => !team.members.some((mem) => mem.name === user)),
      ),
    [selectedTeams, selectedUsers, teams],
  )

  const removeFromList = useMemo(
    () =>
      teams.filter((team) =>
        selectedUsers.some((user) => team.members.some((mem) => mem.name === user)),
      ),
    [selectedTeams, selectedUsers, teams],
  )

  // CONTEXT
  const contextMenuItems = useMemo(
    () => [
      {
        label: showAllUsers ? 'Show All Users' : 'Show Members Only',
        command: onShowAllUsers,
        icon: showAllUsers ? 'visibility' : 'visibility_off',
      },
      {
        label: 'Add To Team',
        icon: 'add',
        items: addToList.map((team) => ({
          label: team.name,
          icon: 'add',
          command: () => handleAddRemove([team.name], []),
        })),
      },
      {
        label: 'Remove From Team',
        icon: 'remove',
        items: removeFromList.map((team) => ({
          label: team.name,
          icon: 'remove',
          command: () => handleAddRemove([], [team.name]),
        })),
      },
    ],
    [selectedTeams, selectedUsers, showAllUsers, teams],
  )

  // create ref and model
  const [contextMenuRef, contextMenuModel, contextMenuShow] = useCreateContext(contextMenuItems)

  // Render

  return (
    <Section
      style={{
        height: '100%',
        flex: 1.5,
      }}
    >
      <ContextMenu model={contextMenuModel} ref={contextMenuRef} />
      <TablePanel loading={isLoading} onContextMenu={contextMenuShow}>
        <DataTable
          value={userList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className="user-list-table"
          onSelectionChange={onSelectionChange}
          onContextMenuSelectionChange={onContextSelectionChange}
          selection={selection}
          resizableColumns
          responsive="true"
          autoLayout="true"
          tableStyle={{
            width: '100%',
          }}
          groupRowsBy={'group'}
          rowGroupMode="subheader"
          rowGroupHeaderTemplate={(data) => {
            return <div>{data.group}</div>
          }}
        >
          <Column
            field="name"
            header="Username"
            body={(rowData) => ProfileRow({ rowData })}
            style={{
              width: '20%',
            }}
          />
          <Column
            field="attrib.fullName"
            header="Full Name"
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
            sortField="rolesList"
          />
        </DataTable>
      </TablePanel>
    </Section>
  )
}

export default UserListTeams
