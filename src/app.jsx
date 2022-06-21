import { useEffect, useState, Suspense, lazy } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'

import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'

import Header from './containers/header'

import LoginPage from './pages/login'
import LoadingPage from './pages/loading'
import Error from './pages/error'

const ProjectPage = lazy(() => import('./pages/project'))
const ProjectManager = lazy(() => import('./pages/projectManager'))
const ExplorerPage = lazy(() => import('./pages/explorer'))
const APIDocsPage = lazy(() => import('./pages/doc/api'))
const ProfilePage = lazy(() => import('./pages/profile'))
const SettingsPage = lazy(() => import('./pages/settings'))

import { login } from './features/user'
import { setSettings } from './features/settings'

const SettingsLoader = () => {
  const user = useSelector((state) => ({ ...state.user }))
  const dispatch = useDispatch()

  useEffect(() => {
    if (!user.name) return
    axios.get('/api/settings/attributes').then((response) => {
      dispatch(setSettings(response.data))
    })
    // eslint-disable-next-line
  }, [user.name])

  return <LoadingPage />
}

const App = () => {
  const user = useSelector((state) => ({ ...state.user }))
  const settings = useSelector((state) => ({ ...state.settings }))
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const storedAccessToken = localStorage.getItem('accessToken')
  if (storedAccessToken)
    axios.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${storedAccessToken}`

  useEffect(() => {
    setLoading(true)
    axios
      .get('/api/users/me')
      .then((response) => {
        dispatch(
          login({
            user: response.data,
            accessToken: storedAccessToken,
          })
        )
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [dispatch, storedAccessToken])

  if (loading) return <LoadingPage />
  if (!user.name) return <LoginPage />

  if (window.location.pathname.startsWith('/login/')) {
    // already logged in, but stuck on the login page
    window.history.replaceState({}, document.title, '/')
    return <LoadingPage />
  }

  // Load settings
  if (Object.keys(settings).length === 0) return <SettingsLoader />

  return (
    <Suspense fallback={<LoadingPage />}>
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

          <Route element={<Error code="404" />} />
        </Routes>
      </BrowserRouter>
    </Suspense>
  )
}

export default App
