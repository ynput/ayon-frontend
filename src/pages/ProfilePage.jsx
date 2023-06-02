import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import SessionList from '/src/containers/SessionList'
import { FormRow, Section, Panel, LockedInput, Button } from '@ynput/ayon-react-components'
import { useGetMeQuery } from '../services/user/getUsers'
import { useUpdateUserMutation } from '../services/user/updateUser'
import UserDetailsHeader from '../components/User/UserDetailsHeader'
import styled from 'styled-components'
import UserAttribForm from './SettingsPage/UsersSettings/UserAttribForm'
import SetPasswordDialog from './SettingsPage/UsersSettings/SetPasswordDialog'
import ayonClient from '../ayon'
import axios from 'axios'
import { useDispatch } from 'react-redux'
import { logout } from '../features/user'
import { ayonApi } from '../services/ayon'

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

const ProfilePage = () => {
  const dispatch = useDispatch()
  const attributes = ayonClient.getAttribsByScope('user')
  // RTK QUERIES
  // GET USER DATA
  const { data: userData, isLoading, isError } = useGetMeQuery()
  const [showSetPassword, setShowSetPassword] = useState(false)

  // UPDATE USER DATA
  const [updateUser] = useUpdateUserMutation()

  // build initial form data
  const initialFormData = {}
  attributes.forEach((attrib) => {
    initialFormData[attrib.name] = ''
  })

  const [name, setName] = useState('')
  const [password] = useState('randompasswor')
  const [initData, setInitData] = useState(initialFormData)
  const [formData, setFormData] = useState(initialFormData)
  const [changesMade, setChangesMade] = useState(false)

  // once user data is loaded, set form data
  useEffect(() => {
    if (userData && !isLoading) {
      const { attrib } = userData

      const newFormData = {}
      attributes.forEach((att) => {
        newFormData[att.name] = attrib[att.name] || ''
      })

      setFormData(newFormData)
      // used to reset form
      setInitData(newFormData)

      // // set name
      setName(userData.name)
    }

    return () => {
      // reset forms
      setFormData(initialFormData)
      setName('')
    }
  }, [isLoading, userData])

  // look for changes when formData changes
  useEffect(() => {
    const isDiff = JSON.stringify(formData) !== JSON.stringify(initData)

    if (isDiff) {
      if (!changesMade) setChangesMade(true)
    } else {
      setChangesMade(false)
    }
  }, [formData, initData])

  if (isError) {
    toast.error('Unable to load user data')
  }

  const onCancel = () => {
    // reset data back to init
    setFormData(initData)
  }

  const onSave = async () => {
    try {
      await updateUser({
        name: userData.name,
        patch: {
          attrib: formData,
        },
      }).unwrap()

      toast.success('Profile updated')

      // reset form
      setInitData(formData)
      setChangesMade(false)
    } catch (error) {
      console.log(error)
      toast.error('Unable to update profile')
      toast.error(error.details)
    }
  }

  const doLogout = () => {
    axios
      .post('/api/auth/logout')
      .then((response) => {
        toast.info(response.data.detail)
        dispatch(logout())
        // reset global state
        dispatch(ayonApi.util.resetApiState())
      })
      .catch(() => {
        toast.error('Unable to log out. Weird.')
      })
  }

  return (
    <main>
      <Section style={{ flex: 2 }}>
        <h2>Active sessions</h2>
        <SessionList userName={userData?.name} />
      </Section>
      <Section style={{ flex: 1, maxWidth: 500, minWidth: 370 }}>
        <h2>Profile</h2>
        <UserDetailsHeader users={[userData]} />
        <FormsStyled>
          <Panel>
            <FormRow label="Username" key="Username">
              <LockedInput value={name} disabled />
            </FormRow>
            <FormRow label="Password" key="Password">
              <LockedInput
                label="Password"
                value={password}
                type="password"
                onEdit={() => setShowSetPassword(true)}
              />
            </FormRow>
            <UserAttribForm formData={formData} setFormData={setFormData} attributes={attributes} />
          </Panel>
          <PanelButtonsStyled>
            <Button onClick={onCancel} label="Cancel" icon="cancel" disabled={!changesMade} />
            <Button onClick={onSave} label="Save" icon="check" disabled={!changesMade} />
          </PanelButtonsStyled>
          <PanelButtonsStyled>
            <Button
              style={{ justifyContent: 'center' }}
              onClick={doLogout}
              label="Sign Out"
              icon="logout"
            />
          </PanelButtonsStyled>
        </FormsStyled>
      </Section>
      {showSetPassword && (
        <SetPasswordDialog
          selectedUsers={[userData?.name]}
          onHide={() => {
            setShowSetPassword(false)
          }}
          disabled={isLoading}
        />
      )}
    </main>
  )
}

export default ProfilePage
