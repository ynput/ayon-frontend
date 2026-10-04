import { createContext, useContext } from 'react'
import type { PowerpackContextType } from './PowerpackContext'

// Re-export from separate feature files for backwards compatibility
export { powerpackFeatureOrder, powerpackFeatures } from '../config'
export { addonConfigs } from '../config'

export const PowerpackContext = createContext<PowerpackContextType | undefined>(undefined)

export const usePowerpack = () => {
  const context = useContext(PowerpackContext)
  if (context === undefined) {
    throw new Error('usePowerpack must be used within a PowerpackProvider')
  }
  return context
}
