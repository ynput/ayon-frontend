import { AccessLevel } from '@shared/components'
import { Dropdown } from '@ynput/ayon-react-components'
import { FC } from 'react'
import AccessOptionItem from './AccessOptionItem'

export type AccessOption = {
  label: string
  value: number
  tooltip?: string
}

// Reusable AccessLevelDropdown component
export interface AccessLevelDropdownProps {
  accessLevel: AccessLevel
  accessOptions: Array<{ value: string; label: string; tooltip?: string }>
  onChange: (newLevel: AccessLevel) => void
}

export const AccessLevelDropdown: FC<AccessLevelDropdownProps> = ({
  accessLevel,
  accessOptions,
  onChange,
}) => {
  return (
    <Dropdown
      options={accessOptions}
      value={[String(accessLevel)]}
      onChange={(values) => {
        const newLevel = parseInt(values[0]) as AccessLevel
        onChange(newLevel)
      }}
      style={{ width: 136 }}
      itemTemplate={(o) => <AccessOptionItem option={o} selected={String(accessLevel)} />}
      itemStyle={{ zIndex: 2000 }}
    />
  )
}
