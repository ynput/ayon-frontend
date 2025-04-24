import { createContext, ReactNode, useContext } from 'react'
import { OperationModel, OperationsRequestModel } from '../types/operations'
import { PatchOperation } from '../types'

export interface ProjectTableQueriesContextProps {
  updateEntities: ProjectTableQueriesProviderProps['updateEntities']
  getFoldersTasks: ProjectTableQueriesProviderProps['getFoldersTasks']
}

const ProjectTableQueriesContext = createContext<ProjectTableQueriesContextProps | undefined>(
  undefined,
)

export interface ProjectTableQueriesProviderProps {
  children: ReactNode

  updateEntities: ({
    operations,
  }: {
    operations: OperationModel[]
    patchOperations?: PatchOperation[]
  }) => Promise<OperationsRequestModel | undefined>

  getFoldersTasks: (
    args: {
      parentIds: string[]
      filter?: string
      search?: string
    },
    force?: boolean,
  ) => Promise<any>
}

export const ProjectTableQueriesProvider = ({
  children,
  updateEntities,
  getFoldersTasks,
}: ProjectTableQueriesProviderProps) => {
  return (
    <ProjectTableQueriesContext.Provider
      value={{
        updateEntities,
        getFoldersTasks,
      }}
    >
      {children}
    </ProjectTableQueriesContext.Provider>
  )
}

export const useProjectTableQueriesContext = () => {
  const context = useContext(ProjectTableQueriesContext)
  if (!context) {
    throw new Error(
      'useProjectTableQueriesContext must be used within a ProjectTableQueriesProvider',
    )
  }
  return context
}
