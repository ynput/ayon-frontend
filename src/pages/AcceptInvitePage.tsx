import { useDispatch } from 'react-redux'
import { login } from '@state/user'
import api, { useAcceptInviteMutation } from '@shared/api'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'
import * as Styled from '@pages/LoginPage/LoginPage.styled'
import { Button, InputPassword, Panel } from '@ynput/ayon-react-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'

interface AcceptInviteFormProps {
  token: string
}

const AcceptInviteForm = ({ token }: AcceptInviteFormProps) => {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [tokenOk, setTokenOk] = useState(false)
  const dispatch = useDispatch()
  const [acceptInvite] = useAcceptInviteMutation()

  useEffect(() => {
    // Probe token: backend returns 200 + "Token is valid" when password omitted.
    acceptInvite({ acceptInviteRequest: { token } })
      .unwrap()
      .then(() => setTokenOk(true))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token, acceptInvite])

  if (loading) {
    return <p>Loading...</p>
  }

  if (!tokenOk) {
    return (
      <>
        <h1>Invalid invite</h1>
        <p>This invite link is invalid or has expired. Ask the person who invited you to send a new one.</p>
        <a href="/login">Back to login page</a>
      </>
    )
  }

  const passwordsMismatch = !!confirmPassword && password !== confirmPassword

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    try {
      const data = await acceptInvite({ acceptInviteRequest: { token, password } }).unwrap()
      dispatch(login({ user: data.user, accessToken: data.token }))
      dispatch(api.util.resetApiState())
      toast.success('Password set. Welcome to AYON.')
      window.history.replaceState({}, '', '/')
    } catch (err) {
      console.error(err)
      const e = err as { detail?: string; data?: { detail?: string } }
      const detail = e?.detail || e?.data?.detail
      toast.error(detail || 'Unable to set password')
    }
  }

  return (
    <>
      <h1>Set a password for your AYON account</h1>
      <p>Choose a password to finish activating your account and log in.</p>
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

        {passwordsMismatch && (
          <p style={{ color: 'var(--md-sys-color-error)', margin: 0 }}>Passwords do not match.</p>
        )}

        <Button
          label={<strong>Set password and log in</strong>}
          type="submit"
          disabled={!password || password !== confirmPassword}
        />
      </form>
    </>
  )
}

const AcceptInvitePage = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  return (
    <>
      <DocumentTitle title="Accept invite • AYON" />
      <main className="center">
        <Styled.LoginForm>
          <Panel>
            {token ? (
              <AcceptInviteForm token={token} />
            ) : (
              <>
                <h1>Missing invite token</h1>
                <p>This page expects an invite link. Open the link from your invitation email.</p>
                <a href="/login">Back to login page</a>
              </>
            )}
          </Panel>
        </Styled.LoginForm>
      </main>
    </>
  )
}

export default AcceptInvitePage
