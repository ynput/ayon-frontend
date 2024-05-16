import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import { TablePanel, Section } from '@ynput/ayon-react-components'
import UserImage from '/src/components/UserImage'

import { useMemo } from 'react'
import styled from 'styled-components'
import addRemoveMembers from './addRemoveMembers'
import useCreateContext from '/src/hooks/useCreateContext'

const StyledProfileRow = styled.div`
  display: flex;
  align-items: center;
  gap: var(--base-gap-large);
  overflow: hidden;
`

const ProfileRow = ({ rowData }) => {
  const { name, self, isMissing } = rowData
  return (
    <StyledProfileRow>
      <UserImage
        name={name}
        size={25}
        style={{
          margin: 'auto',
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

const FullnameImage = ({ rowData }) => {
  const { name, self, isMissing } = rowData
  const { fullName } = rowData.attrib || false
  return (
    <StyledProfileRow>
      <UserImage
        name={name}
        size={25}
        style={{
          margin: 'auto',
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
        {fullName || name}
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
  isFullSize = true
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
  const [contextMenuShow] = useCreateContext([])

  // create 10 dummy rows
  const loadingData = useMemo(() => {
    return Array.from({ length: 10 }, (_, i) => ({
      key: i,
      data: {},
    }))
  }, [])

  if (isLoading) {
    userList = loadingData
  }

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

  if (!isFullSize) return (
  <Section style={{ height: '100%', flex: 1.5 }}>
      <TablePanel onContextMenu={handleContext}>
        <DataTable
          value={userList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={`user-list-table ${isLoading ? 'table-loading' : ''}`}
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
              field="attrib.fullName"
              header="Full Name"
              style={{
                width: '20%',
              }}
              body={(rowData) => FullnameImage({ rowData })}
              />
        </DataTable>
          </TablePanel>
      </Section>
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
          value={userList}
          scrollable="true"
          scrollHeight="flex"
          dataKey="name"
          selectionMode="multiple"
          className={`user-list-table ${isLoading ? 'table-loading' : ''}`}
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
              body={(rowData) => FullnameImage({ rowData })}
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
