import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { Button, Panel, Section, UserImage } from '@ynput/ayon-react-components'
import ProjectList from '/src/containers/projectList'
import { useAddUserMutation } from '/src/services/user/updateUser'
import ayonClient from '/src/ayon'
import UserAttribForm from './UserAttribForm'
import UserAccessForm from './UserAccessForm'
import DetailHeader from '/src/components/DetailHeader'
import { PanelButtonsStyled } from './userDetail'
import styled from 'styled-components'

const SectionStyled = styled(Section)`
  & > div {
    :first-child {
      border-top: 2px solid var(--color-hl-studio);
    }
    :last-child {
      border-bottom: 2px solid var(--color-hl-studio);
    }
  }
`

const NewUser = ({ onHide, open, onSuccess }) => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [addedUsers, setAddedUsers] = useState([])
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [formData, setFormData] = useState({
    userLevel: 'user',
    userActive: true,
    UserImage: '',
  })

  const initialFormData = () => {
    return {
      userLevel: 'user',
      userActive: true,
      UserImage: '',
    }
  }
  useEffect(() => {
    // set initial form data
    setFormData(initialFormData())
  }, [])

  const [addUser] = useAddUserMutation()

  const attributes = ayonClient.getAttribsByScope('user')

  const handleSubmit = async () => {
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
      payload.data.defaultRoles = formData.defaultRoles || []
      if (selectedProjects) {
        const roles = {}
        for (const projectName of selectedProjects) roles[projectName] = payload.data.defaultRoles
        payload.data.roles = roles
      }
    }

    payload.name = formData.Username

    try {
      await addUser({ name: formData.Username, user: payload }).unwrap()

      toast.success('User created')
      // set added users to be used for auto selection onHide
      setAddedUsers([...addedUsers, formData.Username])
      // keep re-usable data in the form
      setPassword('')
      setFormData((fd) => {
        return { roles: fd.roles, userLevel: fd.userLevel }
      })

      onSuccess && onSuccess(formData.Username)
    } catch (error) {
      console.error(error)
      toast.error(`Unable to create user: ${error.detail}`)
    }
  }

  const handleCancel = () => {
    // clear all forms
    setFormData(initialFormData())
    setPassword('')
    setPasswordConfirm('')
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

  // When hide the dialog here so that state is maintained
  // even when the dialog is closed
  if (!open) return null

  return (
    <SectionStyled className="wrap" style={{ gap: 4, maxHeight: '100%', bottom: 'unset' }}>
      <DetailHeader onClose={handleClose}>
        <UserImage
          src={formData?.avatarUrl}
          fullName={formData.fullName || formData.Username || '+'}
        />
        <div>
          <h2>Create New User</h2>
          <span style={{ opacity: addedUsers.length ? 1 : 0 }}>
            Previously Created: {addedUsers.join(', ')}
          </span>
        </div>
      </DetailHeader>
      <Section style={{ overflow: 'auto', gap: 4 }}>
        <Panel>
          <UserAttribForm
            formData={formData}
            setFormData={setFormData}
            attributes={[
              { name: 'Username', data: { title: 'Username' } },
              { name: 'password', data: { title: 'Password' } },
              { name: 'passwordConfirm', data: { title: 'Password Confirm' } },
              ...attributes,
            ]}
            {...{ password, setPassword, passwordConfirm, setPasswordConfirm }}
          />
        </Panel>
        <Panel>
          <UserAccessForm formData={formData} setFormData={setFormData} hideProjectRoles />
        </Panel>
        {formData.userLevel === 'user' && (
          <Panel>
            <span style={{ margin: '8px 0' }}>
              <b>Apply default roles to:</b>
            </span>
            <ProjectList
              selection={selectedProjects}
              onSelect={setSelectedProjects}
              multiselect={true}
              styleSection={{ maxWidth: 'unset' }}
            />
          </Panel>
        )}
      </Section>
      <PanelButtonsStyled>
        <Button onClick={handleCancel} label="Clear" icon="cancel" />
        <Button onClick={handleSubmit} label="Create New User" icon="person_add" />
      </PanelButtonsStyled>
    </SectionStyled>
  )
}

export default NewUser
