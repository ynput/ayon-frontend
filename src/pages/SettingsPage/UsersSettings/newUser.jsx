import { useEffect, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { Button, Divider, SaveButton, Section, Dialog } from '@ynput/ayon-react-components'
import { useAddUserMutation } from '/src/services/user/updateUser'
import ayonClient from '/src/ayon'
import UserAttribForm from './UserAttribForm'
import UserAccessForm from './UserAccessForm'

import styled from 'styled-components'
import UserAccessGroupsForm from './UserAccessGroupsForm/UserAccessGroupsForm'

const DividerSmallStyled = styled(Divider)`
  margin: 8px 0;
`

const FooterButtons = styled.div`
  display: flex;
  justify-content: flex-end;
`

const SubTitleStyled = styled.span`
  margin-top: 16px;
  margin-bottom: 0;
`

const NewUser = ({ onHide, open, onSuccess, accessGroupsData }) => {
  const usernameRef = useRef()

  const [addedUsers, setAddedUsers] = useState([])
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')

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

    // check passwords are the same
    if (password !== passwordConfirm) {
      toast.error('Passwords do not match')
      return
    }

    if (password) payload.password = password

    payload.attrib = {}
    payload.data = {}
    if (formData.isGuest) payload.data.isGuest = true
    attributes.forEach(({ name }) => {
      if (formData[name]) payload.attrib[name] = formData[name]
    })

    if (formData.userLevel === 'admin') payload.data.isAdmin = true
    else if (formData.userLevel === 'manager') payload.data.isManager = true
    else if (formData.userLevel === 'service') payload.data.isService = true
    else {
      payload.data.defaultAccessGroups = formData.defaultAccessGroups || []
      payload.data.accessGroups = formData.accessGroups || {}
    }

    payload.name = formData.Username

    try {
      await addUser({ name: formData.Username, user: payload }).unwrap()

      toast.success('User created')
      // set added users to be used for auto selection onHide
      setAddedUsers([...addedUsers, formData.Username])
      // keep re-usable data in the form
      setPassword('')
      setPasswordConfirm('')
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
    setPasswordConfirm('')
    // reset added users
    setAddedUsers([])
    // close the dialog
    onHide(addedUsers)
  }

  const handleKeyDown = (e) => {
    // if enter then submit
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey || e.shiftKey) && formData.Username) {
      e.preventDefault()
      const closeOnSubmit = e.ctrlKey || e.metaKey
      handleSubmit(closeOnSubmit)
    }
  }

  if (!open) return null

  return (
    <Dialog
      // onKeyDown={handleKeyDown}
      isOpen
      size="full"
      style={{
        width: '90vw',
        maxWidth: 700,
      }}
      header={'Create New User'}
      onClose={handleClose}
      footer={
        <FooterButtons>
          <Button
            label="Create user"
            onClick={() => handleSubmit(false)}
            disabled={!formData.Username}
            data-shortcut="Shift+Enter"
          ></Button>
          <SaveButton
            onClick={() => handleSubmit(true)}
            label="Create and close"
            active={formData.Username}
            saving={isCreatingUser}
            data-shortcut="Ctrl/Cmd+Enter"
          />
        </FooterButtons>
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
        <SubTitleStyled>
          Give this new user access to projects by adding access groups per project
        </SubTitleStyled>
        {formData?.userLevel === 'user' && (
          <UserAccessGroupsForm
            // value expects multiple users, so we need to pass an object with the username "_" as the key
            value={{ _: formData.accessGroups }}
            options={accessGroupsData}
            // onChange provides all "users", in this case just the one "_" user
            onChange={(value) => setFormData({ ...formData, accessGroups: value['_'] })}
            disableNewGroup
          />
        )}
      </Section>
    </Dialog>
  )
}

export default NewUser
