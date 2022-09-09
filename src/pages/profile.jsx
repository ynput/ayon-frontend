import { useState, useEffect } from 'react'
import LoadingPage from '/src/pages/loading'
import axios from 'axios'
import { toast } from 'react-toastify'

import {
  FormLayout,
  FormRow,
  InputText,
  Password,
  Button,
} from '/src/components'

const ProfilePage = () => {
  const [userData, setUserData] = useState(null)
  const [formData, setFormData] = useState({})

  const [pass1, setPass1] = useState('')
  const [pass2, setPass2] = useState('')

  const loadUserData = () => {
    axios.get('/api/users/me').then((result) => {
      setUserData(result.data)
      setFormData({
        fullName: result.data.attrib.fullName,
        email: result.data.attrib.email,
      })
    })
  }

  useEffect(loadUserData, [])

  if (!userData) return <LoadingPage />

  const displayName = userData.attrib.fullName || userData.name

  let passInvalid = false
  if (!pass1) passInvalid = 'Password unchanged'
  else if (pass1 !== pass2) passInvalid = 'Passwords mismatch'

  const setAttrib = (key, value) => {
    setFormData((fd) => {
      return { ...fd, [key]: value }
    })
  }

  const saveProfile = () => {
    axios
      .patch(`/api/users/${userData.name}`, {
        attrib: {
          fullName: formData.fullName,
          email: formData.email,
        },
      })
      .then(() => {
        toast.success('Profile updated')
        loadUserData()
      })
  }

  const savePassword = () => {
    axios
      .patch(`/api/users/${userData.name}/password`, { password: pass1 })
      .then(() => {
        toast.success('Password changed')
      })
      .catch((err) => {
        toast.error('Unable to change password')
      })
  }

  return (
    <main>
      <div>
        <h1>{displayName}</h1>

        <h2>Basic information</h2>

        <FormLayout>
          <FormRow label="User name">
            <InputText value={userData.name} disabled={true} />
          </FormRow>
          <FormRow label="Full name">
            <InputText
              value={formData.fullName}
              onChange={(e) => setAttrib('fullName', e.target.value)}
            />
          </FormRow>
          <FormRow label="Email">
            <InputText
              value={formData.email}
              onChange={(e) => setAttrib('email', e.target.value)}
            />
          </FormRow>
          <FormRow>
            <Button label="Update profile" icon="check" onClick={saveProfile} />
          </FormRow>
        </FormLayout>

        <h2>Change password</h2>

        <FormLayout>
          <FormRow label="New password">
            <Password
              value={pass1}
              onChange={(e) => setPass1(e.target.value)}
            />
          </FormRow>
          <FormRow label="Confirm password">
            <Password
              value={pass2}
              onChange={(e) => setPass2(e.target.value)}
            />
          </FormRow>
          <FormRow>
            <Button
              label="Update password"
              icon="lock"
              onClick={savePassword}
              disabled={passInvalid}
            />
          </FormRow>
        </FormLayout>
      </div>
    </main>
  )
}

export default ProfilePage
