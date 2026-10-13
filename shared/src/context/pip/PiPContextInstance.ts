import { createContext, useContext } from 'react'
import type { PiPContextType } from './PiPProvider'

export const PiPContext = createContext<PiPContextType | undefined>(undefined)

export function usePiPWindow(): PiPContextType {
  const context = useContext(PiPContext)

  if (context === undefined) {
    throw new Error('usePiPWindow must be used within a PiPContext')
  }

  return context
}
