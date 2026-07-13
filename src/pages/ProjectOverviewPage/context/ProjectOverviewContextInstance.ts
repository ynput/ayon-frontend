import { ProjectOverviewContextType } from '@shared/containers'
import { createContext } from 'react'

export const ProjectOverviewContext = createContext<ProjectOverviewContextType | undefined>(
  undefined,
)
