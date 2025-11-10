import { createContext, useContext, useCallback, useMemo } from 'react'
import { useGetProjectQuery, useGetProductTypesQuery, useGetProjectAnatomyQuery } from '@shared/api'

import type {
  FolderType,
  TaskType,
  ProductTypeListItem,
  DefaultProductType,
  ProjectModel,
  Anatomy,
} from '@shared/api'
import { getEntityTypeIcon } from '@shared/util'

export type ProjectModelWithProducts = ProjectModel & {
  // Extend project with product types
  productTypes: ProductTypeListItem[]
}

const emptyProject: ProjectModelWithProducts = {
  name: '',
  code: '',
  productTypes: [],
  folderTypes: [],
  taskTypes: [],
  tags: [],
  statuses: [],
  createdAt: '',
  updatedAt: '',
  active: true,
  attrib: {},
  data: {},
  config: {},
  library: false,
  linkTypes: [],
  ownAttrib: [],
}

export interface ProjectContextValue extends ProjectModelWithProducts {
  projectName: string
  isLoading: boolean
  isSuccess: boolean
  isUninitialized: boolean
  error: any
  defaultProductType?: DefaultProductType
  anatomy: Anatomy
  refetch: () => void
  getProductType: (productType: string) => {
    icon: string
    color: string | undefined
  }
  getFolderType: (name: string) => FolderType | undefined
  getTaskType: (name: string) => TaskType | undefined
  getProductTypeOptions: () => { value: string; label: string; icon?: string; color?: string }[]
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined)

//
// ProjectProvider
//

interface ProjectProviderProps {
  projectName: string
  children: React.ReactNode
}

export const ProjectContextProvider: React.FC<ProjectProviderProps> = ({
  projectName,
  children,
}: ProjectProviderProps) => {
  // PROJECT
  const {
    data: project,
    isLoading,
    isFetching,
    isSuccess,
    isUninitialized,
    error,
    refetch: refetchProject,
  } = useGetProjectQuery({ projectName })
  // PRODUCT TYPES
  const {
    data: productTypesData,

    refetch: refetchProductTypes,
  } = useGetProductTypesQuery({ projectName })
  // ANATOMY
  const { data: anatomy = {}, refetch: refetchAnatomy } = useGetProjectAnatomyQuery({ projectName })

  // Shorthands to access project data and type casting
  // (we're referencing nested objects. no need to use useMemo for these)

  const productTypes = productTypesData?.productTypes || []
  const defaultProductType = productTypesData?.default
  //
  // Magic functions
  //

  // Folder types

  const getFolderType = useCallback(
    (name: string): FolderType | undefined => {
      return project?.folderTypes?.find((type: FolderType) => type.name === name)
    },
    [project],
  )

  // Task types

  const getTaskType = useCallback(
    (name: string): TaskType | undefined => {
      return project?.taskTypes?.find((type: TaskType) => type.name === name)
    },
    [project],
  )

  // Product types

  const getProductType = useCallback(
    (productType: string) => {
      const type = productTypes.find((t) => t.name === productType) || defaultProductType
      return {
        icon: type?.icon || getEntityTypeIcon('product'),
        color: type?.color,
      }
    },
    [productTypes, defaultProductType],
  )

  const getProductTypeOptions = useCallback((): {
    value: string
    label: string
    icon: string
  }[] => {
    // Return a list of product type ready to be used in a select input
    const result = productTypes.map((type) => ({
      value: type.name,
      label: type.name,
      icon: type.icon || defaultProductType?.icon || '',
      color: type.color || defaultProductType?.color || '',
    }))
    return result
  }, [productTypes])

  const refetch = useCallback(() => {
    refetchProject()
    refetchProductTypes()
    refetchAnatomy()
  }, [refetchProject, refetchProductTypes, refetchAnatomy])

  //
  // Put everything together
  //

  const functions = {
    getFolderType,
    getTaskType,
    getProductType,
    getProductTypeOptions,
    refetch,
  }

  const value = useMemo(
    () => ({
      ...emptyProject,
      ...project,
      projectName,
      productTypes: productTypes,
      anatomy,
      defaultProductType,
      isLoading: isLoading || isFetching,
      isSuccess: isSuccess,
      isUninitialized,
      error,
    }),
    [project, projectName, isLoading, error],
  )

  return (
    <ProjectContext.Provider value={{ ...value, ...functions }}>{children}</ProjectContext.Provider>
  )
}

export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProviderContext')
  }
  return context
}
