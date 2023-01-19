import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Button, Section, Panel } from '@ynput/ayon-react-components'
import { isEmpty } from '/src/utils'
import { UserAttrib, AccessControl } from './forms'
import { useUpdateUserMutation } from '/src/services/user/updateUser'

const UserDetail = ({ userDetailData }) => {
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
  }, [userDetailData])

  // editing a single user, so show attributes form too
  const singleUserEdit = userDetailData.users?.length === 1 ? userDetailData.users[0] : null

  const [updateUser] = useUpdateUserMutation()

  // no selected user. do not show the panel
  if (!userDetailData.users?.length) {
    return <></>
  }

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
    <Section style={{ maxWidth: 500 }}>
      <Panel>
        {singleUserEdit && (
          <>
            <h2>{singleUserEdit.attrib.fullName || singleUserEdit.name}</h2>
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
