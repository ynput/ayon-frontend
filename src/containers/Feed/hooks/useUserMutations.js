import { useEffect, useState } from 'react'

const useUserMutations = ({}) => {
  const initFormData = {
    userLevel: 'user',
    userActive: true,
    UserImage: '',
    isGuest: false,
    accessGroups: {},
    defaultAccessGroups: [],
  }

  const initialFormDataCallback = () => initFormData

  const [addedUsers, setAddedUsers] = useState([])
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [formData, setFormData] = useState(initialFormDataCallback)

  useEffect(() => {
    // set initial form data
    setFormData(initialFormDataCallback())
  }, [])

  const resetFormData = ({ password, passwordConfirm, formData, addedUsers }) => {
    // keep reusable data in the form
    setPassword(password)
    setPasswordConfirm(passwordConfirm)
    setFormData(formData != undefined ? formData : initialFormDataCallback)
    setAddedUsers(addedUsers)
  }

  return {
    password, setPassword,
    passwordConfirm, setPasswordConfirm,
    formData, setFormData,
    addedUsers,
    resetFormData,
  }
}

export default useUserMutations
