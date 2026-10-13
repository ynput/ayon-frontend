import React, { useState, ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { MenuContext, type MenuContextType } from './MenuContextInstance'

interface MenuProviderProps {
  children: ReactNode
  useNavigate: typeof useNavigate
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children, useNavigate }) => {
  const [menuOpen, setMenuOpenState] = useState<string | false>(false)
  const navigate = useNavigate()

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
    navigate,
  }

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}
