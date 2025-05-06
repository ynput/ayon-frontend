import LoginPage from '@pages/LoginPage'
import { useCreateSessionMutation } from '@shared/api'
import { useLogoutMutation } from '@queries/auth/logout'
import { Button, Panel, SaveButton, theme, Toolbar } from '@ynput/ayon-react-components'
import { FC } from 'react'
import { toast } from 'react-toastify'
import styled from 'styled-components'

const Container = styled(Panel)`
  position: fixed;
  padding: 32px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -100%);
  gap: 16px;
  justify-content: center;

  h1 {
    ${theme.titleLarge}
    margin: 0;
  }

  img {
    height: 50px;
  }

  button.hasIcon {
    width: fit-content;
    padding: 8px 16px;
    margin-left: auto;
  }
`

const UserDetails = styled(Panel)`
  background-color: var(--md-sys-color-surface-container);

  span {
    ${theme.labelLarge}
  }
`

const Error = styled(Panel)`
  background-color: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
`

interface LauncherAuthPageProps {
  user: {
    name?: string
  }
  redirect: string
}

const LauncherAuthPage: FC<LauncherAuthPageProps> = ({ user, redirect }) => {
  const [createSession, { isLoading, error }] = useCreateSessionMutation()

  const handleConfirm = async () => {
    try {
      // get access token
      const response = await createSession({
        createSessionRequest: {
          message: 'Connect to AYON launcher',
        },
      }).unwrap()

      if (response.token) {
        // redirect to redirect with token as query param
        window.location.href = `${redirect}?token=${response.token}`
      }
    } catch (error) {
      console.error(error)
      toast.error('Failed to connect to AYON launcher')
    }
  }

  const [logout] = useLogoutMutation()

  const handleSwitch = () => {
    try {
      // @ts-expect-error - no args are defined
      logout({ redirect: window.location.href })
    } catch (error) {
      console.error(error)
      toast.error('Failed to switch account')
    }
  }

  //   if not on '/' redirect to '/'
  if (window.location.pathname !== '/') {
    window.location.href = `/${window.location.search}`
  }

  if (!user.name) return <LoginPage />

  return (
    <Container>
      <img src="/AYON.svg" />
      <h1>Connect account to AYON launcher?</h1>
      <UserDetails>
        <span>Username: {user.name}</span>
      </UserDetails>
      <Toolbar>
        <Button variant="text" onClick={handleSwitch}>
          Use a different account
        </Button>
        <SaveButton active onClick={handleConfirm} saving={isLoading}>
          Confirm
        </SaveButton>
      </Toolbar>
      {error && <Error>{JSON.stringify(error)}</Error>}
    </Container>
  )
}

export default LauncherAuthPage
