import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Button, Section, Panel } from '@ynput/ayon-react-components'
import { isEmpty } from '/src/utils'
import { useUpdateUserMutation } from '/src/services/user/updateUser'
import styled from 'styled-components'
import UserImagesStacked from './UserImagesStacked'
import ayonClient from '/src/ayon'
import UserAttribForm from './UserAttribForm'
import UserAccessForm from './UserAccessForm'
import { confirmDialog } from 'primereact/confirmdialog'
import ServiceDetails from './ServiceDetails'
import LockedInputRow from '/src/components/LockedInput'
import DetailHeader from '/src/components/DetailHeader'

const FormsStyled = styled.section`
  flex: 1;
  overflow-x: clip;
  overflow-y: auto;
  gap: 5px;
  display: flex;
  flex-direction: column;

  & > *:last-child {
    /* flex: 1; */
  }
`

export const PanelButtonsStyled = styled(Panel)`
  flex-direction: row;

  & > * {
    flex: 1;
  }
`

const buildUserDetailData = (projectNames, roleNames, users, lastSelectedUser) => {
  // find last user selected
  let lastUser = users.filter((user) => user.name === lastSelectedUser)[0]
  // no last user then just use last in list
  if (!lastUser) lastUser = users[0]
  // still no user then return
  if (!lastUser) return

  const allRoles =
    projectNames?.map((projectName) => lastUser.roles[projectName] || []).flat() || []

  // do above in one line
  let roles = roleNames.map((roleName) => ({
    name: roleName,
    shouldSelect: allRoles.includes(roleName),
  }))

  let userLevel = 'user'
  if (lastUser?.isAdmin) userLevel = 'admin'
  else if (lastUser?.isService) userLevel = 'service'
  else if (lastUser?.isManager) userLevel = 'manager'

  return {
    users,
    projectNames,
    roles,
    userLevel,
    userActive: lastUser?.active,
    isGuest: lastUser?.isGuest,
    defaultRoles: lastUser?.defaultRoles,
  }
}

const buildFormData = (data, attributes) => {
  let nroles = []

  if (isEmpty(data)) return
  if (data.roles?.length) {
    for (const nrole of data.roles) {
      if (nrole.shouldSelect) nroles.push(nrole.name)
    }
  }

  const formData = {
    userActive: data.userActive,
    userLevel: data.userLevel,
    isGuest: data.isGuest,
    roles: nroles,
    defaultRoles: data.defaultRoles,
  }

  // set attributes
  if (data.users.length === 1) {
    attributes.forEach((attr) => {
      formData[attr.name] = data.users[0].attrib[attr.name]
    })
  }

  return formData
}

const UserDetail = ({
  setShowRenameUser,
  selectedUsers,
  setShowSetPassword,
  selectedProjects,
  setSelectedUsers,
  isSelfSelected,
  rolesList,
  lastSelectedUser,
  selectedUserList,
  managerDisabled,
}) => {
  const [formData, setFormData] = useState({})
  const [initData, setInitData] = useState({})
  const [changesMade, setChangesMade] = useState(false)
  const [formUsers, setFormUsers] = useState([])

  const attributes = ayonClient.getAttribsByScope('user')

  useEffect(() => {
    setFormUsers(selectedUserList)

    const userDetailData = buildUserDetailData(
      selectedProjects,
      rolesList,
      selectedUserList,
      lastSelectedUser,
    )

    const formData = buildFormData(userDetailData, attributes)
    setFormData(formData)
    // used to compare changes later
    setInitData(formData)
  }, [selectedUserList, selectedUsers, selectedProjects])

  // look for changes when formData changes
  useEffect(() => {
    const isDiff = JSON.stringify(formData) !== JSON.stringify(initData) || selectedUsers.length > 1

    if (isDiff && (!isSelfSelected || selectedUsers.length === 1)) {
      if (!changesMade) setChangesMade(true)
    } else {
      setChangesMade(false)
    }
  }, [formData, initData])

  // editing a single user, so show attributes form too
  const singleUserEdit = selectedUsers.length === 1 ? formUsers[0] : null
  // check if any users have the userLevel of service
  const hasServiceUser = formUsers.some((user) => user.isService)

  const [updateUser] = useUpdateUserMutation()

  // no selected user. do not show the panel
  if (!selectedUsers.length) {
    return <></>
  }

  const getUserName = (user) => user.attrib.fullName || user.name

  //
  // API
  //

  const handleMultiSave = () => {
    // if multiple users are selected confirm the action
    confirmDialog({
      // message: `Are you sure you want update all these users to the same values?`,
      header: 'Update All Selected Users To The Same Values?',
      icon: 'pi pi-exclamation-triangle',
      message: (
        <ul>
          {/* usuers being updates */}
          <li>
            Users:{' '}
            {formUsers.map((user) => (
              <span key={user.name}>{user.name}, </span>
            ))}
          </li>
          <li>User Active: {formData.userActive ? 'Yes' : 'No'}</li>
          <li>User Level: {formData.userLevel}</li>
          <li>Is Guest: {formData.isGuest ? 'Yes' : 'No'}</li>
          <li>Roles: {formData.roles?.length ? formData.roles.join(', ') : ''}</li>
        </ul>
      ),

      accept: onSave,
      reject: () => {},
    })
  }

  const onSave = async () => {
    for (const user of formUsers) {
      const data = {}
      const attrib = {}

      if (singleUserEdit) {
        attributes.forEach(({ name }) => (attrib[name] = formData[name]))
      }

      let roles = user.roles ? { ...user.roles } : {}

      if (!selectedProjects) {
        // no project is selected. update default roles
        data.defaultRoles = formData.defaultRoles
      } else {
        // project(s) selected. update roles
        for (const projectName of selectedProjects) roles[projectName] = formData.roles
      }

      // update user level && do role clean-up
      data.isAdmin = formData.userLevel === 'admin'
      data.isManager = formData.userLevel === 'manager'
      data.isService = formData.userLevel === 'service'
      data.isGuest = formData.isGuest

      if (!(data.isAdmin || data.isManager || data.isService)) {
        if (!isEmpty(roles)) data.roles = roles
      } else {
        data.roles = null
      }

      const patch = {
        active: formData.userActive,
        attrib,
        data,
      }

      try {
        // Apply the patch
        await updateUser({
          name: user.name,
          patch,
        }).unwrap()

        toast.success(`Updated user: ${user.name} `)
        console.log('user updated')
      } catch (error) {
        toast.error(`Unable to update user ${user.name} `)
        console.error(error)
      }
    } // for user
  }

  const onCancel = () => {
    // reset data back to init
    setFormData(initData)
  }

  // onclose, no users selected but check if changes made
  const onClose = () => {
    if (changesMade && selectedUsers.length === 1) {
      return toast.error('Changes not saved')
    }
    setSelectedUsers([])
  }

  //
  // Render
  //

  const headerRoles = formUsers.reduce((acc, user) => {
    let roles = Object.entries(user.roles)
      .map(([project, role]) =>
        selectedProjects ? (selectedProjects?.includes(project) ? role : []) : role,
      )
      .flat()

    // add admin, manager, service
    if (user.isAdmin) roles.push('admin')
    else if (user.isService) roles.push('service')
    else if (user.isManager) roles.push('manager')

    return [...new Set([...acc, ...roles])]
  }, [])

  return (
    <Section className="wrap" style={{ gap: '5px', bottom: 'unset', maxHeight: '100%' }}>
      <DetailHeader onClose={onClose} context={formUsers} dialogTitle="User Context">
        <UserImagesStacked
          users={formUsers.map((user) => ({
            fullName: getUserName(user),
            src: user.attrib.avatarUrl,
            self: user.self,
          }))}
        />
        <div>
          {singleUserEdit ? (
            <h2>{getUserName(singleUserEdit)}</h2>
          ) : (
            <h2>{`${selectedUsers.length} Users Selected`}</h2>
          )}
          <div>{headerRoles.length ? headerRoles.join(', ') : 'No Roles'}</div>
        </div>
      </DetailHeader>
      {hasServiceUser && singleUserEdit ? (
        <FormsStyled>
          <ServiceDetails editName={() => setShowRenameUser(true)} user={singleUserEdit} />
        </FormsStyled>
      ) : (
        <FormsStyled>
          {formData && singleUserEdit && (
            <Panel>
              <LockedInputRow
                label="Username"
                value={singleUserEdit.name}
                onEdit={() => setShowRenameUser(true)}
                disabled={managerDisabled}
              />
              <LockedInputRow
                label="Password"
                value={singleUserEdit.hasPassword ? '1234567890' : ''}
                type="password"
                onEdit={() => setShowSetPassword(true)}
                disabled={managerDisabled}
              />

              <UserAttribForm
                formData={formData}
                setFormData={setFormData}
                attributes={attributes}
                disabled={managerDisabled}
              />
            </Panel>
          )}
          <Panel>
            {formData && (
              <UserAccessForm
                formData={formData}
                setFormData={setFormData}
                selectedProjects={selectedProjects}
                disabled={managerDisabled || isSelfSelected}
              />
            )}
          </Panel>
        </FormsStyled>
      )}
      <PanelButtonsStyled>
        <Button
          onClick={onCancel}
          label="Cancel"
          icon="cancel"
          disabled={!changesMade || selectedUsers.length > 1}
        />
        <Button
          onClick={() => (selectedUsers.length > 1 ? handleMultiSave() : onSave())}
          label="Save selected users"
          icon="check"
          disabled={!changesMade}
        />
      </PanelButtonsStyled>
    </Section>
  )
}

export default UserDetail
