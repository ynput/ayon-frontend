import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'

const UserDetail = ({userName}) => {
  const [userData, setUserData] = useState(null)

  useEffect(() => {
    if (!userName)
      return
    axios.get(`/api/users/${userName}`)
      .then(response => {
        setUserData(response.data)
      })
      .catch(() => {
        toast.error("Unable to load user data")
      })
  }, [userName])

  if (!userData)
    return <h1>loading...</h1>

  return (
    <div>
      <pre style={{overflow: "scroll", maxWidth: 400}}>
      
      {JSON.stringify(userData, null, 2)}
      </pre>

    </div>
  )
}

export default UserDetail
