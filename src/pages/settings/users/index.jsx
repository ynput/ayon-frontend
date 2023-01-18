import { useState } from 'react'
import ProjectList from '/src/containers/projectList'
import UserList from './UserList'
import UserDetail from './userDetail'

const Users = () => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [selectedUsers, setSelectedUsers] = useState([])
  const [userDetailData, setUserDetailData] = useState({})

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
        setUserDetailData={setUserDetailData}
      />
      <UserDetail userDetailData={userDetailData} />
    </main>
  )
}

export default Users
