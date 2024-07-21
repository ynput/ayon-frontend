import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Button, Divider, SaveButton, Section, Dialog, FormRow } from '@ynput/ayon-react-components'
import { SelectButton } from 'primereact/selectbutton'
import { useAddUserMutation } from '@queries/user/updateUser'
import ayonClient from '@/ayon'
import UserAttribForm from './UserAttribForm'
import UserAccessForm from './UserAccessForm'

import styled from 'styled-components'
import UserAccessGroupsForm from './UserAccessGroupsForm/UserAccessGroupsForm'
import ApiKeyManager from '@/components/ApiKeyManager'
import useUserMutations from '@/containers/Feed/hooks/useUserMutations'

const FormRowStyled = styled(FormRow)`
  .label {
    min-width: 160px;
  }
`
const DividerSmallStyled = styled(Divider)`
  margin: 8px 0;
`

const SubTitleStyled = styled.span`
  margin-top: 16px;
  margin-bottom: 0;
`

const NewUser = ({ onHide, open, onSuccess, accessGroupsData }) => {
  const {
    password, setPassword,
    passwordConfirm, setPasswordConfirm,
    formData, setFormData,
    addedUsers,
    resetFormData,
  } = useUserMutations({})
  const [addUser, { isLoading: isCreatingUser }] = useAddUserMutation()
  const usernameRef = useRef()

  const attributes = ayonClient.getAttribsByScope('user')

  const validateFormData = (formData) => {
    if (!formData.Username) {
      return 'Login name must be provided';
    }

    if (password !== passwordConfirm) {
      return 'Passwords do not match';
    }

    return null;
  }

  const preparePayload = (formData, attributes, password) => {
    const payload = {
      data: {},
      attrib: {},
      name: formData.Username,
      password: password ? password : undefined,
      isGuest: formData.isGuest ? true : undefined,
    }

    attributes.forEach(({ name }) => {
      if (formData[name]) payload.attrib[name] = formData[name]
    })

    if (formData.userLevel === 'admin') payload.data.isAdmin = true
    else if (formData.userLevel === 'manager') payload.data.isManager = true
    else {
      payload.data.defaultAccessGroups = formData.defaultAccessGroups || []
      payload.data.accessGroups = formData.accessGroups || {}
    }

    return payload;
  }

  const handleSubmit = async (close) => {
    const validationResult = validateFormData(formData);
    if (validationResult !== null) {
      toast.error(validationResult)
      return
    }

    try {
      await addUser({ name: formData.Username, user: preparePayload(formData, attributes, password) }).unwrap()
      toast.success('User created')

      resetFormData({
        password: '',
        passwordConfirm: '',
        formData: (fd) => { return { accessGroups: fd.accessGroups, userLevel: fd.userLevel } },
        addedUsers: [...addedUsers, formData.Username]
      });

      onSuccess && onSuccess(formData.Username)

      if (close) {
        onHide([formData.Username])
      } else {
        usernameRef.current?.focus()
      }
    } catch (error) {
      console.error(error)
      toast.error(`Unable to create user: ${error.detail}`)
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
      onKeyDown={(e) => callbackOnKeyDown(e, {validationPassed: formData.Username, callback: handleSubmit}) }
      isOpen
      size="full"
      style={{
        width: '90vw',
        maxWidth: 700,
      }}
      header={'Create New User'}
      onClose={handleClose}
      footer={
        <>
          <Button
            label="Create user"
            onClick={() => handleSubmit(false)}
            disabled={!formData.Username}
            data-shortcut="Shift+Enter"
          ></Button>
          <SaveButton
            onClick={() => handleSubmit(true)}
            label="Create and close"
            disabled={!formData.Username}
            saving={isCreatingUser}
            data-shortcut="Ctrl/Cmd+Enter"
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
        {formData?.userLevel === 'user' && (
          <>
            <SubTitleStyled>
              Give this new user access to projects by adding access groups per project
            </SubTitleStyled>
            <UserAccessGroupsForm
              // value expects multiple users, so we need to pass an object with the username "_" as the key
              value={{ _: formData.accessGroups }}
              options={accessGroupsData}
              // onChange provides all "users", in this case just the one "_" user
              onChange={(value) => setFormData({ ...formData, accessGroups: value['_'] })}
              disableNewGroup
            />
          </>
        )}
      </Section>
    </Dialog>
  )
}

export default NewUser
