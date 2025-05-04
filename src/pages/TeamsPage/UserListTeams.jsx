import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import { ProfileRow } from '@pages/SettingsPage/UsersSettings/UserList'

import { useMemo } from 'react'
import addRemoveMembers from './addRemoveMembers'
import { useCreateContextMenu } from '@shared/containers/ContextMenu'
import UsersListTeamsSmall from './UsersListTeamsSmall'
import clsx from 'clsx'
import useTableLoadingData from '@hooks/useTableLoadingData'

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
  isFullSize = true,
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

  const handleAddRemove = (add = [], remove = [], users) => {
    const updatedTeams = addRemoveMembers(teams, users, add, remove)

    onUpdateTeams(updatedTeams)
  }

  const onContextSelectionChange = (e) => {
    const name = e.value.name
    const index = selectedUsers.indexOf(name)
    if (index === -1) onSelectUsers([name])
  }

  // two arrays one for adding to teams and one for removing from teams
  // only one user that is not in the team is required to add to the team
  function getAddToList(selectedUsers, teams) {
    return teams.filter((team) =>
      selectedUsers.some((user) => !team.members.some((mem) => mem.name === user)),
    )
  }

  // only one user that is in the team is required to remove from the team
  function getRemoveFromList(selectedUsers, teams) {
    return teams.filter((team) =>
      selectedUsers.some((user) => team.members.some((mem) => mem.name === user)),
    )
  }

  function createListItems(
    showAllUsers,
    onShowAllUsers,
    addToList,
    removeFromList,
    handleAddRemoveCommand,
    users = [],
  ) {
    const addToSelectedDisabled =
      !selectedTeams.length || !selectedTeams.some((team) => addToList.some((t) => t.name === team))

    const items = [
      {
        label: showAllUsers ? 'Show All Users' : 'Show Members Only',
        command: onShowAllUsers,
        icon: showAllUsers ? 'visibility' : 'visibility_off',
      },
      {
        label:
          selectedTeams.length > 1 || addToSelectedDisabled
            ? 'Add to selected teams'
            : `Add to ${selectedTeams[0]}`,
        icon: 'add_circle',
        disabled: addToSelectedDisabled,
        command: () => handleAddRemoveCommand(selectedTeams, [], users),
      },
      {
        label: 'Add to team',
        icon: 'add',
        items: addToList.map((team) => ({
          label: team.name,
          icon: 'add',
          command: () => handleAddRemoveCommand([team.name], [], users),
        })),
      },
      {
        label: 'Remove from team',
        icon: 'remove',
        items: removeFromList.map((team) => ({
          label: team.name,
          icon: 'remove',
          command: () => handleAddRemoveCommand([], [team.name], users),
        })),
      },
    ]

    return items
  }

  // create ref and model
  const [contextMenuShow] = useCreateContextMenu([])

  const handleContext = (e) => {
    // we all of this to keep users in sync
    // when right clicking on a new user we need to use the event NOT selectedUsers as it is not updated yet
    let users = selectedUsers
    if (selectedUsers.length < 2) users = [e.data.name]

    const addToList = getAddToList(users, teams)
    const removeFromList = getRemoveFromList(users, teams)
    contextMenuShow(
      e.originalEvent,
      createListItems(
        showAllUsers,
        onShowAllUsers,
        addToList,
        removeFromList,
        handleAddRemove,
        users,
      ),
    )
  }

  const tableData = useTableLoadingData(userList, isLoading, 10, 'name')

  if (!isFullSize)
    return (
      <UsersListTeamsSmall
        handleContext={handleContext}
        userList={tableData}
        isLoading={isLoading}
        onSelectionChange={onSelectionChange}
        onContextSelectionChange={onContextSelectionChange}
        selection={selection}
        className={clsx('user-list-table', { loading: isLoading })}
        rowClassName={() => clsx({ loading: isLoading })}
      />
    )

  return (
    <Section
      style={{
        height: '100%',
        flex: 1.5,
      }}
    >
      <TablePanel onContextMenu={handleContext}>
        <DataTable
          value={tableData}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={clsx('user-list-table', { loading: isLoading })}
          rowClassName={() => clsx({ loading: isLoading })}
          onSelectionChange={onSelectionChange}
          onContextMenuSelectionChange={onContextSelectionChange}
          onContextMenu={handleContext}
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
            body={(rowData) => !isLoading && <ProfileRow rowData={rowData} />}
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
              if (!rowData.teams) return null
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
                        color: rowData.teams[team].leader
                          ? 'var(--md-sys-color-tertiary)'
                          : 'inherit',
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
