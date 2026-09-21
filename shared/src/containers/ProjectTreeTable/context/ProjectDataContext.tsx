import { ReactNode, useContext, useMemo } from 'react'
import { useGetUsersAssigneeQuery, useGetMyProjectPermissionsQuery } from '@shared/api'
import { AttributeEnumsProvider, useAttributeEnums } from '@shared/hooks'
import useAttributeFields, { ProjectTableAttribute } from '../hooks/useAttributesList'
import { useProjectContext } from '@shared/context/ProjectContext'
import { ProjectDataContext } from './ProjectDataContextInstance'

type User = {
  name: string
  fullName: string
}

export interface ProjectDataContextProps {
  isInitialized: boolean
  isLoading: boolean
  users: User[]
  // Attributes
  attribFields: ProjectTableAttribute[]
  writableFields?: string[]
  // Permissions
  canWriteNamePermission: boolean
  canWriteLabelPermission: boolean
}

interface ProjectDataProviderProps {
  children: ReactNode
  projectName: string
}

export const ProjectDataProvider = ({ children, projectName }: ProjectDataProviderProps) => {
  const { data: projectPermissions } = useGetMyProjectPermissionsQuery(
    { projectName },
    { skip: !projectName },
  )
  const { attribFields, writableFields, isLoading } = useAttributeFields({ projectPermissions })

  // dynamic enums are merged into data.enum, fetched only once a column, filter or slicer asks
  return (
    <AttributeEnumsProvider attributes={attribFields} projectName={projectName} lazy>
      <ProjectData
        projectName={projectName}
        projectPermissions={projectPermissions}
        writableFields={writableFields}
        isLoadingAttribs={isLoading}
      >
        {children}
      </ProjectData>
    </AttributeEnumsProvider>
  )
}

interface ProjectDataProps extends ProjectDataProviderProps {
  projectPermissions: ReturnType<typeof useGetMyProjectPermissionsQuery>['data']
  writableFields?: string[]
  isLoadingAttribs: boolean
}

const ProjectData = ({
  children,
  projectName,
  projectPermissions,
  writableFields,
  isLoadingAttribs,
}: ProjectDataProps) => {
  // GET PROJECT DATA
  const { isLoading: isLoadingProject, isSuccess: isSuccessProject } = useProjectContext()

  const { attrib_write } = projectPermissions || {}

  const resolvedAttribFields = useAttributeEnums<ProjectTableAttribute>()

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

  const isInitialized = isSuccessProject && !isLoadingProject && !isLoadingAttribs

  const value = useMemo(
    () => ({
      isInitialized,
      isLoading: isLoadingProject || isLoadingAttribs,

      users,
      attribFields: resolvedAttribFields,
      writableFields,
      canWriteNamePermission,
      canWriteLabelPermission,
    }),
    [
      isInitialized,
      isLoadingProject,
      isLoadingAttribs,

      users,
      resolvedAttribFields,
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
