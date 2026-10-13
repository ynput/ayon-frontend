import { createContext, useContext } from 'react'
import type { GlobalContextType } from './GlobalContext'

export const GlobalContext = createContext<GlobalContextType | undefined>(undefined)

export const useGlobalContext = () => {
  const context = useContext(GlobalContext)

  // if (context === undefined) {
  //   throw new Error('useGlobalContext must be used within a GlobalProvider')
  // }

  return context || ({} as GlobalContextType)
}
