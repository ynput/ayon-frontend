import { createContext, ReactNode, useContext, useMemo } from 'react'
import { useGetProjectQuery } from '@queries/project/getProject'
import { ProjectModel } from '@api/rest/project'
import { useGetUsersAssigneeQuery } from '@queries/user/getUsers'
import useAttributeFields, { AttributeWithPermissions } from '../hooks/useAttributesList'
import { useUsersPageConfig } from '../hooks/useUserPageConfig'
import { SortingState } from '@tanstack/react-table'

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
  // column sorting
  columnSorting: SortingState
  setColumnSorting: (columnSorting: SortingState) => void
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

  // Get column sorting
  const [pageConfig, updatePageConfig, { isSuccess: columnsConfigReady }] = useUsersPageConfig({
    page: 'overview',
    projectName: projectName,
  })
  const { columnSorting = [] } = pageConfig as {
    columnSorting: SortingState
  }
  const setColumnSorting = async (sorting: SortingState) => {
    await updatePageConfig({ columnSorting: sorting })
  }

  // GET USERS
  const { data: usersData = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const users = usersData as User[]

  const isInitialized =
    isSuccessProject &&
    isSuccessAttribs &&
    !isFetchingProject &&
    !isFetchingAttribs &&
    columnsConfigReady

  const value = useMemo(
    () => ({
      isInitialized,
      isLoading: isFetchingProject || isFetchingAttribs,
      projectInfo,
      projectName,
      users,
      attribFields,
      columnSorting,
      setColumnSorting,
    }),
    [
      isInitialized,
      isFetchingProject,
      isFetchingAttribs,
      projectInfo,
      projectName,
      users,
      attribFields,
      columnSorting,
      setColumnSorting,
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
