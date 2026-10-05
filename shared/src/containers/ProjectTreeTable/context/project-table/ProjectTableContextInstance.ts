import { createContext, useContext } from 'react'
import type { ProjectTableContextType } from './ProjectTableContext'

export const ProjectTableContext = createContext<ProjectTableContextType | undefined>(undefined)

export const useProjectTableContext = () => {
  const context = useContext(ProjectTableContext)
  if (!context) {
    throw new Error('useProjectTableContext must be used within a ProjectTableProvider')
  }
  return context
}

export const useOptionalProjectTableContext = () => useContext(ProjectTableContext)
