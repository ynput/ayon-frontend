import axios from 'axios'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { InputText, InputPassword, Button, Panel } from '@ynput/ayon-react-components'
import { login } from '@state/user'
import api from '@shared/api'
import AuthLink from './AuthLink'
import { useGetSiteInfoQuery } from '@shared/api'
import LoadingPage from '../LoadingPage'
import * as Styled from './LoginPage.styled'
import { useLocalStorage } from '@shared/hooks'
import { isEmpty, isEqual } from 'lodash'
import remarkGfm from 'remark-gfm'

const clearQueryParams = () => {
  const url = new URL(window.location)
  url.search = ''
  console.log('clearQueryParams', url.href)
  history.pushState({}, '', url.href)
}

const LoginPage = ({ isFirstTime = false }) => {
  // get query params from url
  const search = new URLSearchParams(window.location.search)
  const dispatch = useDispatch()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  // which methods are featured (all others are hidden)
  const featuredMethods = search.getAll('provider')

  // if there are none [] then show all
  const [shownProviders, setShownProviders] = useState(featuredMethods)

  const [isLoading, setIsLoading] = useState(false)

  const { data: info = {}, isLoading: isLoadingInfo } = useGetSiteInfoQuery({ full: true })
  const { motd, loginPageBrand = '', loginPageBackground = '' } = info

  // we need to store the redirect in local storage to persist it across auth flows
  const [redirectQueryParams, setRedirectQueryParams] = useLocalStorage(
    'auth-redirect-params',
    null,
  )

  const allowedParams = ['auth_redirect']
  // preserve the redirect query params across auth flows
  useEffect(() => {
    // convert search params to object
    const searchParams = Array.from(search.entries()).reduce((acc, [key, value]) => {
      if (allowedParams.includes(key)) {
        acc[key] = value
      }
      return acc
    }, {})

    if (isEmpty(searchParams) || isEqual(searchParams, redirectQueryParams)) return

    // store the redirect in local storage
    setRedirectQueryParams(searchParams)
  }, [search, setRedirectQueryParams, redirectQueryParams])

  // OAuth2 handler after redirect from provider
  useEffect(() => {
    const provider = window.location.pathname.split('/')[2]
    if (!provider) {
      return
    }
    const qs = new URLSearchParams(window.location.search)

    if (info?.ssoOptions?.length) {
      window.history.replaceState({}, document.title, window.location.pathname)
      const providerConfig = info.ssoOptions.find((o) => o.name === provider)

      // if query string is empty, abort
      if (!qs.toString()) {
        return
      }

      // add provider to the query
      qs.append('ayonProvider', provider)

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
            dispatch(api.util.resetApiState())
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
          // clear the query string
          clearQueryParams()
          // replace with redirect query params
          if (redirectQueryParams) {
            const redirect = new URLSearchParams(redirectQueryParams)
            // clear local storage
            localStorage.removeItem('auth-redirect-params')
            window.location.search = redirect.toString()
          }
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
          // clear local storage
          localStorage.removeItem('auth-redirect-params')
          toast.info(response.data.detail)
          dispatch(
            login({
              user: response.data.user,
              accessToken: response.data.token,
            }),
          )
          // invalidate all rtk queries cache
          dispatch(api.util.resetApiState())
        }
      })
      .catch((err) => {
        toast.error(err.response.data.detail || `Unable to login: Error ${err.response.status}`)
      })
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (!(name && password)) {
      toast.error('Please enter username and password to login')
    } else {
      doLogin()
    }
  }

  if (isLoading || isLoadingInfo) return isFirstTime ? null : <LoadingPage />

  const showAllProviders = !shownProviders.length
  const showPasswordLogin = showAllProviders || shownProviders.includes('password')

  return (
    <main className="center">
      {loginPageBackground && <Styled.BG src={loginPageBackground} />}
      <Styled.LoginForm>
        {(motd || loginPageBrand) && (
          <Panel>
            {loginPageBrand && <Styled.Logo src={loginPageBrand} />}
            <Styled.MessageMarkdown remarkPlugins={remarkGfm}>{motd}</Styled.MessageMarkdown>
          </Panel>
        )}
        <Panel>
          <Styled.Ayon src="/AYON.svg" />
          <Styled.Methods>
            {showPasswordLogin && (
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
                <Button type="submit">
                  <span className="label">Login with password</span>
                </Button>
              </form>
            )}

            {
              info.ssoOptions?.length
                ? info.ssoOptions
                    .filter(({ name }) => shownProviders.includes(name) || showAllProviders)
                    .map(({ name, title, url, args, redirectKey, icon, color, textColor }) => {
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
                    })
                : null // ssoOptions.map
            }
          </Styled.Methods>
          {info?.passwordRecoveryAvailable && showPasswordLogin && (
            <a href="/passwordReset">Reset password</a>
          )}
          {!showAllProviders && (
            <Button style={{ width: '100%' }} variant="text" onClick={() => setShownProviders([])}>
              Show all login options
            </Button>
          )}
        </Panel>
      </Styled.LoginForm>
    </main>
  )
}

export default LoginPage
