import axios from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { InputText, InputPassword, Button, Panel } from '@ynput/ayon-react-components'
import { login } from '/src/features/user'
import { ayonApi } from '../../services/ayon'
import AuthLink from './AuthLink'
import { useGetInfoQuery } from '/src/services/auth/getAuth'
import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import LoadingPage from '../LoadingPage'
import * as Styled from './LoginPage.styled'

const LoginPage = ({ loading, isFirstTime }) => {
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  const [isLoading, setIsLoading] = useState(false)

  const { data: info = {}, isLoading: isLoadingInfo } = useGetInfoQuery()
  const { motd, loginPageBrand = '', loginPageBackground = '' } = info

  // OAuth2 handler after redirect from provider
  useEffect(() => {
    const provider = window.location.pathname.split('/')[2]
    const qs = new URLSearchParams(window.location.search)

    if (info?.ssoOptions?.length) {
      const providerConfig = info.ssoOptions.find((o) => o.name === provider)

      if (!providerConfig) {
        return
      }

      setIsLoading(true)
      axios
        .get(providerConfig.callback, { params: qs })
        .then((response) => {
          const data = response.data
          if (data.user) {
            // login successful
            toast.info(data.detail)
            dispatch(login({ user: data.user, accessToken: data.token }))
            // invalidate all rtk queries cache
            dispatch(ayonApi.util.resetApiState())
          } else {
            toast.error('Unable to login using SSO')
          }
        })
        .catch((err) => {
          console.error('SSO Callback error', err.response.data)
          toast.error(
            <>
              <p>Unable to login using {providerConfig.name}:</p>
              <p>{err.response?.data?.detail || `Error ${err.response.status}`}</p>
            </>,
          )
        })
        .finally(() => {
          setIsLoading(false)
        })
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [info.ssoOptions])

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

  if (isLoading || isLoadingInfo || loading) return isFirstTime ? null : <LoadingPage />

  return (
    <main className="center">
      {loginPageBackground && <Styled.BG src={loginPageBackground} />}
      <Styled.LoginForm>
        {motd && (
          <Panel>
            {loginPageBrand && <Styled.Logo src={loginPageBrand} />}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <ReactMarkdown>{motd}</ReactMarkdown>
            </div>
          </Panel>
        )}
        <Panel>
          <Styled.Ayon src="/AYON.svg" />
          <Styled.Methods>
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

            {
              info.ssoOptions?.length
                ? info.ssoOptions.map(
                    ({ name, title, url, args, redirectKey, icon, color, textColor }) => {
                      const queryDict = { ...args }
                      const redirect_uri = `${window.location.origin}/login/${name}`
                      queryDict[redirectKey] = redirect_uri

                      const query = new URLSearchParams(queryDict)
                      const fullUrl = `${url}?${query}`

                      return (
                        <AuthLink
                          key={name}
                          name={title || name}
                          url={fullUrl}
                          icon={icon}
                          color={color}
                          textColor={textColor}
                        />
                      )
                    },
                  )
                : null // ssoOptions.map
            }
          </Styled.Methods>
        </Panel>
      </Styled.LoginForm>
    </main>
  )
}

export default LoginPage
