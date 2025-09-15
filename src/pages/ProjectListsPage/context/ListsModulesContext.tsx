import { useLoadModule } from '@shared/hooks'
import React, { createContext, useContext, ReactNode, FC } from 'react'
import { ListsAttributesContextValue } from './ListsAttributesContext'
import { ConfirmDeleteOptions } from '@shared/util'
import { TableSettingsFallback } from '@shared/components'
import { ListAccessFallback } from '../components/ListAccessForm'

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
    feature={'listAttributes'}
    requiredVersion={requiredVersion}
    button={{
      label: 'Add attribute',
    }}
  />
)

interface ListsModuleContextType {
  ListsAttributesSettings: typeof ListsAttributeSettingsFallback
  ListAccess: typeof ListAccessFallback
  requiredVersion: {
    settings: string | undefined
    access: string | undefined
  }
  isLoading: {
    access: boolean
  }
}

const ListsModuleContext = createContext<ListsModuleContextType | undefined>(undefined)

interface ListsModuleProviderProps {
  children: ReactNode
}

export const ListsModuleProvider: React.FC<ListsModuleProviderProps> = ({ children }) => {
  const [ListsAttributesSettings, { outdated: attributeSettingsOutdated }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListsAttributesSettings',
    fallback: ListsAttributeSettingsFallback,
    minVersion: '1.0.5',
  })

  const [ListAccess, { outdated: accessOutdated, isLoading: isLoadingAccess }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListAccess',
    fallback: ListAccessFallback,
    minVersion: '1.2.4',
  })

  const value = {
    ListsAttributesSettings,
    ListAccess,
    requiredVersion: {
      settings: attributeSettingsOutdated?.required,
      access: accessOutdated?.required,
    },
    isLoading: {
      access: isLoadingAccess,
    },
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
