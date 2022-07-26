import { useState } from 'react'
import ProjectList from '/src/containers/projectList'
import UserList from './userList'
import UserDetail from './userDetail'

const Users = () => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState(0)
  const [userDetailData, setUserDetailData] = useState({})

  const triggerReload = () => setReloadTrigger(reloadTrigger+1)

  return (
    <main>
      <section className="lighter" style={{ flexBasis: '400px', padding: 0, height: "100%" }}>
        <ProjectList
          showNull="( default )"
          multiselect={true}
          selection={selectedProjects}
          onSelect={setSelectedProjects}
        />
      </section>

      <section className="lighter" style={{ flexGrow: 1, padding: 0, height: "100%" }}>
        <UserList 
          selectedProjects={selectedProjects} 
          selectedUsers={selectedUsers}
          onSelectUsers={setSelectedUsers}
          reloadTrigger={reloadTrigger}
          setUserDetailData={setUserDetailData}
        />
      </section>

        <UserDetail 
          userDetailData={userDetailData}
          reloadTrigger={reloadTrigger}
          onTriggerReload={triggerReload}
        />
    </main>
  )
}

export default Users
