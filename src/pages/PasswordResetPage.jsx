import axios from 'axios'
import { useDispatch } from 'react-redux'
import { login } from '@state/user'
import api from '@shared/api'
import { toast } from 'react-toastify'
import { useState, useMemo, useEffect } from 'react'
import * as Styled from '@pages/LoginPage/LoginPage.styled'
import { InputText, InputPassword, Button, Panel } from '@ynput/ayon-react-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'

const RequestPage = () => {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = {
      email: email.trim(),
      url: `${window.location.origin}/passwordReset`,
    }
    axios
      .post('/api/users/passwordResetRequest', payload)
      .then(() => {
        setSent(true)
        toast.info('Password reset link sent')
      })
      .catch((err) => {
        console.error(err)
        toast.error('Unable to send reset link')
      })
  }

  if (sent) {
    return (
      <>
        <h1>Reset Link Sent</h1>
        <p>
          If your email address is registered with us, you will receive a password reset link
          shortly.
        </p>
      </>
    )
  }

  return (
    <>
      <h1>Reset Password</h1>
      <p>Enter your email address and we will send you a link to reset your password.</p>
      <form onSubmit={handleSubmit}>
        <InputText
          autoFocus
          placeholder="Enter your email address"
          name="email"
          aria-label="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Button label={<strong>Send Reset Link</strong>} type="submit" />
      </form>
    </>
  )
}

const ResetPage = ({ token }) => {
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
      .post('/api/users/passwordReset', { token })
      .then(() => setTokenOk(true))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

  if (loading) {
    return <p>Loading...</p>
  }

  if (!tokenOk) {
    return <p>Invalid password reset token</p>
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    axios
      .post('/api/users/passwordReset', { token, password })
      .then((response) => {
        const data = response.data
        dispatch(login({ user: data.user, accessToken: data.token }))
        dispatch(api.util.resetApiState())
        toast.success('Password reset successfully')
        window.history.replaceState({}, '', '/')
      })
      .catch((err) => {
        console.error(err)
        toast.error(err.response?.data?.detail || 'Unable to reset password')
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
          label={<strong>Reset Password</strong>}
          type="submit"
          disabled={!password || password !== confirmPassword}
        />
      </form>
    </>
  )
}

const PasswordResetPage = () => {
  //get token from query string
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  const mainComponent = useMemo(() => {
    if (token) {
      return <ResetPage token={token} />
    } else {
      return <RequestPage />
    }
  }, [token])

  return (
    <>
      <DocumentTitle title="Password reset • AYON" />
      <main className="center">
      <Styled.LoginForm>
        <Panel>
          {mainComponent}
          <a href="/login">Back to login page</a>
        </Panel>
      </Styled.LoginForm>
    </main>
    </>
  )
}

export default PasswordResetPage
