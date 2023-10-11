import { useMemo, useEffect, lazy } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useGetSettingsAddonsQuery } from '../../services/addons/getAddons'

import SettingsAddon from './SettingsAddon'
import AppNavLinks from '/src/containers/header/AppNavLinks'
import Tooltips from '/src/components/Tooltips/Tooltips'

const AnatomyPresets = lazy(() => import('./AnatomyPresets/AnatomyPresets'))
const Bundles = lazy(() => import('./Bundles'))
const StudioSettings = lazy(() => import('./StudioSettings'))
const SiteSettings = lazy(() => import('./SiteSettings'))
const UsersSettings = lazy(() => import('./UsersSettings'))
const AccessGroups = lazy(() => import('./AccessGroups'))
const Attributes = lazy(() => import('./Attributes'))
const Secrets = lazy(() => import('./Secrets'))

const SettingsPage = () => {
  const { module, addonName } = useParams()

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

    let moduleComponent

    switch (module) {
      case 'anatomyPresets':
        moduleComponent = (props) => <AnatomyPresets {...props} />
        break
      case 'bundles':
        moduleComponent = (props) => <Bundles {...props} />
        break
      case 'studio':
        moduleComponent = (props) => <StudioSettings {...props} />
        break
      case 'site':
        moduleComponent = (props) => <SiteSettings {...props} />
        break
      case 'users':
        moduleComponent = (props) => <UsersSettings {...props} />
        break
      case 'accessGroups':
        moduleComponent = (props) => <AccessGroups {...props} />
        break
      case 'attributes':
        moduleComponent = (props) => <Attributes {...props} />
        break
      case 'secrets':
        moduleComponent = (props) => <Secrets {...props} />
        break
      default:
        moduleComponent = () => <Navigate to="/settings" />
        break
    }

    return moduleComponent
  }, [module, addonName, addonsData])

  const links = useMemo(() => {
    let result = [
      {
        name: 'Bundles',
        path: '/settings/bundles',
        module: 'bundles',
        accessLevels: ['manager'],
      },
      {
        name: 'Studio settings',
        path: '/settings/studio',
        module: 'studio',
        accessLevels: ['manager'],
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
    ]

    if (!addonsData) return result

    for (const addon of addonsData) {
      result.push({
        name: addon.title,
        path: `/settings/addon/${addon.name}`,
        module: addon.name,
        accessLevels: ['manager'],
      })
    }

    return result
  }, [addonsData])

  return (
    <>
      <AppNavLinks links={links} />
      <Tooltips render={moduleComponent} />
    </>
  )
}

export default SettingsPage
