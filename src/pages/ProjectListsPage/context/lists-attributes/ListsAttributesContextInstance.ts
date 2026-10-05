import { createContext, useContext } from 'react'
import type { ListsAttributesContextValue } from './ListsAttributesContext'

export const ListsAttributesContext = createContext<ListsAttributesContextValue | undefined>(
  undefined,
)

export const useListsAttributesContext = () => {
  const context = useContext(ListsAttributesContext)
  if (context === undefined) {
    throw new Error('useListsAttributesContext must be used within a ListsAttributesProvider')
  }
  return context
}
