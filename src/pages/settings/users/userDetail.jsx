import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Button, Section, Panel, InputText, FormRow } from '@ynput/ayon-react-components'
import { isEmpty } from '/src/utils'
import { UserAttrib, AccessControl } from './forms'
import { useUpdateUserMutation } from '/src/services/user/updateUser'
import styled from 'styled-components'
import UserImagesStacked from './UserImagesStacked'
import ayonClient from '/src/ayon'

const HeaderStyled = styled(Panel)`
  gap: 10px;
  align-items: center;
  flex-direction: row;

  h2 {
    font-size: 1.1rem;
    margin: 0;
  }
`

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

const UsernameStyled = styled(FormRow)`
  .field {
    flex-direction: row;
    gap: 5px;

    input {
      flex: 1;
    }
  }
`

const PanelButtonsStyled = styled(Panel)`
  flex-direction: row;

  & > * {
    flex: 1;
  }
`

const UserDetail = ({
  userList,
  setShowRenameUser,
  selectedUsers,
  setShowSetPassword,
  selectedProjects,
  userDetailData,
}) => {
  const [formData, setFormData] = useState({})
  const [initData, setInitData] = useState({})
  const [changesMade, setChangesMade] = useState(false)

  const attributes = ayonClient.getAttribsByScope('user')

  useEffect(() => {
    const buildFormData = (data) => {
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
      }
      // set attributes
      if (data.users.length === 1) {
        attributes.forEach((attr) => {
          formData[attr.name] = data.users[0].attrib[attr.name]
        })
      }

      return formData
    }

    const formData = buildFormData(userDetailData)
    setFormData(formData)
    // used to compare changes later
    setInitData(formData)
  }, [userDetailData, selectedUsers, selectedProjects])

  // look for changes when formData changes
  useEffect(() => {
    const isDiff = JSON.stringify(formData) !== JSON.stringify(initData)

    if (isDiff) {
      if (!changesMade) setChangesMade(true)
    } else {
      setChangesMade(false)
    }
  }, [formData, initData])

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
        attributes.forEach(({ name }) => (attrib[name] = formData[name]))
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

  //
  // Render
  //

  return (
    <Section className="wrap" style={{ gap: '5px', bottom: 'unset', maxHeight: '100%' }}>
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
      <FormsStyled>
        {formData && singleUserEdit && (
          <Panel>
            <UsernameStyled label={'Username'} key={'Username'}>
              <InputText label="Username" value={singleUserEdit.name} disabled={true} />
              <Button icon="edit" onClick={() => setShowRenameUser(true)} />
            </UsernameStyled>
            <UsernameStyled label={'Password'} key={'Password'}>
              <InputText
                label="Password"
                value={singleUserEdit.hasPassword ? '1234567890' : ''}
                disabled={true}
                type="password"
              />
              <Button icon="edit" onClick={() => setShowSetPassword(true)} />
            </UsernameStyled>

            <UserAttrib formData={formData} setFormData={setFormData} attributes={attributes} />
          </Panel>
        )}
        <Panel>
          {formData && (
            <AccessControl
              formData={formData}
              setFormData={setFormData}
              rolesLabel={userDetailData.projectNames?.length ? 'Project roles' : 'Default roles'}
            />
          )}
        </Panel>
      </FormsStyled>
      <PanelButtonsStyled>
        <Button onClick={onCancel} label="Cancel" icon="cancel" disabled={!changesMade} />
        <Button onClick={onSave} label="Save selected users" icon="check" disabled={!changesMade} />
      </PanelButtonsStyled>
    </Section>
  )
}

export default UserDetail
