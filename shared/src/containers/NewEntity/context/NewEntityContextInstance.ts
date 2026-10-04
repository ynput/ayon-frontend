import { createContext, useContext } from 'react'
import type { NewEntityContextType } from './NewEntityContext'

export const NewEntityContext = createContext<NewEntityContextType | undefined>(undefined)

export const useNewEntityContext = () => {
  const context = useContext(NewEntityContext)
  if (!context) {
    throw new Error('useNewEntityContext must be used within a NewEntityProvider')
  }
  return context
}
