import { useLoadModule } from '@shared/hooks'
import React, { createContext, useContext, ReactNode } from 'react'
import ListsAttributeSettingsFallback from '../components/ListsTableSettings/ListsAttributeSettingsFallback'
import PowerpackButton from '@components/Powerpack/PowerpackButton'

interface ListsModuleContextType {
  isLoaded: boolean
  ListsAttributesSettings: typeof ListsAttributeSettingsFallback
  createAttributeColumns: (
    a: any[],
    _w: any,
  ) => {
    columns: any[]
    settings: any[]
  }
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

  const fallbackColumns = (a: any[], _w: any) => ({
    columns: a.map((a) => ({
      column: {
        id: a.name,
        header: a.name,
        cell: () => <PowerpackButton label="Custom attribute" feature="listAttributes" />,
      },
    })),
    settings: [],
  })

  const [createAttributeColumns, { isLoaded: isLoadedColumns }] = useLoadModule({
    addon: 'powerpack',
    remote: 'slicer',
    module: 'createAttributeColumns',
    fallback: fallbackColumns,
  })

  const value = {
    isLoaded: isLoadedColumns,
    ListsAttributesSettings,
    createAttributeColumns,
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
