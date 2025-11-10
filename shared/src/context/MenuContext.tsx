import React, { createContext, useContext, useState, ReactNode } from 'react'

interface MenuContextType {
  menuOpen: string | false
  setMenuOpen: (menuId: string | false) => void
  toggleMenuOpen: (menuId: string | false) => void
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

interface MenuProviderProps {
  children: ReactNode
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [menuOpen, setMenuOpenState] = useState<string | false>(false)

  const setMenuOpen = (menuId: string | false) => {
    setMenuOpenState(menuId)
  }

  const toggleMenuOpen = (menuId: string | false) => {
    // no payload means toggle off
    if (!menuId) {
      setMenuOpenState(false)
      return
    }

    // if payload is same as current state, toggle off
    if (menuId === menuOpen) {
      setMenuOpenState(false)
    } else {
      // else set payload
      setMenuOpenState(menuId)
    }
  }

  const value: MenuContextType = {
    menuOpen,
    setMenuOpen,
    toggleMenuOpen,
  }

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

export const useMenuContext = (): MenuContextType => {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error('useMenuContext must be used within a MenuProvider')
  }
  return context
}
