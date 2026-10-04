import { createContext, useContext } from 'react'

export const ShortcutsContext = createContext()

export function useShortcutsContext() {
  return useContext(ShortcutsContext)
}
