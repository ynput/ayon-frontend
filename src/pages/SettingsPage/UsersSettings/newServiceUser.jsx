import { useRef, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { SelectButton } from 'primereact/selectbutton'

import { Button, SaveButton, Section, Dialog, FormRow } from '@ynput/ayon-react-components'
import ayonClient from '@/ayon'
import ApiKeyManager from '@/components/ApiKeyManager'
import useUserMutations from '@/containers/Feed/hooks/useUserMutations'
import { useAddUserMutation } from '@queries/user/updateUser'
import copyToClipboard from '@/helpers/copyToClipboard'
import callbackOnKeyDown from '@/helpers/callbackOnKeyDown'

import UserAttribForm from './UserAttribForm'

const FormRowStyled = styled(FormRow)`
  .label {
    min-width: 160px;
  }
`

const NewServiceUser = ({ onHide, open, onSuccess }) => {
  const {
    password, setPassword,
    formData, setFormData,
    apiKey, setApiKey,
    addedUsers,
    resetFormData,
  } = useUserMutations({})
  const [addUser, { isLoading: isCreatingUser }] = useAddUserMutation()
  const usernameRef = useRef()
  const [keyName, setKeyName] = useState('');

  const attributes = ayonClient.getAttribsByScope('user')

  const validateFormData = (formData) => {
    if (!formData.Username) {
      return 'Login name must be provided';
    }
    if (apiKey == '') {
      return 'Api key needs to be generated'
    }

    return null;
  }

  const preparePayload = (formData) => {
    const payload = {
      data: { isService: true },
      name: formData.Username,
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
      toast.success('Service User created')

      resetFormData({
        password: '',
        passwordConfirm: '',
        formData: (fd) => { return { accessGroups: fd.accessGroups, userLevel: fd.userLevel } },
        addedUsers: [...addedUsers, formData.Username]
      });
      setKeyName(new String(''))

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
    setApiKey(key);
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
