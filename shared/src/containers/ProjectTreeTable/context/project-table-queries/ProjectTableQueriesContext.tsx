import { ReactNode } from 'react'
import { OperationModel, OperationsRequestModel } from '../../types/operations'
import { PatchOperation } from '../../types'
import { OperationWithRowId } from '../../hooks/useUpdateTableData'
import { ProjectTableQueriesContext } from './ProjectTableQueriesContextInstance'

export interface ProjectTableQueriesContextProps {
  updateEntities: ProjectTableQueriesProviderProps['updateEntities']
  getFoldersTasks: ProjectTableQueriesProviderProps['getFoldersTasks']
}

export interface ProjectTableQueriesProviderProps {
  children: ReactNode

  updateEntities: ({
    operations,
  }: {
    operations: OperationWithRowId[]
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
