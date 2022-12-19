import { useState } from 'react'
import RolesList from './rolesList'
import RoleDetail from './roleDetail'
import ProjectList from '/src/containers/projectList'

const Roles = () => {
  const [projectName, setProjectName] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const triggerReload = () => setReloadTrigger(reloadTrigger + 1)

  return (
    <main>
      <ProjectList showNull="( default )" selection={projectName} onSelect={setProjectName} />

      <RolesList
        projectName={projectName}
        reloadTrigger={reloadTrigger}
        selectedRole={selectedRole}
        onSelectRole={setSelectedRole}
      />

      <RoleDetail projectName={projectName} role={selectedRole} onChange={triggerReload} />
    </main>
  )
}

export default Roles
