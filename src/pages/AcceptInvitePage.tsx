import { useDispatch } from 'react-redux'
import { login } from '@state/user'
import api, { useAcceptInviteMutation, useGetSiteInfoQuery } from '@shared/api'
import { toast } from 'react-toastify'
import { useEffect, useState } from 'react'
import * as Styled from '@pages/LoginPage/LoginPage.styled'
import { Button, InputPassword, Panel } from '@ynput/ayon-react-components'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import LoginTerms from './LoginPage/LoginTerms'

const AcceptInviteSkeleton = ({ logo }: { logo?: string }) => (
  <>
    {logo && (
      <Styled.Logo
        src={logo}
        style={{ maxWidth: '100%', height: 'auto', maxHeight: 64, objectFit: 'contain' }}
      />
    )}
    <Styled.Title className="loading">You have been invited to join AYON</Styled.Title>
    <Styled.SubTitle className="loading">
      Please set a password to finish activating your account and log in.
    </Styled.SubTitle>
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', gap: 'var(--base-gap-large)' }}>
      <InputPassword className="loading" placeholder="Enter your new password" readOnly />
      <InputPassword className="loading" placeholder="Confirm your new password" readOnly />
      <Styled.Note className="loading">
        Password must be at least 8 characters and contain digits and special characters.
      </Styled.Note>
      <Button className="loading" variant="filled" disabled>
        Set password and log in
      </Button>
    </div>
  </>
)

interface AcceptInviteFormProps {
  token: string
  logo?: string
  ssoLabel?: string
}

const AcceptInviteForm = ({ token, logo, ssoLabel }: AcceptInviteFormProps) => {
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
    return <AcceptInviteSkeleton logo={logo} />
  }

  if (!tokenOk) {
    return (
      <>
        <h1>Invalid invite</h1>
        <p>
          This invite link is invalid or has expired. Ask the person who invited you to send a new
          one.
        </p>
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
      {logo && (
        <Styled.Logo
          src={logo}
          style={{ maxWidth: '100%', height: 'auto', maxHeight: 64, objectFit: 'contain' }}
        />
      )}
      <Styled.Title>You have been invited to join AYON</Styled.Title>
      <Styled.SubTitle>
        Please set a password to finish activating your account and log in.
      </Styled.SubTitle>
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

        <Styled.Note>
          Password must be at least 8 characters and contain digits and special characters.
        </Styled.Note>
        <Button type="submit" variant="filled" disabled={!password || password !== confirmPassword}>
          Set password and log in
        </Button>
        {ssoLabel && (
          <Styled.Note style={{ textAlign: 'center' }}>
            Or <a href="/login">{ssoLabel}</a> instead.
          </Styled.Note>
        )}
        <LoginTerms />
      </form>
    </>
  )
}

const AcceptInvitePage = () => {
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  const { data: info, isLoading: isLoadingInfo } = useGetSiteInfoQuery({ full: true })
  const { loginPageBrand = '', loginPageBackground = '', ssoOptions = [] } = info || {}
  const visibleSso = ssoOptions.filter((opt) => !opt.hidden)
  const capitalize = (s: string) => (s ? s[0].toUpperCase() + s.slice(1) : s)
  const ssoLabel =
    visibleSso.length === 1
      ? capitalize(visibleSso[0].title || `sign in with ${visibleSso[0].name}`)
      : visibleSso.length > 1
        ? 'Use another sign-in method'
        : undefined

  return (
    <>
      <DocumentTitle title="Accept invite • AYON" />
      <main className="center">
        {loginPageBackground && <Styled.BG src={loginPageBackground} />}
        <Styled.AyonNav src="/AYON.svg" />
        <Styled.LoginForm>
          <Panel>
            {isLoadingInfo ? (
              <AcceptInviteSkeleton logo="/AYON.svg" />
            ) : token ? (
              <AcceptInviteForm token={token} logo={loginPageBrand || '/AYON.svg'} ssoLabel={ssoLabel} />
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
