import { useState } from 'react'
import { toast } from 'react-toastify'
import { Dialog } from 'primereact/dialog'
import { Spacer, Button } from '@ynput/ayon-react-components'
import ProjectList from '/src/containers/projectList'
import { UserAttrib, AccessControl } from './forms'
import { useAddUserMutation } from '/src/services/user/updateUser'

const NewUserDialog = ({ onHide }) => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [addedUsers, setAddedUsers] = useState([])
  const [password, setPassword] = useState('')
  const [formData, setFormData] = useState({
    userLevel: 'user',
    userActive: true,
  })

  const [addUser] = useAddUserMutation()

  const userAttrib = {
    fullName: 'Full name',
    email: 'Email',
  }

  const handleSubmit = async () => {
    const payload = {}
    if (!formData.name) {
      toast.error('Login name must be provided')
      return
    }

    if (password) payload.password = password

    payload.attrib = {}
    payload.data = {}
    if (formData.isGuest) payload.data.isGuest = true
    for (const key in userAttrib) {
      if (formData[key]) payload.attrib[key] = formData[key]
    }

    if (formData.userLevel === 'admin') payload.data.isAdmin = true
    else if (formData.userLevel === 'manager') payload.data.isManager = true
    else if (formData.userLevel === 'service') payload.data.isService = true
    else {
      payload.data.defaultRoles = formData.roles || []
      if (selectedProjects) {
        const roles = {}
        for (const projectName of selectedProjects) roles[projectName] = payload.data.defaultRoles
        payload.data.roles = roles
      }
    }

    try {
      await addUser({ name: formData.name, user: payload }).unwrap()

      toast.success('User created')
      // set added users to be used for auto selection onHide
      setAddedUsers([...addedUsers, formData.name])
      // keep re-usable data in the form
      setPassword('')
      setFormData((fd) => {
        return { roles: fd.roles, userLevel: fd.userLevel }
      })
    } catch (error) {
      console.error(error)
      toast.error(`Unable to create user: ${error.detail}`)
    }
  }

  const footer = (
    <div style={{ display: 'flex' }}>
      <Spacer />
      <Button
        label="Create"
        className="p-button-info"
        onClick={handleSubmit}
        style={{ width: 120 }}
      />
    </div>
  )

  return (
    <Dialog
      header="New user"
      footer={footer}
      visible={true}
      onHide={() => onHide(addedUsers)}
      style={{
        width: '50vw',
        height: '80%',
      }}
    >
      <div style={{ width: '100%', height: '100%' }}>
        <UserAttrib
          formData={formData}
          setFormData={setFormData}
          attributes={{ name: 'Username', ...userAttrib }}
          password={password}
          setPassword={setPassword}
          showPassword={true}
        />
        <h2>Access control</h2>
        <AccessControl formData={formData} setFormData={setFormData} rolesLabel="Default roles" />

        {formData.userLevel === 'user' && (
          <>
            <div style={{ marginTop: 10 }}>Apply default roles to:</div>
            <ProjectList
              selection={selectedProjects}
              onSelect={setSelectedProjects}
              multiselect={true}
            />
          </>
        )}
      </div>
    </Dialog>
  )
}

export default NewUserDialog
