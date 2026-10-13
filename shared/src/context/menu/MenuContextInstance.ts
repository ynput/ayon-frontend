import { createContext, useContext } from 'react'
import type { NavigateFunction } from 'react-router'

export interface MenuContextType {
  menuOpen: string | false
  setMenuOpen: (menuId: string | false) => void
  toggleMenuOpen: (menuId: string | false) => void
  navigate: NavigateFunction
}

export const MenuContext = createContext<MenuContextType | undefined>(undefined)

export const useMenuContext = (): MenuContextType => {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider')
  }
  return context
}
