import React, { createContext, useContext, ReactNode } from 'react'
import {
  SelectionCellsProvider,
  SelectionCellsContextType,
  useSelectionCellsContext,
} from './SelectionCellsContext'
import {
  SelectedRowsProvider,
  SelectedRowsContextProps,
  useSelectedRowsContext,
} from './SelectedRowsContext'

// Combined context type
export interface ProjectTableSelectionContextType
  extends SelectionCellsContextType,
    SelectedRowsContextProps {}

// Create the context
const ProjectTableSelectionContext = createContext<ProjectTableSelectionContextType | undefined>(
  undefined,
)

interface ProjectTableSelectionProviderProps {
  children: ReactNode
}

export const ProjectTableSelectionProvider: React.FC<ProjectTableSelectionProviderProps> = ({
  children,
}) => {
  // Compose the providers
  return (
    <SelectionCellsProvider>
      <SelectedRowsProvider>
        <ProjectTableSelectionConsumer>{children}</ProjectTableSelectionConsumer>
      </SelectedRowsProvider>
    </SelectionCellsProvider>
  )
}

// Internal consumer component to merge the contexts
const ProjectTableSelectionConsumer: React.FC<{ children: ReactNode }> = ({ children }) => {
  const cellsContext = useSelectionCellsContext()
  const rowsContext = useSelectedRowsContext()

  // Combine both contexts
  const combinedContext: ProjectTableSelectionContextType = {
    ...cellsContext,
    ...rowsContext,
  }

  return (
    <ProjectTableSelectionContext.Provider value={combinedContext}>
      {children}
    </ProjectTableSelectionContext.Provider>
  )
}

// Hook for consuming the combined context
export const useProjectTableSelection = (): ProjectTableSelectionContextType => {
  const context = useContext(ProjectTableSelectionContext)
  if (context === undefined) {
    throw new Error('useProjectTableSelection must be used within a ProjectTableSelectionProvider')
  }
  return context
}
