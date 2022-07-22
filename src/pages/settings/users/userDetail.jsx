import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'

const UserDetail = ({selectedUsers, roleAssignData}) => {
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    if (!selectedUsers.length)
      return
    axios.get(`/api/users/${selectedUsers[selectedUsers.length - 1]}`)
      .then(response => {
        setUserData(response.data)
      })
      .catch(() => {
        toast.error("Unable to load user data")
      })
  }, [selectedUsers])

  if (!userData)
    return <h1>loading...</h1>

  return (
    <div>
      <pre style={{overflow: "scroll", maxWidth: 400}}>
      
      {JSON.stringify(userData, null, 2)}
      </pre>

      here will be table to assign roles
    
      <pre style={{overflow: "scroll", maxWidth: 400}}>
      
      {JSON.stringify(roleAssignData, null, 2)}
      </pre>

    </div>
  )
}

export default UserDetail
