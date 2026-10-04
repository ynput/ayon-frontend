import { createContext, useContext } from 'react'
import type { ClipboardContextType } from './clipboard/clipboardTypes'

export const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined)

export const useClipboard = (): ClipboardContextType => {
  const context = useContext(ClipboardContext)
  if (context === undefined) {
    throw new Error('useClipboard must be used within a ClipboardProvider')
  }
  return context
}
