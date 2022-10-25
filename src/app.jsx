import pypeClient from '/src/pype'
import axios from 'axios'
import short from 'short-uuid'

import { useEffect, useState, Suspense, lazy } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'

import Header from './containers/header'
import LoginPage from './pages/login'
import LoadingPage from './pages/loading'
import Error from './pages/error'
import WebsocketListener from './containers/websocket'

const ProjectPage = lazy(() => import('./pages/project'))
const ProjectManager = lazy(() => import('./pages/projectManager'))
const ExplorerPage = lazy(() => import('./pages/explorer'))
const APIDocsPage = lazy(() => import('./pages/doc/api'))
const ProfilePage = lazy(() => import('./pages/profile'))
const SettingsPage = lazy(() => import('./pages/settings'))
const EventViewer = lazy(() => import('./pages/eventViewer'))
const ServicesPage = lazy(() => import('./pages/services'))

import { login } from './features/user'


const App = () => {
  const user = useSelector((state) => ({ ...state.user }))
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)
  const [serverError, setServerError] = useState(false)

  const storedAccessToken = localStorage.getItem('accessToken')
  if (storedAccessToken) {
    axios.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${storedAccessToken}`
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
            })
          )

          pypeClient.settings = {
            attributes: response.data.attributes,
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

  if (loading) return <LoadingPage />

  // User is not logged in
  if (!user.name) return <LoginPage />

  if (window.location.pathname.startsWith('/login/')) {
    // already logged in, but stuck on the login page
    window.history.replaceState({}, document.title, '/')
    return <LoadingPage />
  }

  if (serverError)
    return <ErrorPage code={serverError} message="Server connection failed" />

  //
  // RENDER THE MAIN APP
  //

  return (
    <Suspense fallback={<LoadingPage />}>
      <WebsocketListener />
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" exact element={<Navigate replace to="/projects" />} />
          <Route path="/projects" exact element={<ProjectManager />} />
          <Route
            path={'/projects/:projectName/:module'}
            element={<ProjectPage />}
          />
          <Route
            path={'/projects/:projectName/addon/:addonName'}
            element={<ProjectPage />}
          />

          <Route
            path="/settings"
            exact
            element={<Navigate replace to="/settings/anatomy" />}
          />
          <Route path="/settings/:module" exact element={<SettingsPage />} />

          <Route path="/explorer" element={<ExplorerPage />} />
          <Route path="/doc/api" element={<APIDocsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/events" element={<EventViewer />} />
          <Route path="/services" element={<ServicesPage />} />

          <Route element={<Error code="404" />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  )
}

export default App
