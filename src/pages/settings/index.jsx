import { useMemo, useEffect, lazy } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { Spacer } from '@ynput/ayon-react-components'

const AnatomyPresets = lazy(() => import('./AnatomyPresets'))
const AddonsSettings = lazy(() => import('./AddonsSettings'))
const StudioSettings = lazy(() => import('./StudioSettings'))
const SiteSettings = lazy(() => import('./SiteSettings'))
const Users = lazy(() => import('./users'))
const Roles = lazy(() => import('./roles'))
const Attributes = lazy(() => import('./Attributes'))

const SettingsPage = () => {
  const { module } = useParams()

  useEffect(() => {
    //document.title = 'Settings'
    return () => {
      console.log('unmounting settings page')
    }
  }, [])

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
        return <Users />
      case 'roles':
        return <Roles />
      case 'attributes':
        return <Attributes />
      default:
        return <div>Not implemented</div>
    }
  }, [module])

  return (
    <>
      <nav className="secondary">
        <NavLink to={`/settings/anatomyPresets`}>Anatomy presets</NavLink>
        <NavLink to={`/settings/addons`}>Addons</NavLink>
        <NavLink to={`/settings/studio`}>Studio settings</NavLink>
        <NavLink to={`/settings/site`}>Site settings</NavLink>
        <NavLink to={`/settings/attributes`}>Attributes</NavLink>
        <NavLink to={`/settings/users`}>Users</NavLink>
        <NavLink to={`/settings/roles`}>Roles</NavLink>
        <Spacer />
      </nav>
      {moduleComponent}
    </>
  )
}

export default SettingsPage
