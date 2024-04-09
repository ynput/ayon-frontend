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
  const sortedAG = [...selectedAccessGroups]?.sort((a, b) => b.localeCompare(a))

  return (
    <Dropdown
      style={{ style }}
      value={sortedAG || []}
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
