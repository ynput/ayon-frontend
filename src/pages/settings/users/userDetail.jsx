import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Button, Spacer, InputText } from '/src/components'
import { SelectButton } from 'primereact/selectbutton'
import RolesDropdown from '/src/containers/rolesDropdown'
import axios from 'axios'
import {isEmpty} from '/src/utils'


const FormRow = (props) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "row",
      flexGrow: 1,
      alignItems: "center"
    }}
    >
      <div style={{flexBasis: 120}}>
        {props.label}
      </div>
      <div style={{flexGrow: 1, display: "flex", flexDirection: "column"}}>
        {props.children}
      </div>
    </div>
  )
}


const UserAttrib = ({ 
  formData,
  setFormData,
  attributes,
}) => {

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
    {
      Object.keys(attributes).map((attrName) => (
        <FormRow label={attributes[attrName]} key={attrName}>
          <InputText value={formData[attrName]} onChange={
            e => {
              const value = e.target.value
              setFormData(fd=>{
                return {...fd, [attrName]: value}
              })
            }
          }/>
        </FormRow>
      ))
    }

    </div>
  )
}


const AccessControl = ({ 
  formData,
  setFormData,
  rolesLabel="Roles"
})=> {

  const userLevels = [
    {label: 'User', value: 'user'},
    {label: 'Manager', value: 'manager'},
    {label: 'Administrator', value: 'admin'},
  ]

  const activeOptions = [
    {label: 'Active', value: true },
    {label: 'Disabled', value: false },
  ]

  const updateFormData = (key, value) => {
    setFormData((fd) => {
      return {...fd, [key]: value}
    })
  }

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>

      <FormRow label="User active">
        <SelectButton 
          unselectable={false}
          value={formData.userActive}
          onChange={(e) => updateFormData('userActive', e.value)}
          options={activeOptions}
        />
      </FormRow>

      <FormRow label="User level">
        <SelectButton 
          unselectable={false}
          value={formData.userLevel}
          onChange={(e) => updateFormData('userLevel', e.value)}
          options={userLevels}
        />
      </FormRow>

      
      
      {formData.userLevel === 'user' && (
        <FormRow label={rolesLabel}> 
          <RolesDropdown 
            style={{flexGrow:1}}
            selectedRoles={formData.roles} 
            setSelectedRoles={value => updateFormData('roles', value)} 
          />
        </FormRow>
      )
      }
    </div>
  )
}


const UserDetail = ({userDetailData, onTriggerReload}) => {
  const [formData, setFormData] = useState({})

  const userAttrib = {
    fullName: "Full name",
    email: "EMail"
  }

  useEffect(()=>{
    let nroles = []
    if (isEmpty(userDetailData))
      return 
    if (userDetailData.roles?.length){
      for (const nrole of userDetailData.roles){
        if (nrole.shouldSelect)
          nroles.push(nrole.name)
      }
    }
    const formData = {
      userActive: userDetailData.userActive,
      userLevel: userDetailData.userLevel,
      roles: nroles,
    }
    if (userDetailData.users.length === 1){
      for (const attrName in userAttrib)
        formData[attrName] = userDetailData.users[0].attrib[attrName]
    }
    setFormData(formData)
  }, [userDetailData])

  // editing a single user, so show attributes form too
  const singleUserEdit = userDetailData.users?.length === 1 ? userDetailData.users[0] : null

  // no selected user. do not show the panel
  if (!userDetailData.users?.length){
    return <></>
  }

  //
  // API
  //

  const onSave = async () => {
    for (const user of userDetailData.users) {
      const data = {}
      const attrib = {}

      if (singleUserEdit){
        for (const attrName in userAttrib)
          attrib[attrName] = formData[attrName]
      }

      const roles = JSON.parse(user.roles || {})

      if (!userDetailData.projectNames){
        // no project is selected. update default roles
        console.log("Updating default roles to", formData.roles)
        data.default_roles = formData.roles

      } else {
        // project(s) selected. update roles
        for (const projectName of userDetailData.projectNames)
          roles[projectName] = formData.roles

      }

      // update user level && do role clean-up
      if (user.isAdmin !== (formData.userLevel === "admin"))
        data.is_admin = formData.userLevel === "admin"
      if (user.isManager !== (formData.userLevel === "manager"))
        data.is_manager = formData.userLevel === "manager"

      if (!(data.is_admin || data.is_manager)){
        if (!isEmpty(roles))
          data.roles = roles
      } else {
        data.roles = null
      }

      // Apply the patch

      try {
        await axios.patch(`/api/users/${user.name}`, {
            active: formData.userActive,
            attrib,
            data
        })

      } catch {
        toast.error(`Unable to update user ${user.name} `)
      }

    } // for user
    onTriggerReload()

  }

  const onDelete = async () => {
    for (const user of userDetailData.users){
      try{
        await axios.delete(`/api/users/${user.name}`)
      } catch {
        toast.error(`Unable to delete user ${user.name}`)
      }
    }
    onTriggerReload()
  }

  //
  // Render
  //

  return (
    <section className="invisible" style={{ flexBasis: 500, padding: 0, height: "100%" }}>
      <section className="invisible row">
        <Button onClick={onSave} label="Save selected users" />
        <Button onClick={onDelete} label="Delete selected users"/>
        <Spacer />
      </section> 
      <section className="lighter" style={{flexGrow: 1}}>
        {
          singleUserEdit && (
          <>
            <h2>{singleUserEdit.attrib.fullName || singleUserEdit.name}</h2>
            <UserAttrib formData={formData} setFormData={setFormData} attributes={userAttrib} />
          </>
          )
        }

        <AccessControl 
          formData={formData}
          setFormData={setFormData}
          rolesLabel={userDetailData.projectNames?.length ? "Project roles" : "Default roles"}
        />
      </section>
    </section>


  )
}

export default UserDetail
