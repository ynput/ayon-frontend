import { FC, lazy } from 'react'
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

import { useLoadRemotePages } from '../remote/useLoadRemotePages'

import LoadingPage from '@pages/LoadingPage'
import { RemoteAddon } from '@shared/context'

interface AppRoutesProps {
  isUser: boolean
}

const AppRoutes: FC<AppRoutesProps> = ({ isUser }) => {
  // dynamically import routes
  const { remotePages, isLoading: isLoadingModules } = useLoadRemotePages({
    moduleKey: 'Route',
  }) as { remotePages: RemoteAddon[]; isLoading: boolean }

  if (isLoadingModules) {
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
      <Route path={'/projects/:projectName'} element={<ProjectPage />} />
      <Route path={'/projects/:projectName/:module/*'} element={<ProjectPage />} />
      <Route path={'/projects/:projectName/addon/:addonName'} element={<ProjectPage />} />
      <Route path="/settings" element={<Navigate replace to="/settings/anatomyPresets" />} />
      <Route path="/settings/:module" element={<SettingsPage />} />
      <Route path="/settings/addon/:addonName" element={<SettingsPage />} />
      <Route
        path="/services"
        element={
          <ProtectedRoute isAllowed={!isUser} redirectPath="/">
            <ServicesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/market"
        element={
          <ProtectedRoute isAllowed={!isUser} redirectPath="/">
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
      <Route path="/events" element={<EventsPage />} />
      <Route element={<ErrorPage code="404" />} />
    </Routes>
  )
}

export default AppRoutes
