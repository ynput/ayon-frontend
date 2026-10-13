import { createContext, useContext } from 'react'
import type { ContextMenuContextType } from './ContextMenuContext'

export const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined)

export function useContextMenu(): ContextMenuContextType {
  const context = useContext(ContextMenuContext)
  if (context === undefined) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider')
  }
  return context
}
