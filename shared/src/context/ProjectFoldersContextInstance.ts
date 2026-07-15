import { createContext } from 'react'
import { ProjectFoldersContextValue } from './ProjectFoldersContext'

export const ProjectFoldersContext = createContext<ProjectFoldersContextValue | undefined>(
  undefined,
)
