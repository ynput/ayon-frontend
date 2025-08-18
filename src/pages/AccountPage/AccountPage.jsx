import { useMemo } from 'react'
import SessionList from './SessionListPage'
import { Panel } from '@ynput/ayon-react-components'
import { Navigate, useParams } from 'react-router-dom'
import { useGetCurrentUserQuery } from '@shared/api'
import styled from 'styled-components'
import AppNavLinks from '@containers/header/AppNavLinks'
// import SiteSettings from './SiteSettingsPage'
import ProfilePage from './ProfilePage'
import DownloadsPage from './DownloadsPage/DownloadsPage'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'

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
  const { data: userData, isLoading } = useGetCurrentUserQuery()

  const moduleComponent = useMemo(() => {
    switch (module) {
      case 'profile':
        return <ProfilePage user={userData} isLoading={isLoading} />
      case 'sessions':
        return <SessionList userName={userData?.name} />
      case 'downloads':
        return <DownloadsPage />
      case 'settings':
        return <>Settings</>
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
    { name: 'Launchers', path: '/account/downloads', module: 'downloads' },
    // {
    //   name: 'Settings',
    //   path: '/account/settings',
    //   module: 'settings',
    // },
  ]
  
  const title = useTitle(module, links, 'AYON')
  
  return (
    <>
      <DocumentTitle title={title} />
      <AppNavLinks links={links} />
      {moduleComponent}
    </>
  )
}

export default AccountPage
