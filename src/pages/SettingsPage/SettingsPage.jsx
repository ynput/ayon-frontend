import { useMemo, useEffect, lazy } from 'react'
import { useParams, NavLink, Navigate } from 'react-router-dom'
import { Spacer } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'
import { useGetSettingsAddonsQuery } from '../../services/addons/getAddons'

import SettingsAddon from './SettingsAddon'
import YnputConnectPage from './YnputConnectPage'

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
  const isUser = useSelector((state) => state.user.data.isUser)

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

  // the settings regular users can access
  const userAccess = ['site']

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
      case 'connect':
        return <YnputConnectPage />
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
      },
      {
        name: 'Studio settings',
        path: '/settings/studio',
        module: 'studio',
      },
      {
        name: 'Site settings',
        path: '/settings/site',
        module: 'site',
      },
      {
        name: 'Anatomy presets',
        path: '/settings/anatomyPresets',
        module: 'anatomyPresets',
      },
      {
        name: 'Attributes',
        path: '/settings/attributes',
        module: 'attributes',
      },
      {
        name: 'Users',
        path: '/settings/users',
        module: 'users',
      },
      {
        name: 'Roles',
        path: '/settings/roles',
        module: 'roles',
      },
      {
        name: 'Secrets',
        path: '/settings/secrets',
        module: 'secrets',
      },
      // {
      //   name: 'YnputConnector',
      //   path: '/settings/connect',
      //   module: 'connect',
      // },
    ]

    if (!addonsData) return result

    for (const addon of addonsData) {
      result.push({
        name: addon.title,
        path: `/settings/addon/${addon.name}`,
        module: addon.name,
      })
    }

    return result
  }, [addonsData])

  const navLinks = links.map((link, idx) => {
    if (isUser && !userAccess.includes(link.module)) return null
    return (
      <NavLink key={idx} to={link.path}>
        {link.name}
      </NavLink>
    )
  })

  // if user and module not in userAccess, redirect to site settings
  if (isUser && !userAccess.includes(module)) {
    return <Navigate to={`/settings/${userAccess[0]}`} />
  }

  return (
    <>
      <nav className="secondary">
        {navLinks}
        <Spacer />
      </nav>
      {moduleComponent}
    </>
  )
}

export default SettingsPage
