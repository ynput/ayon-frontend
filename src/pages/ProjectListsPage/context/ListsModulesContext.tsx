import { useLoadModule } from '@shared/hooks'
import React, { createContext, useContext, ReactNode } from 'react'
import ListsAttributeSettingsFallback from '../components/ListsTableSettings/ListsAttributeSettingsFallback'

interface ListsModuleContextType {
  ListsAttributesSettings: typeof ListsAttributeSettingsFallback
}

const ListsModuleContext = createContext<ListsModuleContextType | undefined>(undefined)

interface ListsModuleProviderProps {
  children: ReactNode
}

export const ListsModuleProvider: React.FC<ListsModuleProviderProps> = ({ children }) => {
  const [ListsAttributesSettings] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'ListsAttributesSettings',
    fallback: ListsAttributeSettingsFallback,
  })

  const value = {
    ListsAttributesSettings,
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
