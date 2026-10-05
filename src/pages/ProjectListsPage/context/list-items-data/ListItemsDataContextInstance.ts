import { createContext, useContext } from 'react'
import type { ListItemsDataContextValue } from './ListItemsDataContext'

export const ListItemsDataContext = createContext<ListItemsDataContextValue | undefined>(undefined)

export const useListItemsDataContext = () => {
  const context = useContext(ListItemsDataContext)
  if (context === undefined) {
    throw new Error('useListItemsDataContext must be used within a ListItemsDataProvider')
  }
  return context
}
