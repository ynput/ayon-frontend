import { createContext, useContext } from 'react'
import type { Dispatch, SetStateAction } from 'react'

export type Shortcut = {
  key: string
  action?: (hovered: MouseEvent | null, isMeta: boolean, event: KeyboardEvent) => unknown
  disabled?: boolean
  closest?: string
}

export type ShortcutsContextValue = {
  addShortcuts: (id: string, shortcuts: Shortcut[]) => void
  removeShortcuts: (id: string) => void
  setDisabled: Dispatch<SetStateAction<string[]>>
  setAllowed: Dispatch<SetStateAction<string[]>>
}

export const ShortcutsContext = createContext<ShortcutsContextValue | undefined>(undefined)

export const useShortcutsContext = (): ShortcutsContextValue => useContext(ShortcutsContext)!
