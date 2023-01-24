import { useState } from 'react'
import { toast } from 'react-toastify'
import { Dialog } from 'primereact/dialog'
import { Spacer, Button } from '@ynput/ayon-react-components'
import ProjectList from '/src/containers/projectList'
import { useAddUserMutation } from '/src/services/user/updateUser'
import ayonClient from '/src/ayon'
import UserAttribForm, { DividerSmallStyled } from './UserAttribForm'
import UserAccessForm from './UserAccessForm'

const NewUserDialog = ({ onHide }) => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [addedUsers, setAddedUsers] = useState([])
  const [password, setPassword] = useState('')
  const [formData, setFormData] = useState({
    userLevel: 'user',
    userActive: true,
  })

  const [addUser] = useAddUserMutation()

  const attributes = ayonClient.getAttribsByScope('user')

  const handleSubmit = async () => {
    const payload = {}
    if (!formData.Username) {
      toast.error('Login name must be provided')
      return
    }

    if (password) payload.password = password

    payload.attrib = {}
    payload.data = {}
    if (formData.isGuest) payload.data.isGuest = true
    attributes.forEach(({ name }) => {
      if (formData[name]) payload.attrib[name] = formData[name]
    })

    if (formData.userLevel === 'admin') payload.data.isAdmin = true
    else if (formData.userLevel === 'manager') payload.data.isManager = true
    else if (formData.userLevel === 'service') payload.data.isService = true
    else {
      payload.data.defaultRoles = formData.defaultRoles || []
      if (selectedProjects) {
        const roles = {}
        for (const projectName of selectedProjects) roles[projectName] = payload.data.defaultRoles
        payload.data.roles = roles
      }
    }

    payload.name = formData.Username

    try {
      await addUser({ name: formData.Username, user: payload }).unwrap()

      toast.success('User created')
      // set added users to be used for auto selection onHide
      setAddedUsers([...addedUsers, formData.Username])
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
        <UserAttribForm
          formData={formData}
          setFormData={setFormData}
          attributes={[
            { name: 'Username', data: { title: 'Username' } },
            { name: 'password', data: { title: 'Password' } },
            ...attributes,
          ]}
          password={password}
          setPassword={setPassword}
        />
        <DividerSmallStyled />
        <UserAccessForm formData={formData} setFormData={setFormData} hideProjectRoles />
        {formData.userLevel === 'user' && (
          <>
            <DividerSmallStyled />
            <span style={{ margin: '10px 0' }}>
              <b>Apply default roles to:</b>
            </span>
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
