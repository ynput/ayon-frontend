import React, { useMemo, useState } from 'react'

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
}) => {
  const rolesOptions = useMemo(() => rolesList.map((role) => ({ name: role })), [rolesList])
  const [name, setName] = useState('')
  const [roles, setRoles] = useState([])

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

  const handleSubmit = () => {
    const newTeam = {
      name: checkName(name),
      members: selectedUsers.map((name) => ({
        name,
        roles: roles.filter((r) => r),
        leader: false,
      })),
      leaders: [],
      memberCount: selectedUsers.length,
    }

    onCreate(newTeam)
  }

  //   clears the form
  const handleClear = () => {
    setName('')
    setSelectedUsers([])
    setRoles([])
  }

  return (
    <>
      <DetailHeader onClose={() => onClose(false)}>
        <div
          style={{
            overflow: 'hidden',
          }}
        >
          <h2>Create New Team</h2>
          {/* <span>{usersList.join(', ')}</span> */}
        </div>
      </DetailHeader>
      <Panel>
        <FormLayout>
          <FormRow label="Team Name">
            <InputText value={name} onChange={(e) => setName(e.target.value)} autoFocus />
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
              value={roles}
              options={rolesOptions}
              onChange={setRoles}
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
        <div
          style={{
            display: 'flex',
            gap: 4,
            width: '100%',
            marginTop: 8,
          }}
        >
          <Button
            onClick={handleClear}
            label="Clear"
            icon="clear"
            style={{ flex: 1 }}
            disabled={!name}
          />
          <Button
            onClick={handleSubmit}
            label="Create New Team"
            icon="group_add"
            style={{ flex: 1 }}
            disabled={!name}
          />
        </div>
      </Panel>
    </>
  )
}

export default CreateNewTeam
