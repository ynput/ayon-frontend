import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'

import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'

import Header from './containers/header'

import LoginPage from './pages/login'
import LoadingPage from './pages/loading'
import ProjectPage from './pages/projectPage'
import ProjectManager from './pages/projectManager'
import ExplorerPage from './pages/explorer'
import APIDocsPage from './pages/doc/api'
import ProfilePage from './pages/profile'
import Anatomy from './pages/anatomy'
import Error from './pages/error'

import { login } from './features/user'
import { setSettings } from './features/settings'

const SettingsLoader = () => {
  const user = useSelector((state) => ({ ...state.user }))
  const dispatch = useDispatch()

  useEffect(() => {
    if (!user.name) return
    axios.get('/api/settings').then((response) => {
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
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" exact element={<Navigate replace to="/projects" />} />
        <Route path="/projects" exact element={<ProjectManager />} />
        <Route
          path="/projects/:projectName/:module"
          exact
          element={<ProjectPage />}
        />

        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/doc/api" element={<APIDocsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/anatomy" element={<Anatomy />} />

        <Route element={<Error code="404" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
