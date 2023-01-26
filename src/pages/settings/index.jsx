import { useMemo, useEffect, lazy } from 'react'
import { useParams, NavLink, Navigate } from 'react-router-dom'
import { Spacer } from '@ynput/ayon-react-components'
import { useSelector } from 'react-redux'

const AnatomyPresets = lazy(() => import('./AnatomyPresets'))
const AddonsSettings = lazy(() => import('./AddonsSettings'))
const StudioSettings = lazy(() => import('./StudioSettings'))
const SiteSettings = lazy(() => import('./SiteSettings'))
const UsersSettings = lazy(() => import('./users/UsersSettings'))
const Roles = lazy(() => import('./roles'))
const Attributes = lazy(() => import('./Attributes'))

const SettingsPage = () => {
  let { module } = useParams()
  const isUser = useSelector((state) => state.user.data.isUser)

  useEffect(() => {
    //document.title = 'Settings'
    return () => {
      console.log('unmounting settings page')
    }
  }, [])

  // the settings regular users can access
  const userAccess = ['site']

  const moduleComponent = useMemo(() => {
    switch (module) {
      case 'anatomyPresets':
        return <AnatomyPresets />
      case 'studio':
        return <StudioSettings />
      case 'site':
        return <SiteSettings />
      case 'addons':
        return <AddonsSettings />
      case 'users':
        return <UsersSettings />
      case 'roles':
        return <Roles />
      case 'attributes':
        return <Attributes />
      default:
        return <div>Not implemented</div>
    }
  }, [module])

  const Links = [
    {
      name: 'Anatomy presets',
      path: '/settings/anatomyPresets',
      module: 'anatomyPresets',
    },
    {
      name: 'Addons',
      path: '/settings/addons',
      module: 'addons',
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
  ]

  const navLinks = Links.map((link, idx) => {
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
