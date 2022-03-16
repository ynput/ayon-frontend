import { useEffect, useState } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import axios from 'axios'

import { Routes, Route, Navigate, BrowserRouter } from 'react-router-dom'

import NavBar from './containers/navbar'

import LoginPage from './pages/login'
import LoadingPage from './pages/loading'
import ProjectsPage from './pages/projects'
import BrowserPage from './pages/browser'
import ManagerPage from './pages/manager'
import SiteSyncPage from './pages/sitesync'
import ExplorerPage from './pages/explorer'
import APIDocsPage from './pages/doc/api'
import Error from './pages/error'

const Profile = () => {
  return <main className="center">Profile page</main>
}

const SettingsLoader = () => {
  const user = useSelector((state) => ({ ...state.userReducer }))
  const dispatch = useDispatch()

  useEffect(() => {
    if (!user.name) return
    axios.get('/api/settings').then((response) => {
      dispatch({ type: 'SET_SETTINGS', data: response.data })
    })
    // eslint-disable-next-line
  }, [user.name])

  return <LoadingPage />
}

const App = () => {
  const user = useSelector((state) => ({ ...state.userReducer }))
  const settings = useSelector((state) => ({ ...state.settingsReducer }))
  const dispatch = useDispatch()
  const [loading, setLoading] = useState(false)

  const storedAccessToken = localStorage.getItem('accessToken')
  if (storedAccessToken)
    axios.defaults.headers.common[
      'Authorization'
    ] = `Bearer ${storedAccessToken}`

  console.log('ACCESS TOKEN', storedAccessToken)

  useEffect(() => {
    setLoading(true)
    axios
      .get('/api/users/me')
      .then((response) => {
        dispatch({
          type: 'LOGIN',
          user: response.data,
        })
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [dispatch])

  if (loading) return <LoadingPage />
  if (!user.name) return <LoginPage />

  if (window.location.pathname.startsWith('/login/')) {
    // already logged in, but stuck on the login page
    window.history.replaceState({}, document.title, '/')
    return <LoadingPage />
  }

  // Load settings
  if (Object.keys(settings).length === 0) return <SettingsLoader />

  // TBD: at some moment, loading the last opened project seemed
  // to be a good idea, but it's weird, so we'll just use the projects page

  let homeScreen = '/projects'
  // const currentProject = window.localStorage.getItem('currentProject')
  // if (currentProject)
  //     homeScreen = `/browser/${currentProject}`

  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" exact element={<Navigate replace to={homeScreen} />} />
        <Route path="/projects" exact element={<ProjectsPage />} />
        <Route path="/browser/:projectName" exact element={<BrowserPage />} />
        <Route path="/manager/:projectName" exact element={<ManagerPage />} />
        <Route path="/sitesync/:projectName" exact element={<SiteSyncPage />} />

        <Route path="/explorer" element={<ExplorerPage />} />
        <Route path="/doc/api" element={<APIDocsPage />} />
        <Route path="/profile" element={<Profile />} />

        <Route element={<Error code="404" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
