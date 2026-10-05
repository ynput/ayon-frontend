import { createContext, useContext } from 'react'
import type { EntityListsContextType } from './EntityListsContext'

export const EntityListsContext = createContext<EntityListsContextType | undefined>(undefined)

export const useEntityListsContext = () => {
  const context = useContext(EntityListsContext)
  if (context === undefined) {
    throw new Error('useEntityListsContext must be used within an EntityListsProvider')
  }
  return context
}

export const useOptionalEntityListsContext = () => useContext(EntityListsContext)
