import { useState } from 'react'
import AccessGroupList from './AccessGroupList'
import AccessGroupDetail from './AccessGroupDetail'
import ProjectList from '/src/containers/projectList'

const AccessGroups = () => {
  const [projectName, setProjectName] = useState(null)
  const [selectedAccessGroup, setSelectedAccessGroup] = useState(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const triggerReload = () => setReloadTrigger(reloadTrigger + 1)

  return (
    <main>
      <ProjectList showNull="Global [All Projects]" selection={projectName} onSelect={setProjectName} />

      <AccessGroupList
        projectName={projectName}
        reloadTrigger={reloadTrigger}
        selectedAccessGroup={selectedAccessGroup}
        onSelectAccessGroup={setSelectedAccessGroup}
      />

      <AccessGroupDetail
        projectName={projectName}
        accessGroupName={selectedAccessGroup?.name}
        onChange={triggerReload}
        onSelectAccessGroup={setSelectedAccessGroup}
      />
    </main>
  )
}

export default AccessGroups
