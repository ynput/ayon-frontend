import { createContext, useContext } from 'react'
import type { ProjectTableQueriesContextProps } from './ProjectTableQueriesContext'

export const ProjectTableQueriesContext = createContext<
  ProjectTableQueriesContextProps | undefined
>(undefined)

export const useProjectTableQueriesContext = () => {
  const context = useContext(ProjectTableQueriesContext)
  if (!context) {
    throw new Error(
      'useProjectTableQueriesContext must be used within a ProjectTableQueriesProvider',
    )
  }
  return context
}
