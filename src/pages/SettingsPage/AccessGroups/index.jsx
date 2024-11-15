import { useState } from 'react'
import AccessGroupList from './AccessGroupList'
import AccessGroupDetail from './AccessGroupDetail'
import ProjectList from '@containers/projectList'

const AccessGroups = () => {
  const [projectName, setProjectName] = useState(null)
  const [selectedAccessGroup, setSelectedAccessGroup] = useState(null)
  const [reloadTrigger, setReloadTrigger] = useState(0)

  const triggerReload = () => setReloadTrigger(reloadTrigger + 1)

  return (
    <main>
      <ProjectList
        showNull="Default (all projects)"
        selection={projectName}
        hideAddProjectButton
        onSelect={setProjectName}
        style={{ flex: 1 }}
      />

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
