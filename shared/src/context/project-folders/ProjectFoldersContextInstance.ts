import { createContext, useContext } from 'react'
import type { ProjectFoldersContextValue } from './ProjectFoldersContext'

export const ProjectFoldersContext = createContext<ProjectFoldersContextValue | undefined>(
  undefined,
)

export const useProjectFoldersContext = () => {
  const context = useContext(ProjectFoldersContext)
  if (context === undefined) {
    throw new Error('useProjectFoldersContext must be used within a ProjectFoldersContextProvider')
  }
  return context
}

// non-throwing variant: returns undefined when no ProjectFoldersContextProvider is mounted
export const useOptionalProjectFoldersContext = () => useContext(ProjectFoldersContext)
