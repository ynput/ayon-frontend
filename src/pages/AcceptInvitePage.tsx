import axios from 'axios'
import { useDispatch } from 'react-redux'
import { login } from '@state/user'
import api from '@shared/api'
import { toast } from 'react-toastify'
import { useState, useEffect } from 'react'
import * as Styled from '@pages/LoginPage/LoginPage.styled'
import { InputPassword, Button, Panel } from '@ynput/ayon-react-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'


interface AcceptInviteFormProps {
  token: string
}

const AcceptInviteForm = ({ token }:AcceptInviteFormProps) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [tokenOk, setTokenOk] = useState(false)
  const dispatch = useDispatch()

  useEffect(() => {
    // Check if token is valid
    // passwordReset will return 200 if token is valid,
    // if a password is not set, it won't be changed
    axios
      .post('/api/users/acceptInvite', { token })
      .then(() => setTokenOk(true))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <p>Loading...</p>
  }

  if (!tokenOk) {
    return <p>Invalid invite token</p>
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    axios
      .post('/api/users/acceptInvite', { token, password })
      .then((response) => {
        const data = response.data
        dispatch(login({ user: data.user, accessToken: data.token }))
        dispatch(api.util.resetApiState())
        toast.success('Password set successfully')
        window.history.replaceState({}, '', '/')
      })
      .catch((err) => {
        console.error(err)
        toast.error(err.response?.data?.detail || 'Unable to set password')
      })
  }

  return (
    <>
      <h1>Create a new password</h1>
      <p>Enter a new password for your account.</p>
      <form onSubmit={handleSubmit}>
        <InputPassword
          autoFocus
          placeholder="Enter your new password"
          name="password"
          aria-label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <InputPassword
          placeholder="Confirm your new password"
          name="confirmPassword"
          aria-label="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />
        <Button
          label="Set new password and log in"
          type="submit"
          disabled={!password || password !== confirmPassword}
        />
      </form>
    </>
  )
}

const AcceptInvitePage = () => {
  //get token from query string
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  if(!token) {
    return (
      <>
        <DocumentTitle title="Password reset • AYON" />
        <main className="center">
          <Styled.LoginForm>
            <Panel>
              <p>Missing password reset token</p>
            </Panel>
          </Styled.LoginForm>
        </main>
      </>
    )
  }


  return (
    <>
      <DocumentTitle title="Password reset • AYON" />
      <main className="center">
      <Styled.LoginForm>
        <Panel>
          <AcceptInviteForm token={token} />
        </Panel>
      </Styled.LoginForm>
    </main>
    </>
  )
}

export default AcceptInvitePage

