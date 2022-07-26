import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'

import { MultiSelect} from 'primereact/multiselect'


const RolesDropdown = ({ selectedRoles, setSelectedRoles, style}) => {
  const [loading, setLoading] = useState(false)
  const [rolesList, setRolesList] = useState([])

  useEffect(() => {
    setLoading(true)
    let result = []
    axios
      .get(`/api/roles/_`)
      .then((response) => {
        console.log(response.data)
        for (const role of response.data)
          result.push({
            value: role.name,
            label: role.name
          })
      })
      .catch(() => {
        toast.error('Unable to load roles')
      })
      .finally(() => {
        setRolesList(result)
        setLoading(false)
      })
  }, [])


  const onChange = (e) => {
    if (!setSelectedRoles)
      return
    setSelectedRoles(e.value)
  }


  if (loading)
    return <></>

  return (
    <MultiSelect 
      style={{style}}
      value={selectedRoles || []}
      options={rolesList} 
      onChange={onChange}
    />
  )
}

export default RolesDropdown
