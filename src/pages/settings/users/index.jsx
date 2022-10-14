import { useState } from 'react'
import ProjectList from '/src/containers/projectList'
import UserList from './userList'
import UserDetail from './userDetail'

import { Section, Panel } from '/src/components'

const Users = () => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const [userDetailData, setUserDetailData] = useState({})

  const triggerReload = () => setReloadTrigger(reloadTrigger + 1)

  return (
    <main>
      <Section style={{ maxWidth: 400 }}>
        <Panel className="nopad">
          <ProjectList
            showNull="( default )"
            multiselect={true}
            selection={selectedProjects}
            onSelect={setSelectedProjects}
          />
        </Panel>
      </Section>

      <UserList
        selectedProjects={selectedProjects}
        selectedUsers={selectedUsers}
        onSelectUsers={setSelectedUsers}
        reloadTrigger={reloadTrigger}
        setUserDetailData={setUserDetailData}
        onTriggerReload={triggerReload}
      />

      <UserDetail
        userDetailData={userDetailData}
        reloadTrigger={reloadTrigger}
        onTriggerReload={triggerReload}
      />
    </main>
  )
}

export default Users
