import React, { useEffect, useMemo, useState } from 'react'

import {
  AssigneeSelect,
  Button,
  Dropdown,
  FormLayout,
  FormRow,
  InputText,
  SaveButton,
} from '@ynput/ayon-react-components'
import checkName from '/src/helpers/checkName'

const CreateNewTeam = ({
  rolesList,
  selectedUsers,
  allUsers,
  setSelectedUsers,
  onCreate,
  createTeamOpen,
}) => {
  const rolesOptions = useMemo(() => rolesList.map((role) => ({ name: role })), [rolesList])
  const [nameForm, setNameForm] = useState('')
  const [rolesForm, setRolesForm] = useState([])

  // get data from open state or defaults
  const {
    title = 'Create New Team',
    duplicate = null,
    subTitle = '',
    roles = [],
    name = '',
  } = createTeamOpen || {}

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
      allUsers.map((user) => ({
        name: user.name,
        fullName: user.attrib?.fullName,
        avatarUrl: user.name && `/api/users/${user.name}/avatar`,
      })),
    [allUsers],
  )

  const duplicateTeam = () => {
    const addedRoles = rolesForm.filter((role) => !roles.includes(role))
    const removedRoles = roles.filter((role) => !rolesForm.includes(role))

    return {
      name: checkName(nameForm),
      members: allUsers
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

  const handleSubmit = () => {
    let newTeam

    if (duplicate) {
      newTeam = duplicateTeam()
    } else {
      newTeam = createNewTeam()
    }

    // update
    if (newTeam) onCreate(newTeam)
  }

  //   clears the form
  const handleClear = () => {
    setNameForm('')
    setSelectedUsers([])
    setRolesForm([])
  }

  return (
    <div style={{paddingLeft: '32px'}}>
        <span>{subTitle}</span>
        <FormLayout>
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
              editor
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
        <div style={{ display: 'flex', gap: 8 , paddingTop: 16 }}>
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
          />
      </div>
    </div>
  )
}

export default CreateNewTeam
