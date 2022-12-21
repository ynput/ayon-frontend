import axios from 'axios'

import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Button, Spacer, Section, Toolbar, Panel } from '@ynput/ayon-react-components'
import { isEmpty } from '/src/utils'
import { UserAttrib, AccessControl } from './forms'

const UserDetail = ({ userDetailData, onTriggerReload }) => {
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

      if (!(data.isAdmin || data.isManager || data.isService)) {
        if (!isEmpty(roles)) data.roles = roles
      } else {
        data.roles = null
      }

      // Apply the patch

      try {
        await axios.patch(`/api/users/${user.name}`, {
          active: formData.userActive,
          attrib,
          data,
        })
      } catch {
        toast.error(`Unable to update user ${user.name} `)
      }
    } // for user
    onTriggerReload()
  }

  //
  // Render
  //

  return (
    <Section style={{ maxWidth: 500 }}>
      <Toolbar>
        <Button onClick={onSave} label="Save selected users" icon="check" />
        <Spacer />
      </Toolbar>
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
      </Panel>
    </Section>
  )
}

export default UserDetail
