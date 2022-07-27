import axios from 'axios'

import { useState } from 'react'
import { toast } from 'react-toastify'
import { Dialog } from 'primereact/dialog'
import { Spacer, Button } from '/src/components'
import ProjectList from '/src/containers/projectList'
import { UserAttrib, AccessControl } from './forms'

const NewUserDialog = ({ onHide }) => {
  const [selectedProjects, setSelectedProjects] = useState(null)
  const [formData, setFormData] = useState({
    userLevel: 'user',
    userActive: true,
  })

  const userAttrib = {
    fullName: 'Full name',
    email: 'Email',
  }

  const handleSubmit = () => {
    const payload = {}
    if (!formData.name) {
      toast.error('Login name must be provided')
      return
    }

    payload.attrib = {}
    payload.data = {}
    for (const key in userAttrib) {
      if (formData[key]) payload.attrib[key] = formData[key]
    }

    if (formData.userLevel === 'admin') payload.data.isAdmin = true
    else if (formData.userLevel === 'manager') payload.data.isManager = true
    else {
      payload.data.defaultRoles = formData.roles || []
      if (selectedProjects) {
        const roles = {}
        for (const projectName of selectedProjects)
          roles[projectName] = payload.data.defaultRoles
        payload.data.roles = roles
      }
    }

    axios
      .put(`/api/users/${formData.name}`, payload)
      .then(() => {
        toast.success('User created')
        // keep re-usable data in the form
        setFormData((fd) => {
          return { roles: fd.roles, userLevel: fd.userLevel }
        })
      })
      .catch(() => {
        toast.error('User creation failed')
        console.log(payload)
      })
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
      onHide={onHide}
      style={{
        width: '50vw',
        height: '80%',
      }}
    >
      <section
        className="invisible"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        <UserAttrib
          formData={formData}
          setFormData={setFormData}
          attributes={{ name: 'Login', ...userAttrib }}
        />
        <AccessControl
          formData={formData}
          setFormData={setFormData}
          rolesLabel="Default roles"
        />

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
      </section>
    </Dialog>
  )
}

export default NewUserDialog
