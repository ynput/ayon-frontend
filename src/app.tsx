import ayonClient from '@/ayon'
import axios from 'axios'
import { ErrorBoundary } from 'react-error-boundary'
import { useEffect, useState, Suspense, useMemo, lazy } from 'react'

import { useAppDispatch, useAppSelector } from '@state/store'
import {
  BrowserRouter,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { QueryParamProvider } from 'use-query-params'
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6'

// pages
import LoginPage from '@pages/LoginPage'
import ErrorPage from '@pages/ErrorPage'
import LoadingPage from '@pages/LoadingPage'
import OnBoardingPage from '@pages/OnBoarding'
const PasswordResetPage = lazy(() => import('@pages/PasswordResetPage'))

// components
import ShareDialog from '@components/ShareDialog'
import ErrorFallback from '@components/ErrorFallback'
import { GlobalContextMenu, ContextMenuProvider } from '@shared/containers/ContextMenu'
import Favicon from '@components/Favicon/Favicon'
import { ConfirmDialog } from 'primereact/confirmdialog'
import { toast } from 'react-toastify'
import TrialBanner from '@components/TrialBanner/TrialBanner'

// context
import { ShortcutsProvider } from '@context/ShortcutsContext'
import { RestartProvider } from '@context/RestartContext'
import { PasteProvider, PasteModal } from '@context/PasteContext'
import { NotificationsProvider } from '@context/NotificationsContext'
import { PiPProvider } from '@shared/context/pip/PiPProvider'
import { RemoteModulesProvider, DetailsPanelProvider } from '@shared/context'
import { PowerpackProvider } from '@shared/context'
import { MenuProvider, URIProvider } from '@shared/context'

// containers
import Header from '@containers/header'
import FileUploadPreviewContainer from '@containers/FileUploadPreviewContainer'
import { ViewerDialog } from '@containers/Viewer'

// state
import { login } from '@state/user'

// queries
import { useLazyGetSiteInfoQuery, useGetYnputCloudInfoQuery } from '@shared/api'

// hooks
import useTooltip from '@hooks/Tooltip/useTooltip'
import LauncherAuthPage from '@pages/LauncherAuthPage'
import ReleaseInstallerDialog from '@containers/ReleaseInstallerDialog/ReleaseInstallerDialog'
import getTrialDates from '@components/TrialBanner/helpers/getTrialDates'
import TrialEnded from '@containers/TrialEnded/TrialEnded'
import { DetailsPanelFloating } from '@shared/containers'
import { FeedbackProvider, PowerpackDialog } from '@shared/components'
import AppRemoteLoader from './remote/AppRemoteLoader'
import CompleteProfilePrompt from '@components/CompleteProfilePrompt/CompleteProfilePrompt'
import { goToFrame, openViewer } from '@state/viewer'
import { onCommentImageOpen } from '@state/context'
import AppRoutes from './containers/AppRoutes'

const App = () => {
  const user = useAppSelector((state) => state.user)
  const viewer = useAppSelector((state) => state.viewer) || []
  const dispatch = useAppDispatch()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(false)
  const [isOnboarding, setIsOnboarding] = useState(false)
  const [noAdminUser, setNoAdminUser] = useState(false)

  //   handlers for details panel
  const onOpenImage = (args: any) => {
    dispatch(onCommentImageOpen(args))
  }

  const onGoToFrame = (frame: number) => {
    dispatch(goToFrame(frame))
  }

  const onOpenViewer = (args: any) => {
    dispatch(openViewer(args))
  }

  const handlerProps = {
    onOpenImage,
    onGoToFrame,
    onOpenViewer,
  }

  const storedAccessToken = localStorage.getItem('accessToken')
  if (storedAccessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`
  }
  axios.defaults.headers.common['X-Sender'] = window.senderId

  // Call /api/info to check whether the user is logged in
  // and to acquire server settings
  const [getInfo] = useLazyGetSiteInfoQuery()

  // get subscriptions info
  const { data: ynputConnect } = useGetYnputCloudInfoQuery(undefined, { skip: !user.name })
  const { isTrialing, left } = getTrialDates(ynputConnect?.subscriptions)

  useEffect(() => {
    setLoading(true)

    getInfo({ full: true })
      .unwrap()
      .then((response) => {
        setNoAdminUser(!!response?.noAdminUser)

        if (response.onboarding) {
          setIsOnboarding(true)
        } else {
          setIsOnboarding(false)
        }

        if (response.user) {
          dispatch(
            login({
              user: response.user,
              accessToken: storedAccessToken,
            }),
          )

          // clear any auth-redirect-params local storage
          localStorage.removeItem('auth-redirect-params')

          if (!response.attributes?.length) {
            toast.error('Unable to load attributes. Something is wrong')
          }

          ayonClient.settings = {
            // @ts-ignore
            attributes: response.attributes,
            sites: response.sites,
            version: response.version,
          }
        }
      })
      .catch((err) => {
        console.error(err)
        setServerError(err?.status)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [dispatch, storedAccessToken, isOnboarding])

  const [handleMouse, tooltipComponent] = useTooltip()

  useEffect(() => {
    const body = document.body

    // attach mouseOver event listener to body element
    // @ts-ignore
    body.addEventListener('mouseover', handleMouse)

    // cleanup
    return () => {
      // @ts-ignore
      body.removeEventListener('mouseover', handleMouse)
    }
  }, [])

  const isUser = user?.data?.isUser

  // DEFINE ALL HIGH LEVEL COMPONENT PAGES HERE
  const mainComponent = useMemo(
    () => (
      <>
        <Favicon />
        <Suspense fallback={<LoadingPage />}>
          <MenuProvider>
            <FeedbackProvider>
              <RestartProvider>
                <RemoteModulesProvider skip={!user.name}>
                  <PowerpackProvider>
                    <ContextMenuProvider>
                      <GlobalContextMenu />
                      <PasteProvider>
                        <PasteModal />
                        <BrowserRouter>
                          <NotificationsProvider>
                            <QueryParamProvider
                              adapter={ReactRouter6Adapter}
                              options={{
                                updateType: 'replaceIn',
                              }}
                            >
                              <URIProvider>
                                <DetailsPanelProvider
                                  {...handlerProps}
                                  user={user}
                                  viewer={viewer}
                                  dispatch={dispatch}
                                  useLocation={useLocation}
                                  useNavigate={useNavigate}
                                  useParams={useParams}
                                  useSearchParams={useSearchParams}
                                >
                                  <ShortcutsProvider>
                                    <PiPProvider>
                                      <Header />
                                      <ShareDialog />
                                      <ViewerDialog />
                                      <ConfirmDialog />
                                      <FileUploadPreviewContainer />
                                      <ReleaseInstallerDialog />
                                      <CompleteProfilePrompt />
                                      <AppRoutes isUser={isUser} />
                                      <DetailsPanelFloating />
                                      <PowerpackDialog />
                                      <AppRemoteLoader />
                                      <TrialBanner />
                                    </PiPProvider>
                                  </ShortcutsProvider>
                                </DetailsPanelProvider>
                              </URIProvider>
                            </QueryParamProvider>
                          </NotificationsProvider>
                        </BrowserRouter>
                      </PasteProvider>
                    </ContextMenuProvider>
                  </PowerpackProvider>
                </RemoteModulesProvider>
              </RestartProvider>
            </FeedbackProvider>
          </MenuProvider>
        </Suspense>
      </>
    ),
    [isUser, isTrialing, user.name],
  )

  const loadingComponent = useMemo(() => <LoadingPage />, [])

  useEffect(() => {
    if (user.name && user.redirectUrl) {
      window.location.href = user.redirectUrl
      //dispatch(clearRedirectUrl())
    }
  }, [user.name, user.redirectUrl, dispatch])

  const errorComponent = useMemo(
    () => <ErrorPage message="Server connection failed" />,
    [serverError],
  )

  const onboardingComponent = useMemo(
    () => (
      <BrowserRouter>
        <QueryParamProvider
          adapter={ReactRouter6Adapter}
          options={{
            updateType: 'replaceIn',
          }}
        >
          <OnBoardingPage
            noAdminUser={noAdminUser}
            onFinish={() => setIsOnboarding(false)}
            isOnboarding={isOnboarding || noAdminUser}
          />
        </QueryParamProvider>
      </BrowserRouter>
    ),
    [isOnboarding, noAdminUser],
  )

  // Then use the state of the app to determine which component to render

  if (loading) return loadingComponent

  // Get authorize_url from query params
  const urlParams = new URLSearchParams(window.location.search)
  const authRedirect = urlParams.get('auth_redirect')
  // return launcher auth flow
  if (authRedirect) return <LauncherAuthPage user={user} redirect={authRedirect} />

  if (window.location.pathname.startsWith('/passwordReset')) {
    if (!user.name) return <PasswordResetPage />
    else window.history.replaceState({}, document.title, '/')
  }

  const isTokenAuth = () => {
    // User is trying to log in with a token
    // we need to show the login page, that handles sso
    // callbacks in order to parse the token and overwrite
    // existing session if needed
    const provider = window.location.pathname.split('/')
    return provider[1] === 'login' && provider[2] === '_token'
  }

  // User is not logged in
  if (!user.name && !noAdminUser) {
    return (
      <>
        <LoginPage isFirstTime={isOnboarding} />
        {tooltipComponent}
      </>
    )
  }

  if (isTokenAuth()) {
    return <LoginPage isFirstTime={isOnboarding} />
  }

  // Trial has finished
  if (isTrialing && left?.finished) {
    return (
      <FeedbackProvider>
        <BrowserRouter>
          <TrialEnded orgName={ynputConnect?.orgName} />
        </BrowserRouter>
      </FeedbackProvider>
    )
  }

  // user needs to go through onboarding
  if (isOnboarding || noAdminUser) {
    return (
      <>
        {onboardingComponent}
        {tooltipComponent}
      </>
    )
  }

  if (window.location.pathname.startsWith('/login')) {
    // already logged in, but stuck on the login page
    window.history.replaceState({}, document.title, '/')
    return isOnboarding ? null : loadingComponent
  }

  // stuck on onboarding page
  if (window.location.pathname.startsWith('/onboarding')) {
    window.history.replaceState({}, document.title, '/settings/bundles?bundle=latest')
    return loadingComponent
  }

  if (serverError && !noAdminUser) return <FeedbackProvider>{errorComponent}</FeedbackProvider>

  return (
    <>
      {import.meta.env.DEV ? (
        mainComponent
      ) : (
        <ErrorBoundary FallbackComponent={ErrorFallback}>{mainComponent}</ErrorBoundary>
      )}

      {tooltipComponent}
    </>
  )
}

export default App
