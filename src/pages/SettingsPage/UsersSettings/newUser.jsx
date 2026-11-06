import { useEffect, useRef } from 'react'
import { toast } from 'react-toastify'
import { Button, Divider, SaveButton, Section, Dialog } from '@ynput/ayon-react-components'
import { useAddUserMutation } from '@shared/api'
import ayonClient from '@/ayon'
import UserAttribForm from './UserAttribForm'
import UserAccessForm from './UserAccessForm'

import styled from 'styled-components'
import useUserMutations from '@pages/SettingsPage/UsersSettings/useUserMutations'
import { getPlatformShortcutKey, KeyMode } from '@shared/util/platform'
import {
  getDialogKeyDown,
  getRequestErrorString,
  readDialogMemory,
  writeDialogMemory,
} from '@shared/util'

// the access a new user gets, kept for the session: users are often added in batches with the same access
const ACCESS_MEMORY = 'new-user-access'
const pickAccess = ({ userLevel, accessGroups, defaultAccessGroups }) => ({
  userLevel,
  accessGroups,
  defaultAccessGroups,
})

const DividerSmallStyled = styled(Divider)`
  margin: 8px 0;
`

const NewUser = ({ onHide, open, onSuccess, accessGroupsData }) => {
  const {
    password,
    setPassword,
    passwordConfirm,
    setPasswordConfirm,
    initFormData,
    formData,
    setFormData,
    addedUsers,
    setAddedUsers,
  } = useUserMutations({})
  const [addUser, { isLoading: isCreatingUser }] = useAddUserMutation()
  const usernameRef = useRef()

  const attributes = ayonClient.getAttribsByScope('user')

  // start each new user with the access the last one got
  useEffect(() => {
    if (open) setFormData({ ...initFormData, ...readDialogMemory(ACCESS_MEMORY) })
  }, [open])

  const resetFormData = ({ password, passwordConfirm, formData, addedUsers }) => {
    setPassword(password)
    setPasswordConfirm(passwordConfirm)
    setFormData(formData != undefined ? formData : initFormData)
    setAddedUsers(addedUsers)
  }

  const validateFormData = (formData) => {
    if (!formData.Username) {
      return 'Login name must be provided'
    }

    if (password !== passwordConfirm) {
      return 'Passwords do not match'
    }

    return null
  }

  const preparePayload = (formData, attributes, password) => {
    const payload = {
      data: {},
      attrib: {},
      name: formData.Username?.trim(),
      password: password ? password : undefined,
    }

    attributes.forEach(({ name }) => {
      if (formData[name]) {
        const value = formData[name]
        payload.attrib[name] = typeof value === 'string' ? value.trim() : value
      }
    })

    if (formData.userLevel === 'admin') payload.data.isAdmin = true
    else if (formData.userLevel === 'manager') payload.data.isManager = true
    else {
      payload.data.defaultAccessGroups = formData.defaultAccessGroups || []
      payload.data.accessGroups = formData.accessGroups || {}
    }

    return payload
  }

  const handleSubmit = async (close) => {
    const validationResult = validateFormData(formData)
    if (validationResult !== null) {
      toast.error(validationResult)
      return
    }

    try {
      await addUser({
        name: formData.Username,
        user: preparePayload(formData, attributes, password),
      }).unwrap()
      toast.success('User created')
      writeDialogMemory(ACCESS_MEMORY, pickAccess(formData))

      resetFormData({
        password: '',
        passwordConfirm: '',
        formData: (fd) => ({ ...initFormData, ...pickAccess(fd) }),
        addedUsers: [...addedUsers, formData.Username],
      })

      onSuccess && onSuccess(formData.Username)

      if (close) {
        onHide([formData.Username])
      } else {
        usernameRef.current?.focus()
      }
    } catch (error) {
      toast.error(`Unable to create user: ${getRequestErrorString(error)}`)
    }
  }

  const handleClose = () => {
    resetFormData({
      password: '',
      passwordConfirm: '',
      addedUsers: [],
    })
    onHide(addedUsers)
  }

  if (!open) return null

  return (
    <Dialog
      onKeyDown={getDialogKeyDown(() => handleSubmit(true), {
        onClose: handleClose,
        disabled: !formData.Username || isCreatingUser,
        onContinue: () => handleSubmit(false),
      })}
      isOpen
      size="full"
      style={{
        width: '90vw',
        maxWidth: 700,
      }}
      enableBackdropClose={false}
      header={'Create New User'}
      onClose={handleClose}
      footer={
        <>
          <Button
            label="Create user"
            onClick={() => handleSubmit(false)}
            disabled={!formData.Username}
            data-shortcut={getPlatformShortcutKey('Enter', [KeyMode.Shift])}
          ></Button>
          <SaveButton
            onClick={() => handleSubmit(true)}
            label="Create and close"
            disabled={!formData.Username}
            saving={isCreatingUser}
            data-shortcut="Enter"
          />
        </>
      }
    >
      <Section>
        <UserAttribForm
          formData={formData}
          setFormData={setFormData}
          attributes={[
            {
              name: 'Username',
              data: { title: 'Username' },
              input: { placeholder: 'No spaces allowed', autoFocus: true, ref: usernameRef },
            },
            { name: 'password', data: { title: 'Password' } },
            { name: 'passwordConfirm', data: { title: 'Password Confirm' } },
            ...attributes,
          ]}
          {...{ password, setPassword, passwordConfirm, setPasswordConfirm }}
        />

        <DividerSmallStyled />

        <UserAccessForm
          formData={formData}
          onChange={(key, value) => setFormData({ ...formData, [key]: value })}
          accessGroupsData={accessGroupsData}
        />
      </Section>
    </Dialog>
  )
}

export default NewUser
