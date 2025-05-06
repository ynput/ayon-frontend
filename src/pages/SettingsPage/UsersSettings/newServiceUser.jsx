import { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

import { Button, SaveButton, Section, Dialog, FormRow } from '@ynput/ayon-react-components'
import ApiKeyManager from '@components/ApiKeyManager'
import useUserMutations from '@pages/SettingsPage/UsersSettings/useUserMutations'
import { useAddUserMutation } from '@shared/api'
import { copyToClipboard } from '@shared/util'
import callbackOnKeyDown from '@helpers/callbackOnKeyDown'

import UserAttribForm from './UserAttribForm'
import { uniqueId } from 'lodash'

const FormRowStyled = styled(FormRow)`
  .label {
    min-width: 160px;
  }
`

const NewServiceUser = ({ onHide, open, onSuccess }) => {
  const { formData, setFormData, apiKey, setApiKey, addedUsers, setAddedUsers } = useUserMutations(
    {},
  )

  const [addUser, { isLoading: isCreatingUser }] = useAddUserMutation()
  const usernameRef = useRef()
  const [keyName, setKeyName] = useState(uniqueId())

  const validateFormData = (formData) => {
    if (!formData.Username) {
      return 'Login name must be provided'
    }

    if (apiKey == '') {
      return 'Api key needs to be generated'
    }

    return null
  }

  const resetFormData = ({ addedUsers }) => {
    setFormData({
      Username: '',
    })
    // reset the api key
    setKeyName(uniqueId())
    setApiKey('')
    setAddedUsers(addedUsers)
  }

  const preparePayload = (formData, apiKey) => {
    const payload = {
      data: { isService: true },
      active: true,
      name: formData.Username,
      apiKey: apiKey,
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
      await addUser({ name: formData.Username, user: preparePayload(formData, apiKey) }).unwrap()
      toast.success('Service User created')

      resetFormData({
        addedUsers: [...addedUsers, formData.Username],
      })

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
      addedUsers: [],
    })
    onHide(addedUsers)
  }

  const handleApiKeyGeneration = (key) => {
    copyToClipboard(key)
    setApiKey(key)
  }

  if (!open) return null

  return (
    <Dialog
      onKeyDown={(e) =>
        callbackOnKeyDown(e, {
          validationPassed: validateFormData(formData) == null,
          callback: handleSubmit,
        })
      }
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
            disabled={validateFormData(formData) != null}
            data-shortcut="Shift+Enter"
          />
          <SaveButton
            onClick={() => handleSubmit(true)}
            label="Create and close"
            disabled={validateFormData(formData) != null}
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
          ]}
          customFormRow={FormRowStyled}
        />

        <FormRowStyled label="Service user key" />

        <ApiKeyManager
          name={keyName}
          autosave={false}
          onGenerate={handleApiKeyGeneration}
          repeatGenerate={false}
          lightBackground={true}
        />
      </Section>
    </Dialog>
  )
}

export default NewServiceUser
