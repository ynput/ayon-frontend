import { createContext, useContext } from 'react'
import type { SimpleTableContextValue } from './SimpleTableContext'

export const SimpleTableContext = createContext<SimpleTableContextValue | undefined>(undefined)

export const useSimpleTableContext = () => {
  const context = useContext(SimpleTableContext)
  if (context === undefined) {
    throw new Error('useSimpleTableContext must be used within a SimpleTableProvider')
  }
  return context
}
