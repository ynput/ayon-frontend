import { Dropdown } from '@ynput/ayon-react-components'
import { useMemo } from 'react'

const AccessGroupsDropdown = ({
  selectedAccessGroups,
  setSelectedAccessGroups,
  style,
  disabled,
  placeholder,
  accessGroups = [],
  ...props
}) => {
  const onChange = (e) => {
    if (!setSelectedAccessGroups) return
    setSelectedAccessGroups(e)
  }

  const options = useMemo(() => accessGroups.map((g) => ({ value: g?.name })), [accessGroups])

  return (
    <Dropdown
      style={{ style }}
      value={selectedAccessGroups || []}
      options={options}
      onChange={onChange}
      disabled={disabled}
      placeholder={placeholder}
      widthExpand
      multiSelect
      onClear={() => setSelectedAccessGroups([])}
      {...props}
    />
  )
}

export default AccessGroupsDropdown
