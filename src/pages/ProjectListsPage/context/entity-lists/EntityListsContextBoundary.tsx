import { FC, ReactNode } from 'react'
import NewListFromContext from '@pages/ProjectListsPage/components/NewListDialog/NewListFromContext'
import { EntityListsContextType, EntityListsProvider } from './EntityListsContext'
import { useEntityListsContext, useOptionalEntityListsContext } from './EntityListsContextInstance'

interface EntityListsContextBoundaryProps {
  projectName?: string
  includeDialog?: boolean
  children: (context: EntityListsContextType | undefined) => ReactNode
}

const ContextBridge: FC<{ children: (context: EntityListsContextType) => ReactNode }> = ({
  children,
}) => {
  const context = useEntityListsContext()
  return <>{children(context)}</>
}

export const EntityListsContextBoundary: FC<EntityListsContextBoundaryProps> = ({
  projectName,
  includeDialog = true,
  children,
}) => {
  const existingContext = useOptionalEntityListsContext()

  if (existingContext || !projectName) {
    return <>{children(existingContext)}</>
  }

  return (
    <EntityListsProvider projectName={projectName}>
      <ContextBridge>{children}</ContextBridge>
      {includeDialog && <NewListFromContext />}
    </EntityListsProvider>
  )
}

export default EntityListsContextBoundary
