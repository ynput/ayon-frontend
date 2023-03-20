import axios from 'axios'
import { useEffect, useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { InputText, InputPassword, Button, Panel } from '@ynput/ayon-react-components'
import { login } from '/src/features/user'
import { ayonApi } from '../../services/ayon'
import styled from 'styled-components'
import AuthLink from './AuthLink'
import constructOAuthToUrl from '/src/helpers/constructOAuthToUrl'

const LoginFormStyled = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;

  & > div {
    width: 100%;
  }

  button {
    padding: 8px 12px;
    height: 45px;
    max-height: unset;

    svg {
      width: 24px;
    }

    span {
      font-size: 24px !important;
    }
  }
`

const LoginPage = () => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const loginRef = useRef(null)
  const passwordRef = useRef(null)
  const [loading, setLoading] = useState(false)
  const [oauthOptions, setOauthOptions] = useState([])

  // OAuth2 handler

  useEffect(() => {
    if (window.location.pathname.startsWith('/login/')) {
      // const error = new URLSearchParams(window.location.search).get('error')
      const provider = window.location.pathname.split('/')[2]
      const code = new URLSearchParams(window.location.search).get('code')
      window.history.replaceState({}, document.title, '/')

      if (!(provider && code)) return

      setLoading(true)
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
          setLoading(false)
        })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Login form

  const doLogin = () => {
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
        }
      })
      .catch((err) => {
        toast.error(err.response.data.detail || `Unable to login: Error ${err.response.status}`)
      })
  }

  const onLoginKeyDown = (event) => {
    if (event.key === 'Enter') {
      doLogin()
    }
  }

  useEffect(() => {
    if (loginRef.current) loginRef.current.focus()
  }, [loginRef])

  useEffect(() => {
    let result = []
    axios.get('/api/oauth2/options').then((response) => {
      if (!(response.data && response.data.options && response.data.options.length)) return

      for (const option of response.data.options) {
        const redirectUri = `${window.location.origin}/login/${option.name}`
        result.push({
          name: option.name,
          url: constructOAuthToUrl(option.url, option.client_id, redirectUri, option.scope),
        })
      }
      setOauthOptions(result)
    })
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <main className="center">
      <LoginFormStyled>
        <h1>Ayon server</h1>
        <Panel>
          <InputText
            ref={loginRef}
            placeholder="Username"
            name="username"
            aria-label="Username"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onLoginKeyDown}
          />
          <InputPassword
            ref={passwordRef}
            placeholder="Password"
            name="password"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={onLoginKeyDown}
          />
          <Button label={<strong>Login</strong>} icon="login" onClick={doLogin} />
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
