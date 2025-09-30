import { FC, ReactNode } from 'react'
import NewListFromContext from '@pages/ProjectListsPage/components/NewListDialog/NewListFromContext'
import {
  EntityListsContextType,
  EntityListsProvider,
  useEntityListsContext,
  useOptionalEntityListsContext,
} from './EntityListsContext'
import { ListEntityType } from '@pages/ProjectListsPage/components/NewListDialog/NewListDialog'

interface EntityListsContextBoundaryProps {
  projectName?: string
  entityTypes?: ListEntityType[]
  includeDialog?: boolean
  children: (context: EntityListsContextType | undefined) => ReactNode
}

const DEFAULT_ENTITY_TYPES: ListEntityType[] = ['folder', 'task', 'version']

const ContextBridge: FC<{ children: (context: EntityListsContextType) => ReactNode }> = ({
  children,
}) => {
  const context = useEntityListsContext()
  return <>{children(context)}</>
}

export const EntityListsContextBoundary: FC<EntityListsContextBoundaryProps> = ({
  projectName,
  entityTypes = DEFAULT_ENTITY_TYPES,
  includeDialog = true,
  children,
}) => {
  const existingContext = useOptionalEntityListsContext()

  if (existingContext || !projectName) {
    return <>{children(existingContext)}</>
  }

  return (
    <EntityListsProvider projectName={projectName} entityTypes={entityTypes}>
      <ContextBridge>{children}</ContextBridge>
      {includeDialog && <NewListFromContext />}
    </EntityListsProvider>
  )
}

export default EntityListsContextBoundary
