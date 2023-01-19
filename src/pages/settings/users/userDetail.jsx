import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Button, Section, Panel, InputText, FormRow } from '@ynput/ayon-react-components'
import { isEmpty } from '/src/utils'
import { UserAttrib, AccessControl } from './forms'
import { useUpdateUserMutation } from '/src/services/user/updateUser'
import styled from 'styled-components'
import UserImagesStacked from './UserImagesStacked'

const HeaderStyled = styled.header`
  display: flex;
  border-bottom: 1px solid var(--color-grey-01);
  gap: 10px;
  align-items: center;
  padding-bottom: 10px;

  h2 {
    font-size: 1.1rem;
    margin: 0;
  }
`

const UsernameStyled = styled(FormRow)`
  .field {
    flex-direction: row;
    gap: 5px;

    input {
      flex: 1;
    }
  }
`

const UserDetail = ({ userDetailData, userList, setShowRenameUser, selectedUsers }) => {
  const [formData, setFormData] = useState({})

  const userAttrib = {
    fullName: 'Full name',
    email: 'Email',
  }

  useEffect(() => {
    let nroles = []
    if (isEmpty(userDetailData)) return
    if (userDetailData.roles?.length) {
      for (const nrole of userDetailData.roles) {
        if (nrole.shouldSelect) nroles.push(nrole.name)
      }
    }
    const formData = {
      userActive: userDetailData.userActive,
      userLevel: userDetailData.userLevel,
      isGuest: userDetailData.isGuest,
      roles: nroles,
    }
    if (userDetailData.users.length === 1) {
      for (const attrName in userAttrib)
        formData[attrName] = userDetailData.users[0].attrib[attrName]
    }
    setFormData(formData)
  }, [userDetailData, selectedUsers])

  // editing a single user, so show attributes form too
  const singleUserEdit = userDetailData.users?.length === 1 ? userDetailData.users[0] : null

  const [updateUser] = useUpdateUserMutation()

  // no selected user. do not show the panel
  if (!userDetailData.users?.length) {
    return <></>
  }

  const getUserName = (user) => user.attrib.fullName || user.name

  //
  // API
  //

  const onSave = async () => {
    for (const user of userDetailData.users) {
      const data = {}
      const attrib = {}

      if (singleUserEdit) {
        for (const attrName in userAttrib) attrib[attrName] = formData[attrName]
      }

      const roles = JSON.parse(user.roles || {})

      if (!userDetailData.projectNames) {
        // no project is selected. update default roles
        data.defaultRoles = formData.roles
      } else {
        // project(s) selected. update roles
        for (const projectName of userDetailData.projectNames) roles[projectName] = formData.roles
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

      try {
        // Apply the patch
        await updateUser({
          name: user.name,
          patch: {
            active: formData.userActive,
            attrib,
            data,
          },
        }).unwrap()

        console.log('user updated')
      } catch (error) {
        toast.error(`Unable to update user ${user.name} `)
        console.error(error)
      }
    } // for user
  }

  //
  // Render
  //

  return (
    <Section className="wrap">
      <Panel>
        <HeaderStyled>
          <UserImagesStacked
            users={userDetailData?.users.map((user) => ({ fullName: getUserName(user) }))}
          />
          {singleUserEdit ? (
            <h2>{getUserName(singleUserEdit)}</h2>
          ) : (
            <h2>{`${userDetailData.users.length}/${userList.length} Users Selected`}</h2>
          )}
        </HeaderStyled>
        {singleUserEdit && (
          <>
            <UsernameStyled label={'Username'} key={'Username'}>
              <InputText label="Username" value={singleUserEdit.name} disabled={true} />
              <Button icon="edit" onClick={() => setShowRenameUser(true)} />
            </UsernameStyled>
            <UserAttrib formData={formData} setFormData={setFormData} attributes={userAttrib} />
          </>
        )}

        <AccessControl
          formData={formData}
          setFormData={setFormData}
          rolesLabel={userDetailData.projectNames?.length ? 'Project roles' : 'Default roles'}
        />
        <Button onClick={onSave} label="Save selected users" icon="check" />
      </Panel>
    </Section>
  )
}

export default UserDetail
