import { createContext, useContext } from 'react'
import type { AddonProjectContextType } from './AddonProjectContext'

export const AddonProjectContext = createContext<AddonProjectContextType | undefined>(undefined)

export const useAddonProjectContext = () => {
  const context = useContext(AddonProjectContext)
  if (!context) {
    throw new Error('useAddonProjectContext must be used within a AddonProjectContext')
  }
  return context
}
