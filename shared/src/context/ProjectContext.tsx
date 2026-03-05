import { createContext, useContext, useCallback } from 'react'
import { useGetProjectQuery, useGetProjectAnatomyQuery } from '@shared/api'
import { getEntityTypeIcon } from '@shared/util'

import type {
  FolderType,
  TaskType,
  ProductTypeListItem,
  ProjectModel,
  Anatomy,
} from '@shared/api'

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
  } = useGetProjectQuery({ projectName }, { skip: !projectName })
  // ANATOMY
  const { data: anatomy = {}, refetch: refetchAnatomy } = useGetProjectAnatomyQuery(
    { projectName },
    { skip: !projectName },
  )

  // Shorthands to access project data and type casting
  // (we're referencing nested objects. no need to use useMemo for these)

  const defaultProductType = anatomy.product_base_types?.default
  const productTypes: ProductTypeListItem[] = (anatomy.product_base_types?.definitions || []).map(
    (t) => ({
      name: t.name || '',
      icon: t.icon,
      color: t.color,
    }),
  )
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
      const type = productTypes.find((t) => t.name === productType)
      return {
        icon: type?.icon || defaultProductType?.icon || getEntityTypeIcon('product'),
        color: type?.color || defaultProductType?.color,
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
      icon: type.icon || defaultProductType?.icon || getEntityTypeIcon('product'),
      color: type.color || defaultProductType?.color || '',
    }))
    return result
  }, [productTypes, defaultProductType])

  const refetch = useCallback(() => {
    refetchProject()
    refetchAnatomy()
  }, [refetchProject, refetchAnatomy])

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

  return (
    <ProjectContext.Provider
      value={{
        ...emptyProject,
        ...project,
        projectName,
        productTypes: productTypes,
        anatomy,
        isLoading: isLoading || isFetching,
        isSuccess: isSuccess,
        isUninitialized,
        error,
        ...functions,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export const useProjectContext = () => {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error('useProjectContext must be used within a ProjectProviderContext')
  }
  return context
}
