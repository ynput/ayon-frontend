import { createContext, useContext } from 'react'
import type { ListsDataContextValue } from './ListsDataContext'

export const ListsDataContext = createContext<ListsDataContextValue | undefined>(undefined)

export const useListsDataContext = () => {
  const context = useContext(ListsDataContext)
  if (context === undefined) {
    throw new Error('useListsDataContext must be used within a ListsDataProvider')
  }
  return context
}
