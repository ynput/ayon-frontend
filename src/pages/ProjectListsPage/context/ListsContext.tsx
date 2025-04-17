import { createContext, useContext, useState, ReactNode } from 'react'
import { ExpandedState, RowSelectionState } from '@tanstack/react-table'

interface ListsContextValue {
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  expanded: ExpandedState
  setExpanded: React.Dispatch<React.SetStateAction<ExpandedState>>
}

const ListsContext = createContext<ListsContextValue | undefined>(undefined)

interface ListsProviderProps {
  children: ReactNode
}

export const ListsProvider = ({ children }: ListsProviderProps) => {
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [expanded, setExpanded] = useState<ExpandedState>({})

  return (
    <ListsContext.Provider
      value={{
        rowSelection,
        setRowSelection,
        expanded,
        setExpanded,
      }}
    >
      {children}
    </ListsContext.Provider>
  )
}

export const useListsContext = () => {
  const context = useContext(ListsContext)
  if (context === undefined) {
    throw new Error('useListsContext must be used within a ListsProvider')
  }
  return context
}

export default ListsContext
