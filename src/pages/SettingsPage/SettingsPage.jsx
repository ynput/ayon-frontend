import { useMemo, useEffect, lazy } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useGetSettingsAddonsQuery } from '@shared/api'

import SettingsAddon from './SettingsAddon'
import AppNavLinks from '@containers/header/AppNavLinks'
import { useSelector } from 'react-redux'
import DocumentTitle from '@components/DocumentTitle/DocumentTitle'
import useTitle from '@hooks/useTitle'
import HelpButton from '@components/HelpButton/HelpButton'

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
const OAuthManager = lazy(() => import('./OAuth'))

const SettingsPage = () => {
  const { module, addonName } = useParams()
  const isManager = useSelector((state) => state.user.data.isManager)

  const {
    data: addonsData,
    //isLoading: addonsLoading,
    //isError: addonsIsError,
  } = useGetSettingsAddonsQuery({})

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
      case 'oauth':
        return <OAuthManager />
      case 'server':
        return <ServerConfig />
      default:
        return <Navigate to="/settings" />
    }
  }, [module, addonName, addonsData, isManager])

  const links = useMemo(() => {
    const adminExtras = [
      {
        name: 'Global',
        path: '/settings/server',
        module: 'server',
        accessLevels: ['admin'],
      },
      {
        name: 'Addons',
        path: '/settings/addons',
        module: 'addons',
        accessLevels: ['manager'],
      },
      {
        name: 'Bundles',
        path: '/settings/bundles',
        module: 'bundles',
        accessLevels: ['manager'],
        shortcut: 'B+B',
      },
    ]

    let result = [
      {
        name: 'Studio settings',
        path: '/settings/studio',
        module: 'studio',
        accessLevels: ['manager'],
        shortcut: 'S+S',
      },
      {
        name: 'Site settings',
        path: '/settings/site',
        module: 'site',
        accessLevels: [],
      },
      {
        name: 'Anatomy presets',
        path: '/settings/anatomyPresets',
        module: 'anatomyPresets',
        accessLevels: ['manager'],
      },
      {
        name: 'Attributes',
        path: '/settings/attributes',
        module: 'attributes',
        accessLevels: ['manager'],
      },
      {
        name: 'Users',
        path: '/settings/users',
        module: 'users',
        accessLevels: ['manager'],
        shortcut: 'U+U',
      },
      {
        name: 'Permissions',
        path: '/settings/accessGroups',
        module: 'accessGroups',
        accessLevels: ['manager'],
      },
      {
        name: 'Secrets',
        path: '/settings/secrets',
        module: 'secrets',
        accessLevels: ['manager'],
      },
      {
        name: 'OAuth',
        path: '/settings/oauth',
        module: 'oauth',
        accessLevels: ['manager'],
      },
    ]
    if (!isManager) {
      result = [...adminExtras, ...result]
    }

    if (!addonsData) return result

    for (const addon of addonsData) {
      result.push({
        name: addon.title,
        path: `/settings/addon/${addon.name}`,
        module: addon.name,
        accessLevels: ['manager'],
      })
    }
      result.push({ node: 'spacer' })
      
      const addonTitle = addonName && addonsData
         ? addonsData.find(addon => addon.name === addonName)?.title
         : undefined
      
      result.push({
          node: <HelpButton module={addonName || module} pageName={addonTitle} />,
      })
    return result
  }, [addonsData, isManager])

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
