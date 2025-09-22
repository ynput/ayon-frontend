import { createContext, ReactNode, useContext, useMemo } from 'react'
import {
  useGetUsersAssigneeQuery,
  useGetProjectQuery,
  useGetMyProjectPermissionsQuery,
} from '@shared/api'
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
  writableFields?: string[]
  // Permissions
  canWriteNamePermission: boolean
  canWriteLabelPermission: boolean
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

  // GET PERMISSIONS
  const { data: projectPermissions } = useGetMyProjectPermissionsQuery(
    { projectName },
    { skip: !projectName },
  )
  const { attrib_write } = projectPermissions || {}

  const {
    attribFields,
    writableFields,
    isSuccess: isSuccessAttribs,
    isFetching: isFetchingAttribs,
  } = useAttributeFields({ projectPermissions })

  // GET USERS
  const { data: usersData = [] } = useGetUsersAssigneeQuery({ projectName }, { skip: !projectName })
  const users = usersData as User[]
  // Calculate individual permissions
  const canWriteNamePermission = useMemo((): boolean => {
    if (!attrib_write) return false
    // Check fields array for entity field permissions (name/label)
    if (!attrib_write.fields || attrib_write.fields.length === 0) {
      // If no fields specified, check if this is admin (empty attributes = unrestricted)
      if (!attrib_write.attributes || attrib_write.attributes.length === 0) return true
      return false // Has other attributes but no field permissions
    }
    return attrib_write.fields.includes('name')
  }, [attrib_write])

  const canWriteLabelPermission = useMemo((): boolean => {
    if (!attrib_write) return false
    // Check fields array for entity field permissions (name/label)
    if (!attrib_write.fields || attrib_write.fields.length === 0) {
      // If no fields specified, check if this is admin (empty attributes = unrestricted)
      if (!attrib_write.attributes || attrib_write.attributes.length === 0) return true
      return false // Has other attributes but no field permissions
    }
    return attrib_write.fields.includes('label')
  }, [attrib_write])

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
      writableFields,
      canWriteNamePermission,
      canWriteLabelPermission,
    }),
    [
      isInitialized,
      isFetchingProject,
      isFetchingAttribs,
      projectInfo,
      projectName,
      users,
      attribFields,
      writableFields,
      canWriteNamePermission,
      canWriteLabelPermission,
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
