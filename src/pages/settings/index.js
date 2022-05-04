import { useMemo } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { Spacer } from '../../components'

import AnatomyPresets from './anatomyPresets'

const SettingsPage = () => {
  const { module } = useParams()

  const moduleComponent = useMemo(() => {
    switch (module) {
      case 'anatomy':
        return <AnatomyPresets />
      default:
        return <div>Not implemented</div>
    }
  }, [module])

  return (
    <>
      <nav id="project-nav">
        <NavLink to={`/settings/anatomy`}>Anatomy</NavLink>
        <NavLink to={`/settings/system`}>System</NavLink>
        <NavLink to={`/settings/users`}>Users</NavLink>
        <Spacer />
      </nav>
      {moduleComponent}
    </>
  )
}

export default SettingsPage
