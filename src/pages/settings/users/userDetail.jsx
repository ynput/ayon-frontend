import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import { Button, Spacer } from '/src/components'
import { SelectButton } from 'primereact/selectbutton'
import RolesDropdown from '/src/containers/rolesDropdown'
import axios from 'axios'


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


const AccessControl = ({ 
  selectedRoles, 
  setSelectedRoles, 
  userLevel, 
  setUserLevel, 
  userActive,
  setUserActive,
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

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>

      <FormRow label="User active">
        <SelectButton 
          unselectable={false}
          value={userActive}
          onChange={(e) => setUserActive(e.value)}
          options={activeOptions}
        />
      </FormRow>

      <FormRow label="User level">
        <SelectButton 
          unselectable={false}
          value={userLevel}
          onChange={(e) => setUserLevel(e.value)}
          options={userLevels}
        />
      </FormRow>

      
      
      {userLevel === 'user' && (
        <FormRow label={rolesLabel}> 
          <RolesDropdown 
            style={{flexGrow:1}}
            selectedRoles={selectedRoles} 
            setSelectedRoles={setSelectedRoles} 
          />
        </FormRow>
      )
      }
    </div>
  )
}


const UserDetail = ({selectedUsers, roleAssignData}) => {
  const [userData, setUserData] = useState(null)
  const [selectedRoles, setSelectedRoles] = useState([])
  const [userLevel, setUserLevel] = useState('user')
  const [userActive, setUserActive] = useState(true)

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


  useEffect(()=>{
    let nroles = []
    if (!roleAssignData)
      return 
    if (roleAssignData.roles.length){
      for (const nrole of roleAssignData.roles){
        if (nrole.shouldSelect)
          nroles.push(nrole.name)
      }
    }
    setUserActive(roleAssignData.active)
    setUserLevel(roleAssignData.userLevel)
    setSelectedRoles(nroles)
  }, [roleAssignData])


  const onSave = () => {

  }

  const onDelete = () => {

  }

  if (!userData)
    return <h1>loading...</h1>

  return (
    <section className="invisible" style={{ flexBasis: 500, padding: 0, height: "100%" }}>
      <section className="invisible row">
        <Button onClick={onSave} label="Save selected users" />
        <Button onClick={onDelete} label="Delete selected users"/>
        <Spacer />
      </section> 
      <section className="lighter" style={{flexGrow: 1}}>
        <AccessControl 
          selectedRoles={selectedRoles} 
          setSelectedRoles={setSelectedRoles} 
          userLevel={userLevel}
          setUserLevel={setUserLevel}
          userActive={userActive}
          setUserActive={setUserActive}
        />
      </section>
    </section>


  )
}

export default UserDetail
