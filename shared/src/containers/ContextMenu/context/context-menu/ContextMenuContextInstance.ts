import { createContext, useContext } from 'react'
import type { ContextMenuContextType } from './ContextMenuContext'

// set on the right-clicked element while its context menu is open, so it can be styled like :hover
export const CONTEXT_MENU_TARGET_ATTR = 'data-context-menu-target'

export const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined)

export function useContextMenu(): ContextMenuContextType {
  const context = useContext(ContextMenuContext)
  if (context === undefined) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider')
  }
  return context
}
