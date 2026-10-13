import { createContext, useContext } from 'react'
import type { ProjectDataContextProps } from './ProjectDataContext'

export const ProjectDataContext = createContext<ProjectDataContextProps | undefined>(undefined)

export const useProjectDataContext = () => {
  const context = useContext(ProjectDataContext)
  if (!context) {
    throw new Error('useProjectDataContext must be used within a ProjectDataProvider')
  }
  return context
}
