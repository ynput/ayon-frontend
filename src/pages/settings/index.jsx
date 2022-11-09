import { useMemo, useEffect, lazy } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { Spacer } from 'openpype-components'

const AnatomyPresets = lazy(() => import('./anatomyPresets'))
const AddonsSettings = lazy(() => import('./addons'))
const StudioOverrides = lazy(() => import('./studio'))
const Users = lazy(() => import('./users'))
const Roles = lazy(() => import('./roles'))
const Attributes = lazy(() => import('./attributes'))

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
        return <StudioOverrides />
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
        <NavLink to={`/settings/studio`}>Studio</NavLink>
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
