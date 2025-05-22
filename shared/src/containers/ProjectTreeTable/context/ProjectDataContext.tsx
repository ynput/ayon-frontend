import { createContext, ReactNode, useContext, useMemo } from 'react'
import { useGetUsersAssigneeQuery, useGetProjectQuery } from '@shared/api'
import type { ProjectModel } from '@shared/api'
import useAttributeFields, { ProjectTableAttribute } from '../hooks/useAttributesList'

type User = {
  name: string
  fullName: string
}

export interface ProjectDataContextProps {
  isInitialized: boolean
  isLoading: boolean
  // Project Info
  projectInfo?: ProjectModel
  projectName: string
  users: User[]
  // Attributes
  attribFields: ProjectTableAttribute[]
}

const ProjectDataContext = createContext<ProjectDataContextProps | undefined>(undefined)

interface ProjectDataProviderProps {
  children: ReactNode
  projectName: string
}

export const ProjectDataProvider = ({ children, projectName }: ProjectDataProviderProps) => {
  // GET PROJECT DATA
  const {
    data: projectInfo,
    isSuccess: isSuccessProject,
    isFetching: isFetchingProject,
  } = useGetProjectQuery({ projectName }, { skip: !projectName })

  const {
    attribFields,
    isSuccess: isSuccessAttribs,
    isFetching: isFetchingAttribs,
  } = useAttributeFields({ projectName })

  // GET USERS
  const { data: usersData = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const users = usersData as User[]

  const isInitialized =
    isSuccessProject && isSuccessAttribs && !isFetchingProject && !isFetchingAttribs

  const value = useMemo(
    () => ({
      isInitialized,
      isLoading: isFetchingProject || isFetchingAttribs,
      projectInfo,
      projectName,
      users,
      attribFields,
    }),
    [
      isInitialized,
      isFetchingProject,
      isFetchingAttribs,
      projectInfo,
      projectName,
      users,
      attribFields,
    ],
  )

  return <ProjectDataContext.Provider value={value}>{children}</ProjectDataContext.Provider>
}

export const useProjectDataContext = () => {
  const context = useContext(ProjectDataContext)
  if (!context) {
    throw new Error('useProjectDataContext must be used within a ProjectDataProvider')
  }
  return context
}
