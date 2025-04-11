import { createContext, ReactNode, useContext } from 'react'
import { useGetProjectQuery } from '@queries/project/getProject'
import { ProjectModel } from '@api/rest/project'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import useAttributeFields, { AttributeWithPermissions } from '../hooks/useAttributesList'

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
  attribFields: AttributeWithPermissions[]
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

  const isInitialized =
    isSuccessProject && isSuccessAttribs && !isFetchingProject && !isFetchingAttribs

  const { data: usersData = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const users = usersData as User[]

  return (
    <ProjectDataContext.Provider
      value={{
        isInitialized,
        isLoading: isFetchingProject || isFetchingAttribs,
        projectInfo,
        projectName,
        users,
        attribFields,
      }}
    >
      {children}
    </ProjectDataContext.Provider>
  )
}

export const useProjectDataContext = () => {
  const context = useContext(ProjectDataContext)
  if (!context) {
    throw new Error('useProjectDataContext must be used within a ProjectDataProvider')
  }
  return context
}
