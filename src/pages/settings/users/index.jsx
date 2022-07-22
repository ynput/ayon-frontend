import { useState } from 'react'
import ProjectList from '/src/containers/projectList'
import UserList from './userList'
import UserDetail from './userDetail'

const Users = () => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [reloadTrigger, setReloadTrigger] = useState(0)

  // const triggerReload = () => setReloadTrigger(reloadTrigger+1)

  return (
    <main className="rows">
      <section className="invisible row">
        buttons will be here
      </section>

      <section className="invisible row" style={{flexGrow: 1}}>

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
        />
      </section>

      <section className="lighter" style={{ flexBasis: '400px', padding: 0, height: "100%" }}>
        <UserDetail 
          selectedUsers={selectedUsers} 
          reloadTrigger={reloadTrigger}
        />
      </section>
      </section>
    </main>
  )
}

export default Users
