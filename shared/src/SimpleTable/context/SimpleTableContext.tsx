import { ExpandedState, RowSelectionState, Table } from '@tanstack/react-table'
import { createContext, useContext, ReactNode } from 'react'

interface SimpleTableContextValue {
  // forwarded from props
  expanded?: ExpandedState
  setExpanded?: React.Dispatch<React.SetStateAction<ExpandedState>>
  onExpandedChange?: (expanded: ExpandedState) => void
  rowSelection: RowSelectionState
  setRowSelection: React.Dispatch<React.SetStateAction<RowSelectionState>>
  onRowSelectionChange?: (selection: RowSelectionState, table: Table<any>) => void
}

const SimpleTableContext = createContext<SimpleTableContextValue | undefined>(undefined)

interface SimpleTableProviderProps {
  children: ReactNode
  expanded?: SimpleTableContextValue['expanded']
  setExpanded?: SimpleTableContextValue['setExpanded']
  onExpandedChange?: SimpleTableContextValue['onExpandedChange']
  rowSelection: SimpleTableContextValue['rowSelection']
  setRowSelection: SimpleTableContextValue['setRowSelection']
  onRowSelectionChange?: SimpleTableContextValue['onRowSelectionChange']
}

export const SimpleTableProvider = ({ children, ...props }: SimpleTableProviderProps) => {
  return <SimpleTableContext.Provider value={{ ...props }}>{children}</SimpleTableContext.Provider>
}

export const useSimpleTableContext = () => {
  const context = useContext(SimpleTableContext)
  if (context === undefined) {
    throw new Error('useSimpleTableContext must be used within a SimpleTableProvider')
  }
  return context
}

export default SimpleTableContext
