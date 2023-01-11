import { useState } from 'react'
import ProjectList from '/src/containers/projectList'
import UserList from './UserList'
import UserDetail from './userDetail'

const Users = () => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const [userDetailData, setUserDetailData] = useState({})

  const triggerReload = () => setReloadTrigger(reloadTrigger + 1)

  return (
    <main>
      <ProjectList
        showNull="( default )"
        multiselect={true}
        selection={selectedProjects}
        onSelect={setSelectedProjects}
      />

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
