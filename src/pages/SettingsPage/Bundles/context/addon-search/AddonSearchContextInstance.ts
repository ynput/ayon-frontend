import { createContext, useContext } from 'react'
import type { AddonSearchContextType } from './AddonSearchContext'

export const AddonSearchContext = createContext<AddonSearchContextType | undefined>(undefined)

export const useAddonSearchContext = () => {
  const context = useContext(AddonSearchContext)
  if (context === undefined) {
    throw new Error('useAddonSearchContext must be used within an AddonSearchProvider')
  }
  return context
}
