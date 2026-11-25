import { useMemo, useEffect, lazy } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import SettingsAddon from './SettingsAddon'
import AppNavLinks from '@containers/header/AppNavLinks'
import { useSelector } from 'react-redux'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
import HelpButton from '@components/HelpButton/HelpButton'
import { useSettingsNavigation } from '@containers/Navigation'

const AnatomyPresets = lazy(() => import('./AnatomyPresets/AnatomyPresets'))
const Bundles = lazy(() => import('./Bundles'))
const StudioSettings = lazy(() => import('./StudioSettings'))
const SiteSettings = lazy(() => import('./SiteSettings'))
const UsersSettings = lazy(() => import('./UsersSettings'))
const AccessGroups = lazy(() => import('./AccessGroups'))
const Attributes = lazy(() => import('./Attributes'))
const Secrets = lazy(() => import('./Secrets'))
const AddonsManager = lazy(() => import('./AddonsManager'))
const ServerConfig = lazy(() => import('./ServerConfig/ServerConfig'))

const SettingsPage = () => {
  const { module, addonName } = useParams()
  // the settings sub-pages and the classic addons' settings, from the navigation registry
  const { item, addonsData, isManager } = useSettingsNavigation()

  useEffect(() => {
    //document.title = 'Settings'
    return () => {
      //console.log('unmounting settings page')
    }
  }, [])

  const moduleComponent = useMemo(() => {
    if (addonName) {
      for (const addon of addonsData || []) {
        if (addon.name === addonName) {
          return (
            <SettingsAddon
              addonName={addonName}
              addonVersion={addon.version}
              sidebar={addon.settings.sidebar}
            />
          )
        }
      }
    }

    // Managers don't have access to addons nor bundles, redirecting to root if attempting to access the routes directly
    switch (module) {
      case 'addons':
        if (isManager) return <Navigate to="/" />
        return <AddonsManager />
      case 'bundles':
        if (isManager) return <Navigate to="/" />
        return <Bundles />
      case 'anatomyPresets':
        return <AnatomyPresets />
      case 'studio':
        return <StudioSettings />
      case 'site':
        return <SiteSettings />
      case 'users':
        return <UsersSettings />
      case 'accessGroups':
        return <AccessGroups canCreateOrDelete />
      case 'attributes':
        return <Attributes />
      case 'secrets':
        return <Secrets />
      case 'server':
        return <ServerConfig />
      default:
        return <Navigate to="/settings" />
    }
  }, [module, addonName, addonsData, isManager])

  const links = useMemo(() => {
    const addonTitle =
      addonName && addonsData
        ? addonsData.find((addon) => addon.name === addonName)?.title
        : undefined

    return [
      ...item.tabs,
      { node: 'spacer' },
      { node: <HelpButton module={addonName || module} pageName={addonTitle} /> },
    ]
  }, [item, addonsData, addonName, module])

  const title = useTitle(addonName || module, links, '', '')
  const revertedTitle = title === 'Studio settings' ? title : title + ' • Studio settings'
  return (
    <>
      <DocumentTitle title={revertedTitle} />
      <AppNavLinks links={links} />
      {moduleComponent}
    </>
  )
}

export default SettingsPage
