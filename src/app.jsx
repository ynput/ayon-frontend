import ayonClient from '/src/ayon'
import axios from 'axios'
import short from 'short-uuid'

import { LoaderShade } from '@ynput/ayon-react-components'
import { useEffect, useState, Suspense, lazy, useContext } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'
import { toast } from 'react-toastify'

import Header from './containers/header'
import LoginPage from './pages/login'
import ErrorPage from './pages/error'

const ProjectPage = lazy(() => import('./pages/project'))
const ProjectManager = lazy(() => import('./pages/projectManager'))
const ExplorerPage = lazy(() => import('./pages/explorer'))
const APIDocsPage = lazy(() => import('./pages/doc/api'))
const ProfilePage = lazy(() => import('./pages/profile'))
const SettingsPage = lazy(() => import('./pages/settings'))
const EventPage = lazy(() => import('./pages/event/EventPage'))
const ServicesPage = lazy(() => import('./pages/services'))

import { login } from './features/user'
import { SocketContext, SocketProvider } from './context/websocketContext'
import ProtectedRoute from './containers/ProtectedRoute'

const App = () => {
  const user = useSelector((state) => state.user)
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(false)

  const storedAccessToken = localStorage.getItem('accessToken')
  if (storedAccessToken) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${storedAccessToken}`
  }
  axios.defaults.headers.common['X-Sender'] = short.generate()

  // Call /api/info to check whether the user is logged in
  // and to acquire server settings

  useEffect(() => {
    setLoading(true)
    axios
      .get('/api/info')
      .then((response) => {
        if (response.data.user) {
          dispatch(
            login({
              user: response.data.user,
              accessToken: storedAccessToken,
            }),
          )

          if (!response.data.attributes.length) {
            toast.error('Unable to load attributes. Something is wrong')
          }

          ayonClient.settings = {
            attributes: response.data.attributes,
            sites: response.data.sites,
          }
        }
      })
      .catch((err) => {
        setServerError(err.response.status)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [dispatch, storedAccessToken])

  if (loading) return <LoaderShade />

  // User is not logged in
  if (!user.name) return <LoginPage />

  const isUser = user.data.isUser

  if (window.location.pathname.startsWith('/login/')) {
    // already logged in, but stuck on the login page
    window.history.replaceState({}, document.title, '/')
    return <LoaderShade />
  }

  if (serverError) return <ErrorPage code={serverError} message="Server connection failed" />

  //
  // RENDER THE MAIN APP
  //

  const Reloader = () => {
    const context = useContext(SocketContext)
    if (context?.serverRestartingVisible)
      return (
        <LoaderShade style={{ backgroundColor: 'transparent' }} message="Server is restarting" />
      )
    else return null
  }

  return (
    <Suspense fallback={<LoaderShade />}>
      <SocketProvider>
        <Reloader />
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" exact element={<Navigate replace to="/projectManager/dashboard" />} />
            <Route
              path="/projectManager"
              exact
              element={<Navigate replace to="/projectManager/dashboard" />}
            />

            <Route path="/projectManager/:module" element={<ProjectManager />} />
            <Route path={'/projects/:projectName/:module'} element={<ProjectPage />} />
            <Route path={'/projects/:projectName/addon/:addonName'} element={<ProjectPage />} />
            <Route
              path="/settings"
              exact
              element={<Navigate replace to="/settings/anatomyPresets" />}
            />
            <Route path="/settings/:module" exact element={<SettingsPage />} />
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
            <Route path="/events" element={<EventPage />} />
            <Route element={<ErrorPage code="404" />} />
          </Routes>
        </BrowserRouter>
      </SocketProvider>
    </Suspense>
  )
}

export default App
