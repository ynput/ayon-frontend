import { createContext } from 'react'
import { ProjectTableContextType } from './ProjectTableContext'

export const ProjectTableContext = createContext<ProjectTableContextType | undefined>(undefined)
