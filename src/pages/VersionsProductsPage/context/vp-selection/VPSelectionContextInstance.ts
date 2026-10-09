import { createContext, useContext } from 'react'
import type { VersionsSelectionContextValue } from './VPSelectionContext'

export const VersionsSelectionContext = createContext<VersionsSelectionContextValue | null>(null)

export const useVersionsSelectionContext = () => {
  const context = useContext(VersionsSelectionContext)
  if (!context) {
    throw new Error('useVersionsSelectionContext must be used within VersionsSelectionProvider')
  }
  return context
}
