import {useState, useEffect } from 'react'
import axios from 'axios'
import { toast } from 'react-toastify'
import { Button, Spacer } from '/src/components'

const RoleDetail = ({projectName, roleName, onChange}) => {
  const [roleData, setRoleData] = useState(null)

  useEffect(()=>{
    if (!roleName){
      setRoleData(null)
      return
    }
    axios
    .get(`/api/roles/${roleName}/${projectName || '_'}`)
    .then(response => {
      setRoleData(response.data)
    })

  }, [projectName, roleName])


  const onSave = () => {
    axios
      .put(`/api/roles/${roleName}/${projectName || '_'}`, roleData)
      .then(() => {
        toast.success("Role saved")
        onChange()
      })
  }

  const onDelete = () => {
    axios
      .delete(`/api/roles/${roleName}/${projectName || '_'}`, roleData)
      .then(() => {
        toast.success("Role deleted")
        onChange()
      })
  }



  return (
    <section className="invisible" style={{ flexGrow: 1, padding: 0, height: "100%" }}>
      <section className="invisible row">
        <Button onClick={onSave} label="Save project role" />
        <Button onClick={onDelete} label="Delete project role" disabled={!projectName}/>
        <Spacer />
      </section> 
      <section className="lighter" style={{flexGrow: 1}}>
        <pre>
          {JSON.stringify(roleData, null, 2)}
        </pre>
      </section>
    </section>
  )
}

export default RoleDetail
