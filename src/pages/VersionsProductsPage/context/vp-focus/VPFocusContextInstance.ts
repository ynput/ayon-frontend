import { createContext, useContext } from 'react'
import type { VPFocusContextValue } from './VPFocusContext'

export const VPFocusContext = createContext<VPFocusContextValue | null>(null)

export const useVPFocusContext = () => {
  const context = useContext(VPFocusContext)
  if (!context) {
    throw new Error('useVPFocusContext must be used within VPFocusProvider')
  }
  return context
}
