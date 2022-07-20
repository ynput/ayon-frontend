import { useState } from 'react'
import RolesList from './rolesList'
import RoleDetail from './roleDetail'
import ProjectList from '/src/containers/projectList'

const Roles = () => {
  const [projectName, setProjectName] = useState(null)
  const [selectedRole, setSelectedRole] = useState(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const triggerReload = () => setReloadTrigger(reloadTrigger+1)

  return (
    <main>

      <section className="invisible row" style={{flexGrow: 1}}>

        <section className="lighter" style={{ flexBasis: 400, padding: 0, height: "100%" }}>
          <ProjectList
            showNull="( default )"
            selectedProject={projectName}
            onSelectProject={setProjectName}
          />
        </section>

        <section className="lighter" style={{ flexBasis: 400, padding: 0, height: "100%" }}>
          <RolesList 
            projectName={projectName}
            reloadTrigger={reloadTrigger}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
          />
        </section>

        <RoleDetail 
          projectName={projectName} 
          roleName={selectedRole} 
          onChange={triggerReload}
        />

      </section>

    </main>
  )
}

export default Roles

