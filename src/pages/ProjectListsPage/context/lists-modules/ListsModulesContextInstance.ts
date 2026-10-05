import { createContext, useContext } from 'react'
import type { ListsModuleContextType } from './ListsModulesContext'

export const ListsModuleContext = createContext<ListsModuleContextType | undefined>(undefined)

export const useListsModuleContext = (): ListsModuleContextType => {
  const context = useContext(ListsModuleContext)
  if (context === undefined) {
    throw new Error('useListsModuleContext must be used within a ListsModuleProvider')
  }
  return context
}
