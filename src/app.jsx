import ayonClient from '/src/ayon'
import axios from 'axios'
import { ErrorBoundary } from 'react-error-boundary'
import { useEffect, useState, Suspense, lazy, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { QueryParamProvider } from 'use-query-params'
import { ReactRouter6Adapter } from 'use-query-params/adapters/react-router-6'
import { toast } from 'react-toastify'

import Header from './containers/header'
import LoginPage from './pages/LoginPage'
import ErrorPage from './pages/ErrorPage'

const ProjectPage = lazy(() => import('./pages/ProjectPage'))
const ProjectManagerPage = lazy(() => import('./pages/ProjectManagerPage'))
const ExplorerPage = lazy(() => import('./pages/ExplorerPage'))
const APIDocsPage = lazy(() => import('./pages/APIDocsPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const EventsPage = lazy(() => import('./pages/EventsPage'))
const ServicesPage = lazy(() => import('./pages/ServicesPage'))

import { login } from './features/user'
import { SocketContext, SocketProvider } from './context/websocketContext'
import ProtectedRoute from './containers/ProtectedRoute'
import ShareDialog from './components/ShareDialog'
import ErrorFallback from './components/ErrorFallback'
import ServerRestartBanner from './components/ServerRestartBanner'
import { useLazyGetInfoQuery } from './services/auth/getAuth'
import { ContextMenuProvider } from './context/contextMenuContext'
import { ShortcutsProvider } from './context/shortcutsContext'
import { GlobalContextMenu } from './components/GlobalContextMenu'
import LoadingPage from './pages/LoadingPage'
import { ConfirmDialog } from 'primereact/confirmdialog'
import OnBoardingPage from './pages/OnBoarding'

const App = () => {
  const user = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(false)

  const [noAdminUser, setNoAdminUser] = useState(false)

  const storedAccessToken = localStorage.getItem('accessToken')
  if (storedAccessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`
  }
  axios.defaults.headers.common['X-Sender'] = window.senderId

  // Call /api/info to check whether the user is logged in
  // and to acquire server settings
  const [getInfo] = useLazyGetInfoQuery()

  useEffect(() => {
    setLoading(true)
    getInfo()
      .unwrap()
      .then((response) => {
        setNoAdminUser(!!response.noAdminUser)

        if (response.user) {
          dispatch(
            login({
              user: response.user,
              accessToken: storedAccessToken,
            }),
          )

          if (!response.attributes.length) {
            toast.error('Unable to load attributes. Something is wrong')
          }

          ayonClient.settings = {
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
  }, [dispatch, storedAccessToken])

  let isFirstTime
  isFirstTime = true

  // User is not logged in
  if (!user.name && !noAdminUser) {
    return <LoginPage loading={loading} isFirstTime={isFirstTime} />
  }

  if ((isFirstTime || noAdminUser) && !loading) {
    return (
      <BrowserRouter>
        <QueryParamProvider
          adapter={ReactRouter6Adapter}
          options={{
            updateType: 'replaceIn',
          }}
        >
          <OnBoardingPage noAdminUser={noAdminUser} />
        </QueryParamProvider>
      </BrowserRouter>
    )
  }

  const isUser = user?.data?.isUser

  if (window.location.pathname.startsWith('/login/')) {
    // already logged in, but stuck on the login page
    window.history.replaceState({}, document.title, '/')
    return isFirstTime ? null : <LoadingPage />
  }

  if (serverError && !noAdminUser)
    return <ErrorPage code={serverError} message="Server connection failed" />

  const RestartIndicator = () => {
    const serverIsRestarting = useContext(SocketContext)?.serverRestartingVisible || false
    return serverIsRestarting && <ServerRestartBanner />
  }

  //
  // RENDER THE MAIN APP
  //

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Suspense fallback={isFirstTime ? null : <LoadingPage />}>
        <SocketProvider>
          <ContextMenuProvider>
            <GlobalContextMenu />
            <RestartIndicator />
            <BrowserRouter>
              <ShortcutsProvider>
                <QueryParamProvider
                  adapter={ReactRouter6Adapter}
                  options={{
                    updateType: 'replaceIn',
                  }}
                >
                  <Header />
                  <ShareDialog />
                  <ConfirmDialog />
                  <Routes>
                    <Route
                      path="/"
                      exact
                      element={<Navigate replace to="/manageProjects/dashboard" />}
                    />
                    <Route
                      path="/manageProjects"
                      exact
                      element={<Navigate replace to="/manageProjects/dashboard" />}
                    />

                    <Route path="/manageProjects/:module" element={<ProjectManagerPage />} />
                    <Route path={'/projects/:projectName/:module'} element={<ProjectPage />} />
                    <Route
                      path={'/projects/:projectName/addon/:addonName'}
                      element={<ProjectPage />}
                    />
                    <Route
                      path="/settings"
                      exact
                      element={<Navigate replace to="/settings/anatomyPresets" />}
                    />
                    <Route path="/settings/:module" exact element={<SettingsPage />} />
                    <Route path="/settings/addon/:addonName" exact element={<SettingsPage />} />
                    <Route
                      path="/services"
                      element={
                        <ProtectedRoute isAllowed={!isUser} redirectPath="/">
                          <ServicesPage />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/explorer" element={<ExplorerPage />} />
                    <Route path="/doc/api" element={<APIDocsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/events" element={<EventsPage />} />
                    <Route element={<ErrorPage code="404" />} />
                  </Routes>
                </QueryParamProvider>
              </ShortcutsProvider>
            </BrowserRouter>
          </ContextMenuProvider>
        </SocketProvider>
      </Suspense>
    </ErrorBoundary>
  )
}

export default App
