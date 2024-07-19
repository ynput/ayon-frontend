import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'
import { SelectButton } from 'primereact/selectbutton'

import { Button, Divider, SaveButton, Section, Dialog, FormRow } from '@ynput/ayon-react-components'
import ayonClient from '@/ayon'
import ApiKeyManager from '@/components/ApiKeyManager'
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
  const usernameRef = useRef()

  const [addedUsers, setAddedUsers] = useState([])
  const [password, setPassword] = useState('')

  const initFormData = {
    userLevel: 'user',
    userActive: true,
    UserImage: '',
    isGuest: false,
    accessGroups: {},
    defaultAccessGroups: [],
  }

  const [formData, setFormData] = useState(initFormData)

  const initialFormData = () => {
    return initFormData
  }
  useEffect(() => {
    // set initial form data
    setFormData(initialFormData())
  }, [])

  const [addUser, { isLoading: isCreatingUser }] = useAddUserMutation()

  const attributes = ayonClient.getAttribsByScope('user')

  const handleSubmit = async (close) => {
    const payload = {}
    if (!formData.Username) {
      toast.error('Login name must be provided')
      return
    }

    if (password) payload.password = password

    payload.attrib = {}
    payload.data = {}
    attributes.forEach(({ name }) => {
      if (formData[name]) payload.attrib[name] = formData[name]
    })

    payload.name = formData.Username
    payload.data.isService = true

    try {
      await addUser({ name: formData.Username, user: payload }).unwrap()

      toast.success('Service User created')
      // set added users to be used for auto selection onHide
      setAddedUsers([...addedUsers, formData.Username])
      // keep reusable data in the form
      setPassword('')
      setFormData((fd) => {
        return { accessGroups: fd.accessGroups, userLevel: fd.userLevel }
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
    // clear all forms
    setFormData(initialFormData())
    setPassword('')
    // reset added users
    setAddedUsers([])
    // close the dialog
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
