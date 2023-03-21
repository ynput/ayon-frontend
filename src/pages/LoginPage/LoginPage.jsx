import axios from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { InputText, InputPassword, Button, Panel, LoaderShade } from '@ynput/ayon-react-components'
import { login } from '/src/features/user'
import { ayonApi } from '../../services/ayon'
import styled from 'styled-components'
import AuthLink from './AuthLink'
import { useGetInfoQuery, useGetOAuthOptionsQuery } from '/src/services/auth/getAuth'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'

const LoginFormStyled = styled.div`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
  gap: 64px;
  position: relative;
  background-color: var(--color-grey-00);
  padding: 64px;
  border-radius: 6px;
  box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.25);

  /* panel */
  & > div {
    align-items: center;
    padding: 32px;
    gap: 32px;
    width: 350px;

    p {
      margin: 0;
      text-align: center;

      a {
        text-decoration: underline;
      }
    }
  }

  /* company */
  & > div:first-child {
    p {
      text-align: left;
    }
  }

  /* login */
  & > div:last-child {
    background-color: var(--color-grey-01);
  }

  button {
    padding: 8px 12px;
    height: 40px;
    max-height: unset;

    svg {
      width: 24px;
    }

    span {
      font-size: 24px !important;
    }
  }

  /* name password form */
  form {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 100%;
    gap: 8px;

    & > * {
      width: 100%;
    }
  }
`

const MethodsStyled = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0px;
  gap: 16px;
  width: 100%;

  a,
  button {
    width: 100%;
  }
`

// AYON Logo
const AyonStyled = styled.img`
  height: 60px;
`
const LogoStyled = styled.img`
  height: 60px;
`

const BGStyled = styled.img`
  position: fixed;
  z-index: -10;
  inset: 0;
  object-fit: cover;
`

const LoginPage = () => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  // Oauth Options
  const { data: oauthOptions = [], isLoading: isLoadingOptions } = useGetOAuthOptionsQuery()

  const { data: info = {}, isLoading: isLoadingInfo } = useGetInfoQuery()
  const { motd } = info

  // OAuth2 handler after redirect from provider
  useEffect(() => {
    const provider = window.location.pathname.split('/')[2]
    const code = new URLSearchParams(window.location.search).get('code')
    if (code && provider) {
      setIsLoading(true)

      axios
        .get(`/api/oauth2/login/${provider}`, {
          params: {
            code: code,
            redirect_uri: `${window.location.origin}/login/${provider}`,
          },
        })
        .then((response) => {
          const data = response.data

          if (data.user) {
            // login successful
            toast.info(data.detail)
            dispatch(login({ user: data.user, accessToken: data.token }))
            // invalidate all rtk queries cache
            dispatch(ayonApi.util.resetApiState())
          } else {
            toast.error('Unable to login using OAUTH')
          }
        })
        .finally(() => {
          setIsLoading(false)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Login form

  const doLogin = async () => {
    axios
      .post('/api/auth/login', { name, password })
      .then((response) => {
        if (response.data.user) {
          toast.info(response.data.detail)
          dispatch(
            login({
              user: response.data.user,
              accessToken: response.data.token,
            }),
          )
          // invalidate all rtk queries cache
          dispatch(ayonApi.util.resetApiState())
        }
      })
      .catch((err) => {
        toast.error(err.response.data.detail || `Unable to login: Error ${err.response.status}`)
      })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    doLogin()
  }

  if (isLoading || isLoadingOptions || isLoadingInfo) return <LoaderShade />

  return (
    <main className="center">
      <BGStyled />
      <LoginFormStyled>
        <Panel>
          <LogoStyled src="/ynput.svg" />
          {motd && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ReactMarkdown>{motd}</ReactMarkdown>
            </div>
          )}
        </Panel>
        <Panel>
          <AyonStyled src="/AYON.svg" />
          <MethodsStyled>
            <form onSubmit={handleSubmit}>
              <label id="username">Username</label>
              <InputText
                autoFocus
                placeholder="Enter your username"
                name="username"
                aria-label="Username"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label id="password">Password</label>
              <InputPassword
                placeholder="Enter password"
                name="password"
                aria-label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Button label={<strong>Login</strong>} type="submit" />
            </form>
            <span>or</span>
            {oauthOptions &&
              oauthOptions.map(({ name, url }) => <AuthLink key={name} name={name} url={url} />)}
          </MethodsStyled>
        </Panel>
      </LoginFormStyled>
    </main>
  )
}

export default LoginPage
