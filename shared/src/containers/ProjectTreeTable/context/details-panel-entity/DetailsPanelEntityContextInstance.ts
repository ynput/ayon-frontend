import { createContext, useContext } from 'react'
import type { DetailsPanelEntityContextType } from './DetailsPanelEntityContext'

export const DetailsPanelEntityContext = createContext<DetailsPanelEntityContextType | undefined>(
  undefined,
)

export const useDetailsPanelEntityContext = () => {
  const context = useContext(DetailsPanelEntityContext)
  if (!context) {
    throw new Error('useDetailsPanelEntityContext must be used within a DetailsPanelEntityProvider')
  }
  return context
}
