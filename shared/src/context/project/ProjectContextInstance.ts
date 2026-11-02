import { createContext, useContext } from 'react'
import type { ProjectContextValue } from './ProjectContext'

export const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectContextProvider')
  }
  return context
}

// non-throwing variant: returns undefined when no ProjectContextProvider is mounted
// (e.g. the cross-project UserDashboard) so callers can supply their own provider
export const useOptionalProjectContext = () => useContext(ProjectContext)
