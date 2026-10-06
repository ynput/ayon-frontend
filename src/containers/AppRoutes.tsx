import { FC, lazy, useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Navigate, Route, Routes } from 'react-router-dom'

import ProtectedRoute from '@containers/ProtectedRoute'
const MarketPage = lazy(() => import('@pages/MarketPage'))
const InboxPage = lazy(() => import('@pages/InboxPage'))
const ProjectPage = lazy(() => import('@pages/ProjectPage/ProjectPage'))
const ProjectManagerPage = lazy(() => import('@pages/ProjectManagerPage'))
const ExplorerPage = lazy(() => import('@pages/ExplorerPage'))
const APIDocsPage = lazy(() => import('@pages/APIDocsPage'))
const AccountPage = lazy(() => import('@pages/AccountPage'))
const SettingsPage = lazy(() => import('@pages/SettingsPage'))
const EventsPage = lazy(() => import('@pages/EventsPage'))
const ServicesPage = lazy(() => import('@pages/ServicesPage'))
const UserDashboardPage = lazy(() => import('@pages/UserDashboardPage'))
const ErrorPage = lazy(() => import('@pages/ErrorPage'))
const EditorPlaygroundPage = lazy(() => import('@pages/EditorPlaygroundPage'))

import { useLoadRemotePages } from '../remote/useLoadRemotePages'

import LoadingPage from '@pages/LoadingPage'
import { RemoteAddon, useGlobalContext } from '@shared/context'
import { afterStartup } from '@shared/util'
import { toast } from 'react-toastify'

interface AppRoutesProps {}

// catch-all route: an unknown path may be an addon route, so load those straight away
const UnknownRoute = ({ isLoading, onMount }: { isLoading: boolean; onMount: () => void }) => {
  useEffect(() => {
    onMount()
  }, [onMount])

  return isLoading ? <LoadingPage /> : <ErrorPage code="404" />
}

const AppRoutes: FC<AppRoutesProps> = () => {
  const { user } = useGlobalContext()
  const { uiExposureLevel: level = 0 } = user || {}
  // dynamically import routes
  // these are added as they load, the built in routes don't wait for them
  const [loadRemoteRoutes, setLoadRemoteRoutes] = useState(false)
  const requestRemoteRoutes = useCallback(() => setLoadRemoteRoutes(true), [])
  const { remotePages, isLoading: isLoadingModules } = useLoadRemotePages({
    moduleKey: 'Route',
    skip: !loadRemoteRoutes,
  }) as { remotePages: RemoteAddon[]; isLoading: boolean }

  // addon routes are rarely the page being opened, so they are loaded a little after start up
  // to keep their (large) bundles from competing with the page that is loading
  useEffect(() => {
    if (loadRemoteRoutes) return
    return afterStartup(requestRemoteRoutes)
  }, [loadRemoteRoutes, requestRemoteRoutes])

  if (!user) {
    return <LoadingPage />
  }

  return (
    <Routes>
      {remotePages.map((remote) => (
        <Route
          key={remote.id}
          path={remote.path}
          element={
            <remote.component
              router={{
                ...{ useParams, useNavigate, useLocation, useSearchParams },
              }}
              toast={toast}
            />
          }
        />
      ))}
      <Route path="/" element={<Navigate replace to="/dashboard/tasks" />} />

      <Route path="/dashboard" element={<Navigate replace to="/dashboard/tasks" />} />
      <Route path="/dashboard/:module" element={<UserDashboardPage />} />
      <Route path="/dashboard/addon/:addonName" element={<UserDashboardPage />} />
      <Route path="/manageProjects" element={<ProjectManagerPage />} />
      <Route path="/manageProjects/:module" element={<ProjectManagerPage />} />
      {/* Allow reviews route for all levels */}
      <Route
        path={'/projects/:projectName/reviews/:sessionId'}
        element={
          <ProtectedRoute
            isAllowed={level > 0}
            redirectPath="/"
            preserveParams={['uri', 'type', 'project', 'id', 'activity', 'sessionId']}
          >
            <ProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={'/projects/:projectName'}
        element={
          <ProtectedRoute
            isAllowed={level >= 500}
            redirectPath="/"
            preserveParams={['uri', 'type', 'project', 'id', 'activity']}
          >
            <ProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={'/projects/:projectName/:module/*'}
        element={
          <ProtectedRoute
            isAllowed={level >= 500}
            redirectPath="/"
            preserveParams={['uri', 'type', 'project', 'id', 'activity']}
          >
            <ProjectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path={'/projects/:projectName/addon/:addonName'}
        element={
          <ProtectedRoute
            isAllowed={level >= 500}
            redirectPath="/"
            preserveParams={['uri', 'type', 'project', 'id', 'activity']}
          >
            <ProjectPage />
          </ProtectedRoute>
        }
      />
      <Route path="/settings" element={<Navigate replace to="/settings/anatomyPresets" />} />
      <Route path="/settings/:module" element={<SettingsPage />} />
      <Route
        path="/settings/addon/:addonName"
        element={
          <ProtectedRoute isAllowed={level >= 700} redirectPath="/">
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/services"
        element={
          <ProtectedRoute isAllowed={level >= 700} redirectPath="/">
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/market"
        element={
          <ProtectedRoute isAllowed={level >= 700} redirectPath="/">
            <MarketPage />
          </ProtectedRoute>
        }
      />

      <Route path="/inbox/:module" element={<InboxPage />} />
      <Route path="/inbox" element={<Navigate to="/inbox/important" />} />

      <Route path="/explorer" element={<ExplorerPage />} />
      <Route path="/doc/api" element={<APIDocsPage />} />
      <Route path="/account" element={<Navigate replace to="/account/profile" />} />
      <Route path="/account/:module" element={<AccountPage />} />
      <Route
        path="/events"
        element={
          <ProtectedRoute isAllowed={level >= 700} redirectPath="/">
            <EventsPage />
          </ProtectedRoute>
        }
      />
      {/* dev page for the lexical markdown editor */}
      <Route
        path="/dev/editor"
        element={
          <ProtectedRoute isAllowed={import.meta.env.DEV || level >= 700} redirectPath="/">
            <EditorPlaygroundPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="*"
        element={
          <UnknownRoute
            isLoading={!loadRemoteRoutes || isLoadingModules}
            onMount={requestRemoteRoutes}
          />
        }
      />
    </Routes>
  )
}

export default AppRoutes
