import axios from 'axios'
import { useEffect, useState, useMemo } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { InputText, InputPassword, Button, Panel } from '@ynput/ayon-react-components'
import { api } from '@shared/api'
import AuthLink from './AuthLink'
import { useGetSiteInfoQuery } from '@shared/api'
import * as Styled from './LoginPage.styled'
import remarkGfm from 'remark-gfm'
import Markdown from 'react-markdown'
import LoginTerms from './LoginTerms'

/** What a successful login gives the host, which stores the session (see storeAccessToken). */
export interface LoginResult {
  user: any
  accessToken?: string
  redirectUrl?: string | null
}

export interface LoginPageProps {
  /** stores the session: ayon-frontend dispatches its `login`, the addon dev shell stores the token */
  onLogin: (result: LoginResult) => void
  /** shown while the site info or an SSO callback loads */
  loading?: ReactNode
  isFirstTime?: boolean
}

type SsoOption = {
  name: string
  title?: string
  url: string
  args?: Record<string, string>
  redirectKey: string
  icon?: string
  color?: string
  textColor?: string
  hidden?: boolean
  callback?: string
}

// The login page of ayon-frontend, in shared so an addon's standalone dev shell signs in the
// same way: password and SSO, the token stored like the app stores it.
export const LoginPage = ({ onLogin, loading = null, isFirstTime = false }: LoginPageProps) => {
  const dispatch = useDispatch()

  // get query params from url
  const search = new URLSearchParams(window.location.search)

  // password form state
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')

  // which methods are featured (all others are hidden)
  const featuredProviders = search.getAll('provider')

  // has the user requested to see all login providers?
  const [showAllProviders, setShowAllProviders] = useState(false)

  // site information
  const [isLoading, setIsLoading] = useState(false)
  const { data: siteInfo, isLoading: isLoadingInfo } = useGetSiteInfoQuery({ full: true })
  const info = (siteInfo || {}) as {
    motd?: string
    loginPageBrand?: string
    loginPageBackground?: string
    ssoOptions?: SsoOption[]
    hidePasswordAuth?: boolean
    passwordRecoveryAvailable?: boolean
  }
  const { motd, loginPageBrand = '', loginPageBackground = '' } = info

  useEffect(() => {
    document.title = 'Login • AYON'
  }, [])

  // store the current url in local storage to preserve the redirect across auth flows

  useEffect(() => {
    if (window.location.pathname.startsWith('/login')) return
    console.debug('Storing preferred URL in local storage:', window.location.href)
    localStorage.setItem('auth-preferred-url', window.location.href)
  }, [])

  // Password login handler

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!(name && password)) {
      toast.error('Please enter username and password to login')
      return
    }

    let response = null

    try {
      response = await axios.post('/api/auth/login', { name, password })
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string }; status?: number } }
      console.error('Login error', err.response?.data || err)
      toast.error(err.response?.data?.detail || `Unable to login: Error ${err.response?.status}`)
      return
    }

    if (!response || !response.data) {
      console.error('Login error', response)
      toast.error('Unable to login, check the console for details')
      return
    }

    localStorage.removeItem('auth-preferred-url')
    toast.info(response.data.detail)
    onLogin({ user: response.data.user, accessToken: response.data.token })
    dispatch(api.util.resetApiState())
  } // handleSubmit

  const handleSSOCallback = async (ssoOptions?: SsoOption[]) => {
    // First we check if there's a provider name in the URL
    // And abort if there isn't
    const provider = window.location.pathname.split('/')[2]
    if (!provider) return
    console.debug('handleSSOCallback', provider)

    // If we don't have any SSO options, we can't proceed. Abort
    if (!ssoOptions?.length && provider !== '_token') return

    // Get the query string from the URL to use in the callback
    const qs = new URLSearchParams(window.location.search)

    // If the query string is empty, we can't proceed. Abort
    if (!qs.toString()) return

    // Clear the query string from the URL
    // This is important to avoid confusion with the next login attempts
    // (we don't want to keep the query string in the URL after login)

    window.history.replaceState({}, '', window.location.pathname)

    // Get the provider config
    // We need to handle the situation ssoOptions is undefined.
    // That happens, when user is already logged in
    // but wants to re-login using a token
    let providerConfig: Pick<SsoOption, 'name' | 'callback'> | undefined = (
      info?.ssoOptions || []
    ).find((o) => o.name === provider)
    if (provider === '_token') {
      // special case for token auth
      // we don't have a providerConfig for this, but we can still proceed
      providerConfig = {
        name: 'secure token',
        callback: '/api/auth/tokenauth',
      }
    }

    // No such provider found, abort
    if (!providerConfig) return

    // add provider to the query
    // this is used by sso addon to determine which provider to use
    // for the callback (the all share the same callback URL)
    qs.append('ayonProvider', provider)

    setIsLoading(true)

    let success = false
    let response = null
    let redirectUrl: string | null = null

    try {
      console.debug('SSO Callback', providerConfig.callback)
      response = await axios.get(providerConfig.callback as string, { params: qs })
      success = true
    } catch (error) {
      const err = error as { response?: { data?: { detail?: string }; status?: number } }
      console.error('SSO Callback error', err.response?.data)
      toast.error(
        <>
          <p>Unable to login using {providerConfig.name}:</p>
          <p>{err.response?.data?.detail || `Error ${err.response?.status}`}</p>
        </>,
      )
    }

    // If we have a response and it contains user data, we're good to go

    let user = null
    let accessToken = null

    if (success && response?.data?.user) {
      console.debug('SSO Callback response', response.data)
      const data = response.data
      toast.info(data.detail || `Logged in as ${data.user.name}`)

      user = data.user
      accessToken = data.token

      if (data.redirectUrl) {
        redirectUrl = data.redirectUrl
      }
    } else if (success) {
      // successful request, without user data.
      // This should not happen, but we handle it gracefully
      toast.error('Unable to login using SSO')
      success = false
    }

    if (success) {
      // Still, we need to figure out where to redirect the user after login
      // At this point we may have redirect URL from the response, but that
      // is optional and used sparsely.

      if (!redirectUrl && localStorage.getItem('auth-preferred-url')) {
        redirectUrl = localStorage.getItem('auth-preferred-url')
      }

      if (!redirectUrl) {
        // if we STILL don't have a redirect, just land on the home page
        redirectUrl = window.location.origin
      }

      setIsLoading(false)
      localStorage.removeItem('auth-preferred-url')
      onLogin({ user, accessToken, redirectUrl })
      dispatch(api.util.resetApiState())
    } else {
      // we don't want to retry!
      // Clear everything
      console.log('SSO Callback failed, clearing auth state')
      setIsLoading(false)
      localStorage.removeItem('auth-preferred-url')
    }
  } // handleSSOCallback

  // Handle SSO callback after redirection from SSO provider
  // (this needs to be called after sso options are loaded)

  useEffect(() => {
    handleSSOCallback(info.ssoOptions)
  }, [info.ssoOptions])

  //
  // Render logic (what are we showing?)
  //

  // Should we show the password login?

  const showPasswordLogin =
    showAllProviders ||
    !info?.hidePasswordAuth ||
    (featuredProviders?.length && featuredProviders.includes('password')) ||
    null

  // Should we show "Show all login options" button?

  const showAllButton = !showAllProviders && (featuredProviders || !showPasswordLogin)

  // Create SSO buttons based on the available options

  const ssoButtons = useMemo(() => {
    if (!info.ssoOptions?.length) return null

    return info.ssoOptions
      .filter(
        ({ name, hidden }) =>
          !hidden &&
          (!featuredProviders?.length || featuredProviders.includes(name) || showAllProviders),
      )
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
  }, [info.ssoOptions, featuredProviders, showAllProviders])

  // Loading state

  if (isLoading || isLoadingInfo) return isFirstTime ? null : <>{loading}</>

  //
  // Render the login page
  //

  return (
    <>
      <main className="center">
        {loginPageBackground && <Styled.BG src={loginPageBackground} />}
        <Styled.LoginForm>
          {(motd || loginPageBrand) && (
            <Panel>
              {loginPageBrand && <Styled.Logo src={loginPageBrand} />}
              <Styled.MessageMarkdown>
                <Markdown remarkPlugins={[remarkGfm]}>{motd}</Markdown>
              </Styled.MessageMarkdown>
            </Panel>
          )}
          <Panel>
            <Styled.Ayon src="/AYON.svg" />

            <Styled.Methods>
              {showPasswordLogin ? (
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
              ) : (
                <>
                  {/* we need a margin between the logo and the SSO buttons */}
                  <div style={{ marginBottom: '8px' }} />
                </>
              )}

              {ssoButtons}
            </Styled.Methods>
            {info?.passwordRecoveryAvailable && showPasswordLogin && (
              <a href="/passwordReset" style={{ margin: '8px 0' }}>
                Reset password
              </a>
            )}
            {showAllButton && (
              <Button
                style={{ width: '100%' }}
                variant="text"
                onClick={() => setShowAllProviders(true)}
              >
                Show all login options
              </Button>
            )}
            <LoginTerms />
          </Panel>
        </Styled.LoginForm>
      </main>
    </>
  )
}


