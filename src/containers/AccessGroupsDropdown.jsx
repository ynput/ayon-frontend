import { useGetAccessGroupsQuery } from '../services/accessGroups/getAccessGroups'
import { Dropdown } from '@ynput/ayon-react-components'

const AccessGroupsDropdown = ({
  selectedAccessGroups,
  setSelectedAccessGroups,
  style,
  disabled,
  placeholder,
  ...props
}) => {
  const { data, isLoading } = useGetAccessGroupsQuery()

  const onChange = (e) => {
    if (!setSelectedAccessGroups) return
    setSelectedAccessGroups(e)
  }

  return (
    <Dropdown
      style={{ style }}
      value={selectedAccessGroups || []}
      options={(data || []).map((i) => ({ value: i.name }))}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      widthExpand
      disable={isLoading}
      multiSelect
      onClear={() => setSelectedAccessGroups([])}
      {...props}
    />
  )
}

export default AccessGroupsDropdown
