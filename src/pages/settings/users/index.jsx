import ProjectList from '/src/containers/projectList'
import UserList from './userList'


const Users = () => {

  return (
    <main>

      <section className="lighter" style={{ flexBasis: '400px', padding: 0 }}>
        <ProjectList showAllProjects={true} />
      </section>

      <section className="lighter" style={{ flexGrow: 1, padding: 0 }}>
        <UserList />
      </section>

      <section className="lighter" style={{ flexBasis: '400px', padding: 0 }}>
        user detail
      </section>
      
    </main>
  )
}


export default Users
