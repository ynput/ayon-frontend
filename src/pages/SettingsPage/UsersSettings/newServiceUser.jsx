import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { SelectButton } from 'primereact/selectbutton'

import { Button, Divider, SaveButton, Section, Dialog, FormRow } from '@ynput/ayon-react-components'
import ayonClient from '@/ayon'
import ApiKeyManager from '@/components/ApiKeyManager'
import useUserMutations from '@/containers/Feed/hooks/useUserMutations'
import { useAddUserMutation } from '@queries/user/updateUser'
import copyToClipboard from '@/helpers/copyToClipboard'
import callbackOnKeyDown from '@/helpers/callbackOnKeyDown'

import UserAccessGroupsForm from './UserAccessGroupsForm/UserAccessGroupsForm'
import UserAttribForm from './UserAttribForm'
import UserAccessForm from './UserAccessForm'

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

const NewServiceUser = ({ onHide, open, onSuccess, accessGroupsData }) => {
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

    return null;
  }

  const preparePayload = (formData, attributes, password) => {
    const payload = {
      data: {
        isService: true,
        defaultAccessGroups: formData.defaultAccessGroups || [],
        accessGroups: formData.accessGroups || {},
      },
      attrib: {},
      name: formData.Username,
      password: password ? password : undefined,
      isGuest: formData.isGuest ? true : undefined,
    }

    attributes.forEach(({ name }) => {
      if (formData[name]) payload.attrib[name] = formData[name]
    })

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
      toast.success('Service User created')

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

  const handleApiKeyGeneration = (key) => {
    copyToClipboard(key);
    setPassword(key + 'Rand.123');
  }

  if (!open) return null

  return (
    <Dialog
      onKeyDown={(e) => callbackOnKeyDown(e, {
        validationPassed: formData.Username && password,
        callback: handleSubmit,
      })}
      isOpen
      size="full"
      style={{
        width: '90vw',
        maxWidth: 700,
      }}
      header={'Create Service User'}
      onClose={handleClose}
      footer={
        <>
          <Button
            label="Create user"
            onClick={() => handleSubmit(false)}
            disabled={!formData.Username || !password}
            data-shortcut="Shift+Enter"
          />
          <SaveButton
            onClick={() => handleSubmit(true)}
            label="Create and close"
            disabled={!formData.Username || !password}
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
          attributes={[{
            name: 'Username',
            data: { title: 'Username' },
            input: { placeholder: 'No spaces allowed', autoFocus: true, ref: usernameRef },
          }]}
          customFormRow={FormRowStyled}
          {...{ password, setPassword }}
        />

        <FormRowStyled label="User active">
          <SelectButton
            unselectable={false}
            value={formData?.userActive}
            onChange={(event) => setFormData({ ...formData, 'userActive': event.value })}
            options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} />
        </FormRowStyled>

        <FormRowStyled label="Service user key" />

        <ApiKeyManager name='new user' autosave={false} onGenerate={handleApiKeyGeneration} repeatGenerate={false} lightBackground={true} />
      </Section>
    </Dialog>
  )
}

export default NewServiceUser
