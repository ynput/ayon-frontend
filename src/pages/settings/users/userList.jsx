import { useState, useEffect } from 'react'
import { DataTable } from 'primereact/datatable'
import { Column } from 'primereact/column'
import axios from 'axios'

const USERS_QUERY = `
  query UserList {
    users {
      edges {
        node {
          name
          isAdmin
          isManager
          attrib {
            fullName
            email
          }
        }
      }
    }
  }
`

const UserList = ({projectName}) => {
  const [userList, setUserList] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    let result = []
    axios
      .post('/graphql', {
        query: USERS_QUERY,
        variables: {},
      })
      .then((response) => {
        const edges = response?.data?.data?.users.edges
        if (!edges)
          return
        for (const edge of edges)
          result.push(edge.node)
      })
      .finally(() => {
        setUserList(result)
        setLoading(false)
      })

  }, [])

  const formatBool = (value) => {
    if (value)
      return "yep"
    return ""
  }

  return (
    <div>
      <DataTable
        value={userList}
        dataKey="name"
        loading={loading}
      >
        <Column field='name' header="Name"/>
        <Column field='attrib.fullName' header="Full name"/>
        <Column field='attrib.email' header="Email"/>
        <Column field='isAdmin' header="Admin" body={rowData => formatBool(rowData.isAdmin)} />
        <Column field='isManager' header="Manager" body={rowData => formatBool(rowData.isManager)}/>
      </DataTable>
    </div>

  )
}

export default UserList
