import { useState, useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import {
  Button,
  Section,
  Panel,
  FormRow,
  LockedInput,
  SaveButton,
} from '@ynput/ayon-react-components'
import { useUpdateUserMutation } from '/src/services/user/updateUser'
import styled from 'styled-components'
import ayonClient from '/src/ayon'
import UserAttribForm from './UserAttribForm'
import UserAccessForm from './UserAccessForm'
import { confirmDialog } from 'primereact/confirmdialog'
import ServiceDetails from './ServiceDetails'
import UserDetailsHeader from '/src/components/User/UserDetailsHeader'
import { isEqual } from 'lodash'

const FormsStyled = styled.section`
  flex: 1;
  overflow-x: clip;
  overflow-y: auto;
  gap: 4px;
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

// this transforms all the selected users into a single form data object
const buildFormData = (users = [], attributes) => {
  // first build empty form data
  const defaultForm = {
    ...[...attributes, ...fields].reduce((acc, { name, data }) => {
      acc[name] = attribTypeDefaults[data?.type]
      return acc
    }, {}),
    // access groups is custom field
    accessGroups: {},
  }

  const initForm = {
    ...defaultForm,
  }

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

    // defaultAccessGroups
    if (index !== 0 && initForm.defaultAccessGroups !== user.defaultAccessGroups) {
      initForm.defaultAccessGroups = defaultForm.defaultAccessGroups
    } else {
      initForm.defaultAccessGroups = user.defaultAccessGroups
    }

    // AccessGroups
    if (user.accessGroups) {
      for (const project in user.accessGroups) {
        if (!initForm.accessGroups[project]) initForm.accessGroups[project] = []
        initForm.accessGroups[project] = [
          ...new Set([...initForm.accessGroups[project], ...user.accessGroups[project]]),
        ]
      }
    }
  })

  return initForm
}

const UserDetail = ({
  setShowRenameUser,
  selectedUsers,
  setShowSetPassword,
  selectedProjects,
  setSelectedUsers,
  isSelfSelected,
  selectedUserList,
  managerDisabled,
}) => {
  const [formData, setFormData] = useState(null)
  const [initData, setInitData] = useState({})
  const [changesMade, setChangesMade] = useState(false)
  const [formUsers, setFormUsers] = useState([])
  const toastId = useRef(null)

  const attributes = ayonClient.getAttribsByScope('user')

  useEffect(() => {
    // have the selected users changed?
    if (selectedUsers.length === 0) return

    setFormUsers(selectedUserList)

    // return if the selectedUsers is the same as formUsers
    if (
      formUsers.every((user) => selectedUsers.includes(user.name)) &&
      selectedUsers.length === formUsers.length
    )
      return

    const builtFormData = buildFormData(selectedUserList, attributes)

    setFormData(builtFormData)
    // used to compare changes later
    setInitData(builtFormData)
  }, [selectedUserList, selectedUsers])

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

    const isDiffForm = !isEqual(formDataWithoutAccessGroups, initDataWithoutAccessGroups)
    const isDiffAccessGroups = !isEqual(formDataAccessGroups, initDataAccessGroups)
    const isDiffDefaultAccessGroups = !isEqual(
      formDataDefaultAccessGroups,
      initDataDefaultAccessGroups,
    )

    const isDiff =
      isDiffForm || isDiffAccessGroups || isDiffDefaultAccessGroups || selectedUsers.length > 1

    if (isDiff && (!isSelfSelected || selectedUsers.length === 1)) {
      if (!changesMade) setChangesMade(true)
    } else {
      setChangesMade(false)
    }
  }, [formData, initData, selectedUsers, formData?.accessGroups])

  // editing a single user, so show attributes form too
  const singleUserEdit = selectedUsers.length === 1 ? formUsers[0] : null
  // check if any users have the userLevel of service
  const hasServiceUser = formUsers.some((user) => user.isService)

  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()

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
          <li>Access Level: {formData.userLevel}</li>
          <li>Is Guest: {formData.isGuest ? 'Yes' : 'No'}</li>
          <li>Is Developer: {formData.isDeveloper ? 'Yes' : 'No'}</li>
          <li>
            AccessGroups: {formData.accessGroups?.length ? formData.accessGroups.join(', ') : ''}
          </li>
        </ul>
      ),

      accept: onSave,
      reject: () => {},
    })
  }

  const onSave = async () => {
    toastId.current = toast.info('Updating user(s)...')
    let i = 0
    for (const user of formUsers) {
      const data = {
        accessGroups: formData.accessGroups,
        defaultAccessGroups: formData.defaultAccessGroups,
      }
      const attrib = {}

      if (singleUserEdit) {
        attributes.forEach(({ name }) => (attrib[name] = formData[name]))
      }

      // update user level && do access group clean-up
      data.isAdmin = formData.userLevel === 'admin'
      data.isManager = formData.userLevel === 'manager'
      data.isService = formData.userLevel === 'service'
      data.isGuest = formData.isGuest
      data.isDeveloper = formData.isDeveloper

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

        toast.update(toastId.current, { render: `Updated user: ${user.name} ` })
        i += 1
      } catch (error) {
        toast.error(`Unable to update user ${user.name} `)
        console.error(error)
      }
    } // for user
    toast.update(toastId.current, { render: `Updated ${i} user(s) `, type: toast.TYPE.SUCCESS })
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

  const headerAccessGroups = formUsers.reduce((acc, user) => {
    let accessGroups = Object.entries(user.accessGroups)
      .map(([project, accessGroup]) =>
        selectedProjects ? (selectedProjects?.includes(project) ? accessGroup : []) : accessGroup,
      )
      .flat()

    // add admin, manager, service
    if (user.isAdmin) accessGroups.push('admin')
    else if (user.isService) accessGroups.push('service')
    else if (user.isManager) accessGroups.push('manager')

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
              <UserAccessForm
                formData={formData}
                setFormData={setFormData}
                selectedProjects={selectedProjects}
                disabled={managerDisabled || isSelfSelected}
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
          disabled={!changesMade || selectedUsers.length > 1}
        />
        <SaveButton
          onClick={() => (selectedUsers.length > 1 ? handleMultiSave() : onSave())}
          label="Save selected users"
          active={changesMade}
          saving={isUpdating}
        />
      </PanelButtonsStyled>
    </Section>
  )
}

export default UserDetail
