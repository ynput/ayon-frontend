import { useMemo, useEffect, lazy } from 'react'
import { useParams } from 'react-router-dom'
import { useGetSettingsAddonsQuery } from '../../services/addons/getAddons'

import SettingsAddon from './SettingsAddon'
import AppNavLinks from '/src/containers/header/AppNavLinks'

const AnatomyPresets = lazy(() => import('./AnatomyPresets/AnatomyPresets'))
const Bundles = lazy(() => import('./Bundles'))
const StudioSettings = lazy(() => import('./StudioSettings'))
const SiteSettings = lazy(() => import('./SiteSettings'))
const UsersSettings = lazy(() => import('./UsersSettings'))
const Roles = lazy(() => import('./Roles'))
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

    switch (module) {
      case 'anatomyPresets':
        return <AnatomyPresets />
      case 'bundles':
        return <Bundles />
      case 'studio':
        return <StudioSettings />
      case 'site':
        return <SiteSettings />
      case 'users':
        return <UsersSettings />
      case 'roles':
        return <Roles />
      case 'attributes':
        return <Attributes />
      case 'secrets':
        return <Secrets />
      default:
        return <div>Not implemented</div>
    }
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
        name: 'Roles',
        path: '/settings/roles',
        module: 'roles',
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
      {moduleComponent}
    </>
  )
}

export default SettingsPage
