import { createContext, useContext } from 'react'
import type { AddonContextType } from './AddonContext'

export const AddonContext = createContext<AddonContextType | undefined>(undefined)

export const useAddonContext = () => {
  const context = useContext(AddonContext)
  if (!context) {
    throw new Error('useAddonContext must be used within a AddonContext')
  }
  return context
}
