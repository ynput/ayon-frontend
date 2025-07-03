import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { useDispatch } from 'react-redux'
import {
  Button,
  Section,
  Panel,
  FormRow,
  LockedInput,
  SaveButton,
} from '@ynput/ayon-react-components'
import { useUpdateUsersMutation } from '@shared/api'
import { updateUserData, updateUserAttribs } from '@state/user'
import styled from 'styled-components'
import ayonClient from '@/ayon'
import UserAttribForm from './UserAttribForm'
import UserAccessForm from './UserAccessForm'
import ServiceDetails from './ServiceDetails'
import UserDetailsHeader from '@components/User/UserDetailsHeader'
import { cloneDeep, isEqual } from 'lodash'
import UserLicenseForm from './UserLicenseForm'

const FormsStyled = styled.section`
  flex: 1;
  overflow-x: clip;
  overflow-y: auto;
  gap: var(--base-gap-small);
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

const attribTypeDefaults = {
  string: '',
  boolean: false,
  number: 0,
  list_of_strings: [],
}

const fields = [
  {
    name: 'userActive',
    label: 'User Active',
    data: {
      type: 'boolean',
    },
  },
  {
    name: 'userPool',
    label: 'User Pool',
    data: {
      type: 'string',
    },
  },
  {
    name: 'disablePasswordLogin',
    label: 'Disable Password Login',
    data: {
      type: 'boolean',
    },
  },
  {
    name: 'userLevel',
    label: 'User Level',
    data: {
      type: 'string',
    },
  },
  {
    name: 'isGuest',
    label: 'Guest',
    data: {
      type: 'boolean',
    },
  },
  {
    name: 'isDeveloper',
    label: 'Developer',
    data: {
      type: 'boolean',
    },
  },
  {
    name: 'defaultAccessGroups',
    label: 'Default access groups',
    data: {
      type: 'list_of_strings',
    },
  },
]

const mergeMultipleUsers = (users = [], defaultForm = {}, initForm = {}) => {
  // now for each user, merge the data into the form
  users.forEach((user, index) => {
    if (!user) return
    const attribs = user.attrib || {}
    // merge attribs
    for (const name in attribs) {
      // check if attrib exists in form and is not undefined or null
      if (initForm[name] !== undefined && attribs[name] !== null) {
        // check if value is the same and not first, if not set to default
        if (index !== 0 && initForm[name] !== attribs[name]) initForm[name] = defaultForm[name]
        else initForm[name] = attribs[name]
      }
    }

    // userActive
    if (index !== 0 && initForm.userActive !== user.active)
      initForm.userActive = defaultForm.userActive
    else initForm.userActive = user.active

    // disablePasswordLogin
    if (index !== 0 && initForm.disablePasswordLogin !== user.disablePasswordLogin)
      initForm.disablePasswordLogin = defaultForm.disablePasswordLogin
    else initForm.disablePasswordLogin = user.disablePasswordLogin

    // userPool
    if (index !== 0 && initForm.userPool !== user.userPool) {
      if (!initForm._mixedFields.includes('userPool')) {
        initForm._mixedFields.push('userPool')
      }
    } else initForm.userPool = user.userPool

    // isGuest
    if (index !== 0 && initForm.isGuest !== user.isGuest) initForm.isGuest = defaultForm.isGuest
    else initForm.isGuest = user.isGuest

    // isDeveloper
    if (index !== 0 && initForm.isDeveloper !== user.isDeveloper)
      initForm.isDeveloper = defaultForm.isDeveloper
    else initForm.isDeveloper = user.isDeveloper

    // userLevel
    let userLevel = 'user'
    if (user?.isAdmin) userLevel = 'admin'
    else if (user?.isService) userLevel = 'service'
    else if (user?.isManager) userLevel = 'manager'

    if (index !== 0 && initForm.userLevel !== userLevel) initForm.userLevel = defaultForm.userLevel
    else initForm.userLevel = userLevel

    // if form defaultAccessGroups does no contain an access group in current user, add it
    if (user.defaultAccessGroups) {
      // check if defaultAccessGroups is the same as the current array
      if (index !== 0 && !isEqual(initForm.defaultAccessGroups, user.defaultAccessGroups)) {
        // it's a mixed field, add it to the mixed fields array
        if (!initForm._mixedFields.includes('defaultAccessGroups'))
          initForm._mixedFields.push('defaultAccessGroups')
      }

      for (const project in user.defaultAccessGroups) {
        if (!initForm.defaultAccessGroups) initForm.defaultAccessGroups = []
        if (!initForm.defaultAccessGroups.includes(user.defaultAccessGroups[project])) {
          initForm.defaultAccessGroups.push(user.defaultAccessGroups[project])
        }
      }
    }

    //  we don't merge the access groups at all. Show and save mixed values
    if (user.accessGroups) {
      // add access groups to the form with user names as key
      initForm.accessGroups[user.name] = user.accessGroups
    }
  })
}

// this transforms all the selected users into a single form data object
const buildFormData = (users = [], attributes) => {
  // first build empty form data
  const defaultForm = {
    ...[...attributes, ...fields].reduce(
      (acc, { name, data }) => {
        acc[name] = attribTypeDefaults[data?.type]
        return acc
      },
      { _mixedFields: [] },
    ),
    // access groups is custom field
    accessGroups: {},
  }

  const initForm = cloneDeep(defaultForm)

  // merge the data of all (even just 1) users into the form
  mergeMultipleUsers(users, defaultForm, initForm)

  return initForm
}

const UserDetail = ({
  setShowRenameUser,
  selectedUsers,
  setShowSetPassword,
  setSelectedUsers,
  isSelfSelected,
  selectedUserList,
  managerDisabled,
  accessGroupsData,
  isFetchingUsers,
}) => {
  const [formData, setFormData] = useState(null)
  const [initData, setInitData] = useState({})
  const [changesMade, setChangesMade] = useState([])
  const [formUsers, setFormUsers] = useState([])
  const toastId = useRef(null)

  const attributes = ayonClient.getAttribsByScope('user')
  const dispatch = useDispatch()

  useEffect(() => {
    // have the selected users changed?
    if (selectedUsers.length === 0 || isFetchingUsers) return

    setFormUsers(selectedUserList)

    const builtFormData = buildFormData(selectedUserList, attributes)

    setFormData(builtFormData)
    // used to compare changes later
    setInitData(builtFormData)
  }, [selectedUserList, selectedUsers, isFetchingUsers])

  // look for changes when formData changes
  useEffect(() => {
    if (!formData || !initData) return

    const {
      accessGroups: formDataAccessGroups,
      defaultAccessGroups: formDataDefaultAccessGroups,
      ...formDataWithoutAccessGroups
    } = formData || {}
    const {
      accessGroups: initDataAccessGroups,
      defaultAccessGroups: initDataDefaultAccessGroups,
      ...initDataWithoutAccessGroups
    } = initData || {}

    // Check which fields have changed
    const changedFields = []

    // Check regular fields
    Object.keys(formDataWithoutAccessGroups).forEach((key) => {
      if (!isEqual(formDataWithoutAccessGroups[key], initDataWithoutAccessGroups[key])) {
        changedFields.push(key)
      }
    })

    // Check access groups
    if (!isEqual(formDataAccessGroups, initDataAccessGroups)) {
      changedFields.push('accessGroups')
    }

    // Check default access groups
    if (!isEqual(formDataDefaultAccessGroups, initDataDefaultAccessGroups)) {
      changedFields.push('defaultAccessGroups')
    }

    const isDiff = changedFields.length > 0 || selectedUsers.length > 1

    if (isDiff && (!isSelfSelected || selectedUsers.length === 1)) {
      setChangesMade(changedFields)
    } else {
      setChangesMade([])
    }
  }, [formData, initData, selectedUsers])

  // editing a single user, so show attributes form too
  const singleUserEdit = selectedUsers.length === 1 ? formUsers[0] : null
  // check if any users have the userLevel of service
  const hasServiceUser = formUsers.some((user) => user.isService)

  const [updateUsers, { isLoading: isUpdating }] = useUpdateUsersMutation()

  //
  // API
  //

  const onSave = async () => {
    const usersString = `user${formUsers.length > 1 ? 's' : ''}`
    toastId.current = toast.info(`Updating ${usersString}...`)
    const updates = []
    for (const user of formUsers) {
      const data = {}
      const attrib = {}
      const patch = {}

      // Only update changed fields
      for (const field of changesMade) {
        if (field === 'accessGroups') {
          data.accessGroups = formData.accessGroups[user.name]
        } else if (field === 'defaultAccessGroups') {
          data.defaultAccessGroups = formData.defaultAccessGroups
        } else if (field === 'userLevel') {
          data.isAdmin = formData.userLevel === 'admin'
          data.isManager = formData.userLevel === 'manager'
          data.isService = formData.userLevel === 'service'
        } else if (field === 'userPool') {
          data.userPool = formData.userPool
        } else if (field === 'userActive') {
          patch.active = formData.userActive
        } else if (field === 'isGuest') {
          data.isGuest = formData.isGuest
        } else if (field === 'isDeveloper') {
          data.isDeveloper = formData.isDeveloper && formData.userLevel === 'admin'
        } else if (singleUserEdit && attributes.find((a) => a.name === field)) {
          attrib[field] = formData[field]
        } else if (field === 'disablePasswordLogin') {
          data.disablePasswordLogin = formData.disablePasswordLogin
        }
      }

      // Only include non-empty objects in the patch
      if (Object.keys(data).length > 0) patch.data = data
      if (Object.keys(attrib).length > 0) patch.attrib = attrib

      // Only push update if there are changes
      if (Object.keys(patch).length > 0) {
        updates.push({ name: user.name, patch })
      }

      // Update Redux state if it's the current user
      if (user.self) {
        if (Object.keys(data).length > 0) dispatch(updateUserData(data))
        if (Object.keys(attrib).length > 0) dispatch(updateUserAttribs(attrib))
      }
    }

    try {
      await updateUsers(updates).unwrap()

      setChangesMade([])
      toast.update(toastId.current, {
        render: `Updated ${usersString} successfully`,
        type: toast.TYPE.SUCCESS,
      })
    } catch (error) {
      console.error(error)
      toast.update(toastId.current, {
        render: `Error updating ${usersString}.`,
        type: toast.TYPE.ERROR,
      })
    }
  }

  const onCancel = () => {
    // reset data back to init
    setFormData(initData)
  }

  // onclose, no users selected but check if changes made
  const onClose = () => {
    if (changesMade.length && selectedUsers.length === 1) {
      return toast.error('Changes not saved')
    }
    setSelectedUsers([])
  }

  //
  // Render
  //

  const headerAccessGroups = formUsers.reduce((acc, user) => {
    let accessGroups = Object.entries(user.accessGroups)
      .map(([accessGroup]) => accessGroup)
      .flat()

    // if user is admin, he has also a manager role
    const isUserManager = user.isManager && !user.isAdmin
    const isUserAdmin = user.isManager && user.isAdmin

    // if user is admin or manager, clear other roles
    function replaceAccessRoles(role) {
      accessGroups.length = 0
      accessGroups.push(role)
    }

    // add admin, manager, service
    if (isUserManager) replaceAccessRoles('manager')
    if (isUserAdmin) replaceAccessRoles('admin')
    if (user.isService) replaceAccessRoles('service')

    return [...new Set([...acc, ...accessGroups])]
  }, [])

  return (
    <Section wrap style={{ gap: '4px', bottom: 'unset', maxHeight: '100%' }}>
      <UserDetailsHeader
        users={formUsers}
        onClose={onClose}
        subTitle={headerAccessGroups.length ? headerAccessGroups.join(', ') : 'No AccessGroups'}
      />
      {hasServiceUser && singleUserEdit ? (
        <FormsStyled>
          <ServiceDetails editName={() => setShowRenameUser(true)} user={singleUserEdit} />
        </FormsStyled>
      ) : (
        <FormsStyled>
          {singleUserEdit && (
            <Panel>
              <FormRow label="Username" key="Username">
                <LockedInput
                  value={singleUserEdit.name}
                  onEdit={() => setShowRenameUser(true)}
                  disabled={managerDisabled}
                />
              </FormRow>
              <FormRow label="Password" key="Password">
                <LockedInput
                  label="Password"
                  value={singleUserEdit.hasPassword ? '1234567890' : ''}
                  type="password"
                  onEdit={() => setShowSetPassword(true)}
                  disabled={managerDisabled}
                />
              </FormRow>
              {formData && (
                <UserAttribForm
                  formData={formData}
                  setFormData={setFormData}
                  attributes={attributes}
                  disabled={managerDisabled}
                />
              )}
            </Panel>
          )}
          {formData && (
            <Panel>
              <UserLicenseForm
                active={formData.userActive}
                onActiveChange={(value) => setFormData({ ...formData, userActive: value })}
                pool={formData.userPool}
                isPoolMixed={formData._mixedFields.includes('userPool')}
                onPoolChange={(value) => setFormData({ ...formData, userPool: value })}
                isDisabled={isSelfSelected}
              />
            </Panel>
          )}
          {formData && (
            <Panel>
              <UserAccessForm
                formData={formData}
                onChange={(key, value) => setFormData({ ...formData, [key]: value })}
                disabled={managerDisabled || isSelfSelected}
                accessGroupsData={accessGroupsData}
              />
            </Panel>
          )}
        </FormsStyled>
      )}
      <PanelButtonsStyled>
        <Button
          onClick={onCancel}
          label="Cancel"
          icon="clear"
          disabled={!changesMade.length || selectedUsers.length > 1}
        />
        <SaveButton
          onClick={onSave}
          label="Save selected users"
          active
          saving={isUpdating || isFetchingUsers}
          disabled={isUpdating || isFetchingUsers || !changesMade.length}
        />
      </PanelButtonsStyled>
    </Section>
  )
}

export default UserDetail
