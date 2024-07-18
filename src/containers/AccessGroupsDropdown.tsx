import { Dropdown } from '@ynput/ayon-react-components'
import { useMemo, CSSProperties } from 'react'

interface AccessGroup {
  name: string
}

interface AccessGroupsDropdownProps {
  selectedAccessGroups: string[]
  setSelectedAccessGroups: (selected: string[]) => void
  style?: CSSProperties
  disabled?: boolean
  placeholder?: string
  accessGroups?: AccessGroup[]
}

const AccessGroupsDropdown: React.FC<AccessGroupsDropdownProps> = ({
  selectedAccessGroups,
  setSelectedAccessGroups,
  style,
  disabled,
  placeholder,
  accessGroups = [],
  ...props
}) => {
  const onChange = (v: (string | number)[]) => {
    setSelectedAccessGroups?.(v.map((item) => String(item)))
  }

  const options = useMemo(() => accessGroups.map((g) => ({ value: g?.name })), [accessGroups])
  const sortedAG = useMemo(
    () => [...selectedAccessGroups]?.sort((a, b) => b.localeCompare(a)),
    [selectedAccessGroups],
  )

  return (
    <Dropdown
      style={style}
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
