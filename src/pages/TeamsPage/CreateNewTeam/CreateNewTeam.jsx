import React, { useEffect, useMemo, useState } from 'react'
import {
  AssigneeSelect,
  Button,
  Dropdown,
  FormLayout,
  FormRow,
  InputText,
  SaveButton,
  Spacer,
} from '@ynput/ayon-react-components'
import checkName from '@helpers/checkName'
import UserListTeams from '../UserListTeams'
import useSearchFilter from '@hooks/useSearchFilter'
import * as Styled from './CreateNewTeam.styled'

const CreateNewTeam = ({
  rolesList,
  onCreate,
  createTeamOpen,
  onClose,
  teams = [],
  projectName,
  users = [],
  isLoading,
  isUpdating,
  selectedTeams,
}) => {
  const [selectedUsers, setSelectedUsers] = useState([])
  const rolesOptions = useMemo(() => rolesList.map((role) => ({ name: role })), [rolesList])
  const [nameForm, setNameForm] = useState('')
  const [rolesForm, setRolesForm] = useState([])

  const [search, setSearch, searchedUsers] = useSearchFilter(
    ['name', 'attrib.fullName'],
    users,
    undefined,
  )

  // get data from open state or defaults
  const { duplicate = null, subTitle = '', roles = [], name = '' } = createTeamOpen || {}

  // set any initial state
  useEffect(() => {
    if (createTeamOpen) {
      setNameForm(name)
      setRolesForm(roles)
    }
  }, [createTeamOpen])

  //   create list of users names in object format
  const usersOptions = useMemo(
    () =>
      users.map((user) => ({
        name: user.name,
        fullName: user.attrib?.fullName,
        avatarUrl: user.name && `/api/users/${user.name}/avatar`,
      })),
    [users],
  )

  const duplicateTeam = () => {
    const addedRoles = rolesForm.filter((role) => !roles.includes(role))
    const removedRoles = roles.filter((role) => !rolesForm.includes(role))

    return {
      name: checkName(nameForm),
      members: users
        .filter((user) => selectedUsers.includes(user.name))
        .map((user) => {
          const teamMember = user.teams[duplicate] || {}
          const originalRoles = teamMember.roles || []
          // remove any roles that were removed
          const newRoles = originalRoles.filter((role) => !removedRoles.includes(role))
          // add on any new roles
          newRoles.push(...addedRoles)

          return {
            name: user.name,
            roles: newRoles,
            leader: teamMember.leader || false,
          }
        }),
    }
  }

  const createNewTeam = () => {
    const newTeam = {
      name: checkName(nameForm),
      members: selectedUsers.map((name) => ({
        name,
        roles: rolesForm.filter((r) => r),
        leader: false,
      })),
    }

    return newTeam
  }

  const handleSubmit = (closeDialog = true) => {
    // first check team name is valid
    if (!nameForm) return

    let newTeam

    if (duplicate) {
      newTeam = duplicateTeam()
    } else {
      newTeam = createNewTeam()
    }

    // update
    if (newTeam && closeDialog) onCreate(newTeam)
  }

  //   clears the form
  const handleClear = () => {
    setNameForm('')
    setSelectedUsers([])
    setRolesForm([])
  }

  const handleKeyDown = (e) => {
    // submit form on cmd/ctrl+enter
    // submit form on shift+enter but don't close dialog
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      handleSubmit()
    }
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault()
      handleSubmit(false)
    }
    // if escape key close dialog
    if (e.key === 'Escape') {
      onClose()
    }
  }

  return (
    <Styled.StyledDialog
      onClose={onClose}
      style={{ height: '700px' }}
      isOpen
      header={'Create New Team'}
      size="full"
      onKeyDown={handleKeyDown}
      footer={
        <>
          <Spacer />
          <Spacer />
          <Button
            onClick={handleClear}
            label="Clear"
            icon="clear"
            style={{ flex: 1 }}
            disabled={!nameForm}
          />
          <SaveButton
            onClick={handleSubmit}
            label="Create New Team"
            style={{ flex: 1 }}
            active={!!nameForm}
            saving={isUpdating}
          />
        </>
      }
    >
      <Styled.Container direction="row">
        <Styled.Column>
          <InputText
            style={{ width: '100%' }}
            placeholder="Filter users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
          />
          <UserListTeams
            selectedProjects={[projectName]}
            selectedUsers={selectedUsers}
            onSelectUsers={(users) => setSelectedUsers(users)}
            userList={searchedUsers}
            isLoading={isLoading}
            selectedTeams={selectedTeams}
            showAllUsers={true}
            teams={teams}
            isFullSize={false}
          />
        </Styled.Column>
        <Styled.Column>
          <FormLayout>
            {subTitle && <h3>{subTitle}</h3>}
            <FormRow label="Team Name">
              <InputText value={nameForm} onChange={(e) => setNameForm(e.target.value)} autoFocus />
            </FormRow>
            <FormRow label="Team Members">
              <AssigneeSelect
                value={selectedUsers}
                options={usersOptions}
                onChange={setSelectedUsers}
                dataKey="name"
                valueTemplate={'tags'}
                widthExpand
                search
                searchFields={['name']}
                multiSelect
                emptyIcon={false}
                emptyMessage="Add Team Members..."
              />
            </FormRow>

            <FormRow label="Member Roles">
              <Dropdown
                value={rolesForm}
                options={rolesOptions}
                onChange={setRolesForm}
                dataKey="name"
                valueTemplate={'tags'}
                search
                searchFields={['name']}
                editable
                multiSelect
                widthExpand
                placeholder={'Add Members Roles...'}
                disabled={selectedUsers.length === 0}
              />
            </FormRow>
          </FormLayout>
        </Styled.Column>
      </Styled.Container>
    </Styled.StyledDialog>
  )
}

export default CreateNewTeam
