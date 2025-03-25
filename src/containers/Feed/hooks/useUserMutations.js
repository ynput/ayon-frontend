import { useEffect, useState } from 'react'

const useUserMutations = () => {
  const initFormData = {
    userLevel: 'user',
    userActive: true,
    UserImage: '',
    isGuest: false,
    accessGroups: {},
    defaultAccessGroups: [],
  }

  const [addedUsers, setAddedUsers] = useState([])
  const [password, setPassword] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [formData, setFormData] = useState(initFormData)

  useEffect(() => {
    // set initial form data
    setFormData(initFormData)
  }, [])


  return {
    password, setPassword,
    passwordConfirm, setPasswordConfirm,
    apiKey, setApiKey,
    initFormData, formData, setFormData,
    addedUsers, setAddedUsers,
  }
}

export default useUserMutations
