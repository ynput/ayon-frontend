import { createContext } from 'react'
import { SubtasksModulesContextType } from './SubtasksModulesContext'

export const SubtasksModulesContext = createContext<SubtasksModulesContextType | undefined>(
  undefined,
)
