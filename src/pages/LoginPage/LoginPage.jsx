import axios from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { InputText, InputPassword, Button, Panel, LoaderShade } from '@ynput/ayon-react-components'
import { login } from '/src/features/user'
import { ayonApi } from '../../services/ayon'
import styled from 'styled-components'
import AuthLink from './AuthLink'
import { useGetOAuthOptionsQuery } from '/src/services/auth/getAuth'

const LoginFormStyled = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  & > div {
    width: 100%;
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

const LoginPage = () => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  // Oauth Options
  const { data: oauthOptions = [], isLoading: isLoadingOptions } = useGetOAuthOptionsQuery()

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

  if (isLoading || isLoadingOptions) return <LoaderShade />

  return (
    <main className="center">
      <LoginFormStyled>
        <h1>Ayon server</h1>
        <Panel>
          <form onSubmit={handleSubmit}>
            <InputText
              autoFocus
              placeholder="Username"
              name="username"
              aria-label="Username"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <InputPassword
              placeholder="Password"
              name="password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button label={<strong>Login</strong>} icon="login" type="submit" />
          </form>
        </Panel>
        <h2>or</h2>
        {oauthOptions && (
          <Panel>
            {oauthOptions.map(({ name, url }) => (
              <AuthLink key={name} name={name} url={url} />
            ))}
          </Panel>
        )}
      </LoginFormStyled>
    </main>
  )
}

export default LoginPage
