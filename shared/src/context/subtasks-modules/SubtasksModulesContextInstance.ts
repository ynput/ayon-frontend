import { createContext, useContext } from 'react'
import type { SubtasksModulesContextType } from './SubtasksModulesContext'

export const SubtasksModulesContext = createContext<SubtasksModulesContextType | undefined>(
  undefined,
)

export const useSubtasksModulesContext = (): SubtasksModulesContextType => {
  const context = useContext(SubtasksModulesContext)
  if (!context) {
    throw new Error('useSubtasksModulesContext must be used within a SubtasksModulesProvider')
  }
  return context
}
