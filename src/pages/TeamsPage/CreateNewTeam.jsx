import React, { useEffect, useMemo, useState } from 'react'

import {
  AssigneeSelect,
  Button,
  Dropdown,
  FormLayout,
  FormRow,
  InputText,
  Panel,
} from '@ynput/ayon-react-components'
import DetailHeader from '/src/components/DetailHeader'
import checkName from '/src/helpers/checkName'

const CreateNewTeam = ({
  rolesList,
  selectedUsers,
  allUsers,
  setSelectedUsers,
  onClose,
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
        avatarUrl: user.attrib?.avatarUrl,
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
    <>
      <DetailHeader
        onClose={() => onClose(false)}
        style={{ borderTop: '2px solid var(--color-hl-studio)' }}
      >
        <div
          style={{
            overflow: 'hidden',
          }}
        >
          <h2>{title}</h2>
          <span>{subTitle}</span>
        </div>
      </DetailHeader>
      <Panel>
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
              style={{
                border: '1px solid var(--color-grey-03)',
              }}
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
      </Panel>
      <Panel
        style={{
          borderBottom: '2px solid var(--color-hl-studio)',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 4,
            width: '100%',
          }}
        >
          <Button
            onClick={handleClear}
            label="Clear"
            icon="clear"
            style={{ flex: 1 }}
            disabled={!nameForm}
          />
          <Button
            onClick={handleSubmit}
            label="Create New Team"
            icon="group_add"
            style={{ flex: 1 }}
            disabled={!nameForm}
          />
        </div>
      </Panel>
    </>
  )
}

export default CreateNewTeam
