import axios from 'axios'
import { useEffect, useState, useMemo } from 'react'
import { useDispatch } from 'react-redux'
import { toast } from 'react-toastify'
import { InputText, InputPassword, Button, Panel } from '@ynput/ayon-react-components'
import { login } from '@state/user'
import api from '@shared/api'
import AuthLink from './AuthLink'
import { useGetSiteInfoQuery } from '@shared/api'
import LoadingPage from '../LoadingPage'
import * as Styled from './LoginPage.styled'
import remarkGfm from 'remark-gfm'
import Markdown from 'react-markdown'


const LoginPage = ({ isFirstTime = false }) => {
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
  const { data: info = {}, isLoading: isLoadingInfo } = useGetSiteInfoQuery({ full: true })
  const { motd, loginPageBrand = '', loginPageBackground = '' } = info


  // store the current url in local storage to preserve the redirect across auth flows

  useEffect(() => {
    if (window.location.pathname.startsWith('/login')) return
    console.debug('Storing preferred URL in local storage:', window.location.href)
    localStorage.setItem('auth-preferred-url', window.location.href)
  }, [])


  // Password login handler

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!(name && password)) {
      toast.error('Please enter username and password to login')
      return
    }

    let response = null

    try {
      response = await axios.post('/api/auth/login', { name, password })
    } catch (err) {
      console.error('Login error', err.response?.data || err)
      toast.error(err.response.data.detail || `Unable to login: Error ${err.response.status}`)
      return
    }

    if (!response || !response.data) {
      console.error('Login error', response)
      toast.error('Unable to login, check the console for details')
      return
    }

    // clear local storage
    localStorage.removeItem('auth-preferred-url')
    toast.info(response.data.detail)
    dispatch(login({ user: response.data.user, accessToken: response.data.token, }))
    dispatch(api.util.resetApiState())
  } // handleSubmit



  const handleSSOCallback = async (ssoOptions) => {
    // First we check if there's a provider name in the URL
    // And abort if there isn't
    const provider = window.location.pathname.split('/')[2]
    if (!provider) return
    console.debug('handleSSOCallback', provider)

    // If we don't have any SSO options, we can't proceed. Abort
    if (!ssoOptions?.length && provider !== "_token") return

    // Get the query string from the URL to use in the callback
    const qs = new URLSearchParams(window.location.search)

    // If the query string is empty, we can't proceed. Abort
    if (!qs.toString()) return

    // Get the provider config
    // We need to handle the situation ssoOptions is undefined.
    // That happens, when user is already logged in
    // but wants to re-login using a token
    let providerConfig = (info?.ssoOptions || []).find((o) => o.name === provider)
    if (provider === "_token") {
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
    let finalRedirect = null

    try {
      console.debug('SSO Callback', providerConfig.callback)
      response = await axios.get(providerConfig.callback, { params: qs })
      success = true
    } catch (err) {
      console.error('SSO Callback error', err.response.data)
      toast.error(
        <>
          <p>Unable to login using {providerConfig.name}:</p>
          <p>{err.response?.data?.detail || `Error ${err.response.status}`}</p>
        </>,
      )
    }

    // If we have a response and it contains user data, we're good to go

    if (success && response?.data?.user) {
      console.debug('SSO Callback response', response.data)
      const data = response.data
      toast.info(data.detail || `Logged in as ${data.user.name}`)

      dispatch(login({ user: data.user, accessToken: data.token }))
      // invalidate all rtk queries cache
      dispatch(api.util.resetApiState())

      if (data.redirectUrl) {
        finalRedirect = data.redirectUrl
      }
    } else if (success) {
      // successful request, without user data.
      // This should not happen, but we handle it gracefully
      toast.error('Unable to login using SSO')
      success = false
    }

    // Still, we need to figure out where to redirect the user after login
    // At this point we may have redirect URL from the response, but that 
    // is optional and used sparsely.

    if (localStorage.getItem('auth-preferred-url')) {
      finalRedirect = localStorage.getItem('auth-preferred-url')
    }

    // if we STILL don't have a redirect, just land on the home page
    if (!finalRedirect) {
      finalRedirect = window.location.origin
    }

    // Clear everything
    localStorage.removeItem('auth-preferred-url')
    setIsLoading(false)

    if (success) {
      // And redirect to the final URL
      window.location.href = finalRedirect
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

  let showPasswordLogin = (
    showAllProviders
    || !info?.hidePasswordAuth
    || (featuredProviders?.length && featuredProviders.includes('password'))
  ) || null

  // Should we show "Show all login options" button?

  const showAllButton = !showAllProviders && (featuredProviders?.length || !showPasswordLogin)

  // Create SSO buttons based on the available options

  const ssoButtons = useMemo(() => {
    if (!info.ssoOptions?.length) return null

    return info.ssoOptions
      .filter(({ name, hidden }) => !hidden && (!featuredProviders?.length || featuredProviders.includes(name) || showAllProviders))
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

  if (isLoading || isLoadingInfo) return isFirstTime ? null : <LoadingPage />


  //
  // Render the login page
  //

  return (
    <main className="center">
      {loginPageBackground && <Styled.BG src={loginPageBackground} />}
      <Styled.LoginForm>
        {(motd || loginPageBrand) && (
          <Panel>
            {loginPageBrand && <Styled.Logo src={loginPageBrand} />}
            <Styled.MessageMarkdown>
              <Markdown remarkPlugins={remarkGfm}>{motd}</Markdown>
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
            <Button style={{ width: '100%' }} variant="text" onClick={() => setShowAllProviders(true)}>
              Show all login options
            </Button>
          )}
          <Styled.TandCs>
            By logging in you agree to our{' '}
            <a href={'https://ynput.io/terms/'} target="_blank">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href={'https://ynput.io/privacy-policy'} target="_blank">
              Privacy Policy
            </a>
          </Styled.TandCs>
        </Panel>
      </Styled.LoginForm>
    </main>
  )
}

export default LoginPage
