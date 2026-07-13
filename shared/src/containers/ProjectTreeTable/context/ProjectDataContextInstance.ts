import { createContext } from 'react'
import { ProjectDataContextProps } from './ProjectDataContext'

export const ProjectDataContext = createContext<ProjectDataContextProps | undefined>(undefined)
