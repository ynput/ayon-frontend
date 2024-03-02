import { useMemo } from 'react'
import SessionList from '/src/containers/SessionList'
import { Panel } from '@ynput/ayon-react-components'
import { Navigate, useParams } from 'react-router-dom'
import { useGetMeQuery } from '../services/user/getUsers'
import styled from 'styled-components'
import AppNavLinks from '../containers/header/AppNavLinks'
import SiteSettings from './SettingsPage/SiteSettings'
import ProfilePage from './ProfilePage'
import ProjectRoots from './ProjectManagerPage/ProjectRoots'

export const PanelButtonsStyled = styled(Panel)`
  flex-direction: row;

  & > * {
    flex: 1;
  }
`

const AccountPage = () => {
  const { module } = useParams()

  // RTK QUERIES
  // GET USER DATA
  const { data: userData, isLoading } = useGetMeQuery()

  const moduleComponent = useMemo(() => {
    switch (module) {
      case 'profile':
        return <ProfilePage user={userData} isLoading={isLoading} />
      case 'sessions':
        return <SessionList userName={userData?.name} />
      case 'downloads':
        return <>Downloads</>
      case 'machine':
        return <SiteSettings />
      case 'roots':
        return <ProjectRoots />
      default:
        return <Navigate to="/account/profile" />
    }
  }, [module, userData])

  let links = [
    {
      name: 'Profile',
      path: '/account/profile',
      module: 'profile',
    },
    {
      name: 'Sessions',
      path: '/account/sessions',
      module: 'sessions',
    },
    { name: 'Downloads', path: '/account/downloads', module: 'downloads' },
    {
      name: 'Machine',
      path: '/account/machine',
      module: 'machine',
    },
    {
      name: 'Roots',
      path: '/account/roots',
      module: 'roots',
    },
  ]

  return (
    <>
      <AppNavLinks links={links} />
      {moduleComponent}
    </>
  )
}

export default AccountPage
