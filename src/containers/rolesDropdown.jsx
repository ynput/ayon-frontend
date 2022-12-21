import { useState, useEffect } from 'react'
import { toast } from 'react-toastify'
import axios from 'axios'

import { MultiSelect } from 'primereact/multiselect'

const RolesDropdown = ({ selectedRoles, setSelectedRoles, style }) => {
  const [rolesList, setRolesList] = useState([])

  useEffect(() => {
    let result = []
    axios
      .get(`/api/roles/_`)
      .then((response) => {
        for (const role of response.data)
          result.push({
            value: role.name,
            label: role.name,
          })
      })
      .catch(() => {
        toast.error('Unable to load roles')
      })
      .finally(() => {
        setRolesList(result)
      })
  }, [])

  const onChange = (e) => {
    if (!setSelectedRoles) return
    setSelectedRoles(e.value)
  }

  return (
    <MultiSelect
      style={{ style }}
      value={selectedRoles || []}
      options={rolesList}
      onChange={onChange}
    />
  )
}

export default RolesDropdown
