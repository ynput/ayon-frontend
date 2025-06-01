import { useLoadModule } from '@shared/hooks'
import React, { createContext, useContext, ReactNode, FC } from 'react'
import { ListsAttributesContextValue } from './ListsAttributesContext'
import { ConfirmDeleteOptions } from '@shared/util'
import { TableSettingsFallback } from '@shared/components'

interface ListsAttributeSettingsFallbackProps {
  listAttributes: ListsAttributesContextValue['listAttributes']
  entityAttribFields: ListsAttributesContextValue['entityAttribFields']
  isLoadingNewList: ListsAttributesContextValue['isLoadingNewList']
  isUpdating: ListsAttributesContextValue['isUpdating']
  requiredVersion: string | undefined
  updateAttributes: ListsAttributesContextValue['updateAttributes']
  onGoTo: (name: string) => void
  onSuccess?: (message: string) => void
  onError?: (error: string) => void
  confirmDelete?: (options: ConfirmDeleteOptions) => void
}

const ListsAttributeSettingsFallback: FC<ListsAttributeSettingsFallbackProps> = ({
  requiredVersion,
}) => (
  <TableSettingsFallback
    label="Add attribute"
    feature={'listAttributes'}
    requiredVersion={requiredVersion}
  />
)

interface ListsModuleContextType {
  ListsAttributesSettings: typeof ListsAttributeSettingsFallback
  requiredVersion?: string
}

const ListsModuleContext = createContext<ListsModuleContextType | undefined>(undefined)

interface ListsModuleProviderProps {
  children: ReactNode
}

export const ListsModuleProvider: React.FC<ListsModuleProviderProps> = ({ children }) => {
  const [ListsAttributesSettings, { outdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListsAttributesSettings',
    fallback: ListsAttributeSettingsFallback,
    minVersion: '1.0.5',
  })

  const value = {
    ListsAttributesSettings,
    requiredVersion: outdated?.required,
  }

  return <ListsModuleContext.Provider value={value}>{children}</ListsModuleContext.Provider>
}

export const useListsModuleContext = (): ListsModuleContextType => {
  const context = useContext(ListsModuleContext)
  if (context === undefined) {
    throw new Error('useListsModuleContext must be used within a ListsModuleProvider')
  }
  return context
}
