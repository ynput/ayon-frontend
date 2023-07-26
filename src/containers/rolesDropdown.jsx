import { useGetRolesQuery } from '/src/services/getRoles'
import { Dropdown } from '@ynput/ayon-react-components'

const RolesDropdown = ({ selectedRoles, setSelectedRoles, style, disabled, placeholder }) => {
  const { data: rolesList = [], isLoading: rolesLoading } = useGetRolesQuery()

  const onChange = (e) => {
    if (!setSelectedRoles) return
    setSelectedRoles(e)
  }

  return (
    <Dropdown
      style={{ style }}
      value={selectedRoles || []}
      options={rolesList.map((r) => ({ value: r }))}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      widthExpand
      disable={rolesLoading}
      multiSelect
      onClear={() => setSelectedRoles([])}
    />
  )
}

export default RolesDropdown
