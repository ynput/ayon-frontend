import { ReactNode } from 'react'
import { $Any } from '@types'
import { SettingsListItemContext } from '../SettingsGroup/SettingsListItemContextInstance'
import { useGroupFold } from './useGroupFold'

type SettingsFoldingGroupProps = {
  formContext: $Any
  parentId: string
  name: string
  schema: $Any
  formData: $Any
  children: ReactNode
}

/** Makes the group rendered inside fold like a list item (see getFoldingGroupNames) */
export const SettingsFoldingGroup = ({ children, ...args }: SettingsFoldingGroupProps) => {
  const foldState = useGroupFold(args)
  return (
    <SettingsListItemContext.Provider value={foldState}>
      {children}
    </SettingsListItemContext.Provider>
  )
}

export default SettingsFoldingGroup
