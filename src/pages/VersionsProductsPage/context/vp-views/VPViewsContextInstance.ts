import { createContext, useContext } from 'react'
import type { VPViewsContextValue } from './VPViewsContext'

export const VPViewsContext = createContext<VPViewsContextValue | null>(null)

export const useVPViewsContext = () => {
  const context = useContext(VPViewsContext)
  if (!context) {
    throw new Error('useVPViewsContext must be used within VersionsDataProvider')
  }
  return context
}
