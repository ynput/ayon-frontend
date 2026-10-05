import { ProjectOverviewContextType } from '@shared/containers'
import { createContext, useContext } from 'react'

export const ProjectOverviewContext = createContext<ProjectOverviewContextType | undefined>(
  undefined,
)

export const useProjectOverviewContext = () => {
  const context = useContext(ProjectOverviewContext)
  if (!context) {
    throw new Error('useProjectOverviewContext must be used within a ProjectOverviewProvider')
  }
  return context
}
