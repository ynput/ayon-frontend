import {useState, useEffect } from 'react'
import LoadingPage from '/src/pages/loading'
import axios from 'axios'

const ProfilePage = () => {
  const [userData, setUserData] = useState(null)

  useEffect(()=>{
    axios
      .get("/api/users/me")
      .then((result) => {
        setUserData(result.data)
      })

  }, [])

  if (!userData)
    return <LoadingPage />

  const displayName = userData.attrib.fullName || userData.name

  return (
    <main>
      <div>
      <h1>{displayName}</h1>

      <h2>Basic information</h2>


      <h2>Change password</h2>
      </div>

    </main>
  )
}

export default ProfilePage
