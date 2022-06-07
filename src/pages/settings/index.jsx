import { useMemo, useEffect } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { Spacer } from '../../components'

import AnatomyPresets from './anatomyPresets'
import SystemSettings from './systemSettings'
import AddonsSettings from './addons'

const SettingsPage = () => {
  const { module } = useParams()

  useEffect(() => {
    document.title = 'Settings'
    return () => {
      console.log('unmounting settings page')
    }
  }, [])

  const moduleComponent = useMemo(() => {
    console.log('Loading settings module', module)
    switch (module) {
      case 'anatomy':
        return <AnatomyPresets />
      case 'system':
        return <SystemSettings />
      case 'addons':
        return <AddonsSettings />
      default:
        return <div>Not implemented</div>
    }
  }, [module])

  return (
    <>
      <nav id="project-nav">
        <NavLink to={`/settings/anatomy`}>Anatomy</NavLink>
        <NavLink to={`/settings/addons`}>Addons</NavLink>
        <NavLink to={`/settings/system`}>System</NavLink>
        <NavLink to={`/settings/attributes`}>Attributes</NavLink>
        <NavLink to={`/settings/users`}>Users</NavLink>
        <Spacer />
      </nav>
      {moduleComponent}
    </>
  )
}

export default SettingsPage
